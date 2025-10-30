import type { AgentCapability, AgentSelectionCriteria, SubTask } from './types.js';
import type { EnhancedAgentConfig } from '../types/index.js';
import { EventEmitter } from 'eventemitter3';

export class AgentSelector {
  private agents: Map<string, AgentCapability> = new Map();
  private eventBus: EventEmitter;
  private logger: any;

  constructor(eventBus: EventEmitter, logger: any) {
    this.eventBus = eventBus;
    this.logger = logger;
  }

  registerAgent(agentConfig: EnhancedAgentConfig, performance: AgentCapability['performance']): void {
    const capability: AgentCapability = {
      agentId: agentConfig.id,
      category: agentConfig.category,
      capabilities: agentConfig.capabilities || [],
      performance,
      availability: {
        status: 'idle',
        queueSize: 0,
        maxConcurrent: agentConfig.performance.maxConcurrentTasks
      },
      collaboration: agentConfig.collaboration
    };

    this.agents.set(agentConfig.id, capability);
    this.logger.info(`Agent registered for selection: ${agentConfig.id}`, { category: agentConfig.category });
    this.eventBus.emit('selector:agent-registered', capability);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.logger.info(`Agent unregistered from selection: ${agentId}`);
    this.eventBus.emit('selector:agent-unregistered', agentId);
  }

  async selectOptimalAgent(
    subtask: SubTask,
    criteria?: Partial<AgentSelectionCriteria>
  ): Promise<string | null> {
    this.logger.info(`Selecting agent for subtask: ${subtask.type}`, {
      requiredCapabilities: subtask.requiredCapabilities
    });

    try {
      // Get all available agents
      const availableAgents = this.getAvailableAgents();

      if (availableAgents.length === 0) {
        this.logger.warn('No agents available for task');
        return null;
      }

      // Filter agents based on required capabilities
      const capableAgents = this.filterAgentsByCapabilities(
        availableAgents,
        subtask.requiredCapabilities
      );

      if (capableAgents.length === 0) {
        this.logger.warn('No agents with required capabilities available');
        return null;
      }

      // Apply additional filtering criteria
      const filteredAgents = this.applySelectionCriteria(
        capableAgents,
        subtask,
        criteria
      );

      if (filteredAgents.length === 0) {
        this.logger.warn('No agents meet selection criteria');
        return null;
      }

      // Score and rank agents
      const scoredAgents = await this.scoreAgents(filteredAgents, subtask);

      // Select the best agent
      const selectedAgent = this.selectBestAgent(scoredAgents);

      this.logger.info(`Selected agent: ${selectedAgent.agentId}`, {
        score: selectedAgent.score,
        reasoning: selectedAgent.reasoning
      });

      this.eventBus.emit('selector:agent-selected', {
        subtaskId: subtask.id,
        agentId: selectedAgent.agentId,
        score: selectedAgent.score
      });

      return selectedAgent.agentId;

    } catch (error) {
      this.logger.error(`Agent selection failed: ${error.message}`);
      return null;
    }
  }

  async selectCollaborativeTeam(
    subtasks: SubTask[],
    primaryAgentId?: string
  ): Promise<{
    primary: string;
    collaborators: Array<{
      agentId: string;
      subtaskIds: string[];
      role: string;
    }>;
  }> {
    this.logger.info(`Selecting collaborative team for ${subtasks.length} subtasks`);

    const team = {
      primary: '',
      collaborators: [] as Array<{
        agentId: string;
        subtaskIds: string[];
        role: string;
      }>
    };

    try {
      // Select primary agent if not provided
      if (primaryAgentId) {
        team.primary = primaryAgentId;
      } else {
        // Select an agent for the most critical subtask as primary
        const criticalSubtask = subtasks.find(st => st.priority === 'critical') || subtasks[0];
        team.primary = (await this.selectOptimalAgent(criticalSubtask)) || '';
      }

      if (!team.primary) {
        throw new Error('No primary agent available');
      }

      const primaryCapability = this.agents.get(team.primary);
      if (!primaryCapability) {
        throw new Error('Primary agent not found');
      }

      // Select collaborators for remaining subtasks
      for (const subtask of subtasks) {
        if (subtask.assignedAgent === team.primary) continue; // Skip primary's assigned tasks

        // Find agents that can collaborate with primary
        const collaborators = this.findCollaboratingAgents(
          primaryCapability,
          subtask.requiredCapabilities
        );

        if (collaborators.length > 0) {
          const bestCollaborator = await this.selectOptimalAgent(subtask, {
            collaboration: {
              canCollaborate: [team.primary]
            }
          });

          if (bestCollaborator) {
            team.collaborators.push({
              agentId: bestCollaborator,
              subtaskIds: [subtask.id],
              role: this.determineCollaboratorRole(subtask.type)
            });
          }
        }
      }

      this.logger.info(`Team selected successfully`, {
        primary: team.primary,
        collaboratorCount: team.collaborators.length
      });

      return team;

    } catch (error) {
      this.logger.error(`Team selection failed: ${error.message}`);
      throw error;
    }
  }

  private getAvailableAgents(): AgentCapability[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.availability.status === 'idle' ||
               agent.availability.queueSize < agent.availability.maxConcurrent
    );
  }

  private filterAgentsByCapabilities(
    agents: AgentCapability[],
    requiredCapabilities: string[]
  ): AgentCapability[] {
    return agents.filter(agent =>
      requiredCapabilities.every(capability =>
        agent.capabilities.includes(capability) ||
        agent.category === capability
      )
    );
  }

  private applySelectionCriteria(
    agents: AgentCapability[],
    subtask: SubTask,
    criteria?: Partial<AgentSelectionCriteria>
  ): AgentCapability[] {
    let filtered = [...agents];

    if (!criteria) return filtered;

    // Performance criteria
    if (criteria.performance) {
      if (criteria.performance.minSuccessRate) {
        filtered = filtered.filter(agent =>
          agent.performance.successRate >= criteria.performance!.minSuccessRate
        );
      }
      if (criteria.performance.maxAverageTime) {
        filtered = filtered.filter(agent =>
          agent.performance.averageTime <= criteria.performance!.maxAverageTime
        );
      }
    }

    // Availability criteria
    if (criteria.availability) {
      if (criteria.availability.requireIdle) {
        filtered = filtered.filter(agent =>
          agent.availability.status === 'idle'
        );
      }
      if (criteria.availability.maxQueueSize) {
        filtered = filtered.filter(agent =>
          agent.availability.queueSize <= criteria.availability!.maxQueueSize
        );
      }
    }

    // Collaboration criteria
    if (criteria.collaboration) {
      if (criteria.collaboration.canCollaborate) {
        filtered = filtered.filter(agent =>
          agent.collaboration.canWorkWith.some(cap =>
            criteria.collaboration!.canCollaborate!.includes(cap)
          )
        );
      }
      if (criteria.collaboration.preferredRole) {
        filtered = filtered.filter(agent => {
          if (criteria.collaboration!.preferredRole === 'primary') {
            return !agent.collaboration.preferredAsSubagent;
          } else {
            return agent.collaboration.preferredAsSubagent;
          }
        });
      }
    }

    return filtered;
  }

  private async scoreAgents(
    agents: AgentCapability[],
    subtask: SubTask
  ): Promise<Array<{ agent: AgentCapability; score: number; reasoning: string }>> {
    const scored = [];

    for (const agent of agents) {
      let score = 0;
      const reasons: string[] = [];

      // Capability matching score (0-40)
      const capabilityScore = this.calculateCapabilityScore(agent, subtask);
      score += capabilityScore * 0.4;
      reasons.push(`Capability match: ${(capabilityScore * 100).toFixed(1)}%`);

      // Performance score (0-30)
      const performanceScore = this.calculatePerformanceScore(agent);
      score += performanceScore * 0.3;
      reasons.push(`Performance: ${(performanceScore * 100).toFixed(1)}%`);

      // Availability score (0-20)
      const availabilityScore = this.calculateAvailabilityScore(agent);
      score += availabilityScore * 0.2;
      reasons.push(`Availability: ${(availabilityScore * 100).toFixed(1)}%`);

      // Specialization score (0-10)
      const specializationScore = this.calculateSpecializationScore(agent, subtask);
      score += specializationScore * 0.1;
      reasons.push(`Specialization: ${(specializationScore * 100).toFixed(1)}%`);

      scored.push({
        agent,
        score,
        reasoning: reasons.join(', ')
      });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  private calculateCapabilityScore(agent: AgentCapability, subtask: SubTask): number {
    if (subtask.requiredCapabilities.length === 0) return 1.0;

    const matchCount = subtask.requiredCapabilities.filter(cap =>
      agent.capabilities.includes(cap) || agent.category === cap
    ).length;

    return matchCount / subtask.requiredCapabilities.length;
  }

  private calculatePerformanceScore(agent: AgentCapability): number {
    // Combine success rate and speed (inverse of average time)
    const successScore = agent.performance.successRate;
    const speedScore = Math.max(0, 1 - (agent.performance.averageTime / 60)); // Normalize to 60 minutes
    const specializationScore = agent.performance.specializationScore;

    return (successScore * 0.5 + speedScore * 0.3 + specializationScore * 0.2);
  }

  private calculateAvailabilityScore(agent: AgentCapability): number {
    if (agent.availability.status === 'idle') return 1.0;

    const queueUtilization = agent.availability.queueSize / agent.availability.maxConcurrent;
    return Math.max(0, 1 - queueUtilization);
  }

  private calculateSpecializationScore(agent: AgentCapability, subtask: SubTask): number {
    // Check if agent is specialized for this type of task
    if (agent.category === subtask.type) return 1.0;
    if (agent.capabilities.includes(subtask.type)) return 0.8;
    return 0.5;
  }

  private selectBestAgent(scoredAgents: Array<{ agent: AgentCapability; score: number; reasoning: string }>): {
    agentId: string;
    score: number;
    reasoning: string;
  } {
    const best = scoredAgents[0];
    return {
      agentId: best.agent.agentId,
      score: best.score,
      reasoning: best.reasoning
    };
  }

  private findCollaboratingAgents(
    primaryAgent: AgentCapability,
    requiredCapabilities: string[]
  ): AgentCapability[] {
    return Array.from(this.agents.values()).filter(agent => {
      if (agent.agentId === primaryAgent.agentId) return false;

      // Check if can collaborate
      const canCollaborate = primaryAgent.collaboration.canWorkWith.includes(agent.category) ||
                            agent.collaboration.canWorkWith.includes(primaryAgent.category);

      // Check if has required capabilities
      const hasCapabilities = requiredCapabilities.some(cap =>
        agent.capabilities.includes(cap) || agent.category === cap
      );

      return canCollaborate && hasCapabilities;
    });
  }

  private determineCollaboratorRole(subtaskType: string): string {
    const roleMap: Record<string, string> = {
      'code_generation': 'developer',
      'debugging': 'debugger',
      'testing': 'tester',
      'documentation': 'writer',
      'architecture': 'architect',
      'security': 'security_specialist',
      'analysis': 'analyzer',
      'integration': 'integrator'
    };

    return roleMap[subtaskType] || 'collaborator';
  }

  // Agent performance tracking
  updateAgentPerformance(agentId: string, performance: Partial<AgentCapability['performance']>): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      Object.assign(agent.performance, performance);
      this.logger.info(`Updated agent performance: ${agentId}`, performance);
      this.eventBus.emit('selector:performance-updated', { agentId, performance });
    }
  }

  updateAgentAvailability(agentId: string, availability: Partial<AgentCapability['availability']>): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      Object.assign(agent.availability, availability);
      this.logger.info(`Updated agent availability: ${agentId}`, availability);
      this.eventBus.emit('selector:availability-updated', { agentId, availability });
    }
  }

  // Analytics and monitoring
  getAgentAnalytics(): {
    totalAgents: number;
    activeAgents: number;
    busyAgents: number;
    averagePerformance: number;
    categoryDistribution: Record<string, number>;
  } {
    const agents = Array.from(this.agents.values());

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.availability.status !== 'offline').length,
      busyAgents: agents.filter(a => a.availability.status === 'busy').length,
      averagePerformance: agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length,
      categoryDistribution: agents.reduce((dist, a) => {
        dist[a.category] = (dist[a.category] || 0) + 1;
        return dist;
      }, {} as Record<string, number>)
    };
  }
}