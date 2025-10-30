import type {
  SpecializedAgent,
  EnhancedAgentConfig,
  AgentSelectionCriteria,
  CollaborationError,
  AgentMetrics
} from '../types/index.js';
import { EventEmitter } from 'eventemitter3';

export class AgentSelector extends EventEmitter {
  private agents: Map<string, SpecializedAgent>;
  private selectionStrategies: Map<string, SelectionStrategy>;
  private loadBalancingAlgorithm: LoadBalancingAlgorithm;

  constructor(private logger: any) {
    super();
    this.agents = new Map();
    this.selectionStrategies = new Map();
    this.loadBalancingAlgorithm = new LeastBusyLoadBalancer();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.selectionStrategies.set('performance', new PerformanceBasedStrategy());
    this.selectionStrategies.set('availability', new AvailabilityBasedStrategy());
    this.selectionStrategies.set('specialization', new SpecializationBasedStrategy());
    this.selectionStrategies.set('cost', new CostBasedStrategy());
    this.selectionStrategies.set('hybrid', new HybridStrategy());
  }

  // Register an agent with the selector
  registerAgent(agent: SpecializedAgent): void {
    this.agents.set(agent.id, agent);

    // Listen to agent state changes
    agent.on('state:changed', (newState: any) => {
      this.emit('agent:state_changed', agent.id, newState);
    });

    agent.on('metrics:updated', (metrics: AgentMetrics) => {
      this.emit('agent:metrics_updated', agent.id, metrics);
    });

    this.logger.info(`Registered agent: ${agent.id} (${agent.config.category})`);
  }

  // Unregister an agent
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.logger.info(`Unregistered agent: ${agentId}`);
    }
  }

  // Main agent selection method
  async selectAgents(
    criteria: AgentSelectionCriteria,
    context: Record<string, any> = {}
  ): Promise<AgentSelectionResult> {
    try {
      this.logger.info(`Starting agent selection for task type: ${criteria.taskType}`);

      // Get available agents
      const availableAgents = this.getAvailableAgents(criteria);

      if (availableAgents.length === 0) {
        throw new Error('No available agents found for the given criteria');
      }

      // Select appropriate strategy
      const strategy = this.selectionStrategies.get(criteria.priority) ||
                      this.selectionStrategies.get('hybrid')!;

      // Apply selection strategy
      const selectedAgents = await strategy.select(
        availableAgents,
        criteria,
        context
      );

      // Apply load balancing
      const balancedAgents = this.loadBalancingAlgorithm.balance(
        selectedAgents,
        criteria.maxAgents
      );

      // Create selection result
      const result: AgentSelectionResult = {
        agents: balancedAgents,
        strategy: strategy.name,
        confidence: this.calculateSelectionConfidence(balancedAgents, criteria),
        reasoning: this.generateSelectionReasoning(balancedAgents, criteria),
        alternatives: this.getAlternativeAgents(availableAgents, balancedAgents, criteria),
        timestamp: new Date(),
      };

      // Emit selection event
      this.emit('agents:selected', {
        criteria,
        result,
      });

      return result;

    } catch (error) {
      const collaborationError: CollaborationError = {
        id: `selection_error_${Date.now()}`,
        type: 'agent_selection_failed',
        message: `Failed to select agents: ${error.message}`,
        severity: 'high',
        recoverable: true,
        retryCount: 0,
        originalError: error,
        timestamp: new Date(),
      };

      this.emit('error:selection', collaborationError);
      throw error;
    }
  }

  // Get agents that match basic criteria
  private getAvailableAgents(criteria: AgentSelectionCriteria): SpecializedAgent[] {
    return Array.from(this.agents.values()).filter(agent => {
      // Check if agent is not excluded
      if (criteria.excludeAgents?.includes(agent.id)) {
        return false;
      }

      // Check if agent is available
      if (agent.getState().status === 'busy' || agent.getState().status === 'error') {
        return false;
      }

      // Check specialization match
      if (criteria.specialization.length > 0) {
        const hasSpecialization = criteria.specialization.some(spec =>
          agent.config.specialization.includes(spec)
        );
        if (!hasSpecialization) {
          return false;
        }
      }

      // Check capabilities
      if (criteria.requiredCapabilities.length > 0) {
        const hasCapabilities = criteria.requiredCapabilities.every(cap =>
          agent.config.capabilities?.includes(cap) ||
          agent.config.specialization.some(spec => spec.includes(cap))
        );
        if (!hasCapabilities) {
          return false;
        }
      }

      return true;
    });
  }

  // Calculate confidence score for selection
  private calculateSelectionConfidence(
    agents: SpecializedAgent[],
    criteria: AgentSelectionCriteria
  ): number {
    if (agents.length === 0) return 0;

    let totalConfidence = 0;

    for (const agent of agents) {
      let agentConfidence = 0.5; // Base confidence

      // Specialization match confidence
      const specializationMatch = criteria.specialization.filter(spec =>
        agent.config.specialization.includes(spec)
      ).length;
      agentConfidence += (specializationMatch / Math.max(criteria.specialization.length, 1)) * 0.3;

      // Capability match confidence
      const capabilityMatch = criteria.requiredCapabilities.filter(cap =>
        agent.config.capabilities?.includes(cap)
      ).length;
      agentConfidence += (capabilityMatch / Math.max(criteria.requiredCapabilities.length, 1)) * 0.2;

      // Performance confidence
      const metrics = agent.getMetrics();
      agentConfidence += metrics.successRate * 0.2;

      totalConfidence += agentConfidence;
    }

    return Math.min(totalConfidence / agents.length, 1.0);
  }

  // Generate human-readable reasoning for selection
  private generateSelectionReasoning(
    agents: SpecializedAgent[],
    criteria: AgentSelectionCriteria
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Selected ${agents.length} agent(s) based on ${criteria.priority} priority`);

    for (const agent of agents) {
      const reasons: string[] = [];

      // Specialization reasons
      const matchingSpecializations = criteria.specialization.filter(spec =>
        agent.config.specialization.includes(spec)
      );
      if (matchingSpecializations.length > 0) {
        reasons.push(`specializes in ${matchingSpecializations.join(', ')}`);
      }

      // Capability reasons
      const matchingCapabilities = criteria.requiredCapabilities.filter(cap =>
        agent.config.capabilities?.includes(cap)
      );
      if (matchingCapabilities.length > 0) {
        reasons.push(`has capabilities: ${matchingCapabilities.join(', ')}`);
      }

      // Performance reasons
      const metrics = agent.getMetrics();
      if (metrics.successRate > 0.9) {
        reasons.push(`high success rate (${(metrics.successRate * 100).toFixed(1)}%)`);
      }

      if (reasons.length > 0) {
        reasoning.push(`${agent.id}: ${reasons.join(', ')}`);
      }
    }

    return reasoning;
  }

  // Get alternative agents if primary selection fails
  private getAlternativeAgents(
    availableAgents: SpecializedAgent[],
    selectedAgents: SpecializedAgent[],
    criteria: AgentSelectionCriteria
  ): SpecializedAgent[] {
    return availableAgents
      .filter(agent => !selectedAgents.includes(agent))
      .slice(0, 3); // Top 3 alternatives
  }

  // Get agent by ID
  getAgent(agentId: string): SpecializedAgent | undefined {
    return this.agents.get(agentId);
  }

  // Get all registered agents
  getAllAgents(): SpecializedAgent[] {
    return Array.from(this.agents.values());
  }

  // Get agents by category
  getAgentsByCategory(category: string): SpecializedAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.config.category === category
    );
  }

  // Get agents by capability
  getAgentsByCapability(capability: string): SpecializedAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.config.capabilities?.includes(capability) ||
      agent.config.specialization.some(spec => spec.includes(capability))
    );
  }

  // Update load balancing algorithm
  setLoadBalancingAlgorithm(algorithm: LoadBalancingAlgorithm): void {
    this.loadBalancingAlgorithm = algorithm;
    this.logger.info(`Updated load balancing algorithm to: ${algorithm.name}`);
  }

  // Register custom selection strategy
  registerSelectionStrategy(name: string, strategy: SelectionStrategy): void {
    this.selectionStrategies.set(name, strategy);
    this.logger.info(`Registered custom selection strategy: ${name}`);
  }

  // Get agent statistics
  getAgentStatistics(): AgentStatistics {
    const agents = Array.from(this.agents.values());
    const stats: AgentStatistics = {
      total: agents.length,
      byCategory: {},
      byStatus: {},
      averagePerformance: 0,
      utilizationRate: 0,
    };

    let totalPerformance = 0;
    let busyCount = 0;

    for (const agent of agents) {
      // Category statistics
      const category = agent.config.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Status statistics
      const status = agent.getState().status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Performance statistics
      const metrics = agent.getMetrics();
      totalPerformance += metrics.successRate;

      if (status === 'busy') {
        busyCount++;
      }
    }

    stats.averagePerformance = agents.length > 0 ? totalPerformance / agents.length : 0;
    stats.utilizationRate = agents.length > 0 ? busyCount / agents.length : 0;

    return stats;
  }
}

// Supporting interfaces and classes
interface AgentSelectionResult {
  agents: SpecializedAgent[];
  strategy: string;
  confidence: number;
  reasoning: string[];
  alternatives: SpecializedAgent[];
  timestamp: Date;
}

interface AgentStatistics {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  averagePerformance: number;
  utilizationRate: number;
}

abstract class SelectionStrategy {
  abstract readonly name: string;

  abstract select(
    agents: SpecializedAgent[],
    criteria: AgentSelectionCriteria,
    context: Record<string, any>
  ): Promise<SpecializedAgent[]>;
}

// Strategy implementations
class PerformanceBasedStrategy extends SelectionStrategy {
  readonly name = 'performance';

  async select(
    agents: SpecializedAgent[],
    criteria: AgentSelectionCriteria,
    context: Record<string, any>
  ): Promise<SpecializedAgent[]> {
    return agents
      .sort((a, b) => {
        const metricsA = a.getMetrics();
        const metricsB = b.getMetrics();

        // Sort by success rate, then by average completion time
        if (metricsA.successRate !== metricsB.successRate) {
          return metricsB.successRate - metricsA.successRate;
        }
        return metricsA.averageCompletionTime - metricsB.averageCompletionTime;
      })
      .slice(0, criteria.maxAgents);
  }
}

class AvailabilityBasedStrategy extends SelectionStrategy {
  readonly name = 'availability';

  async select(
    agents: SpecializedAgent[],
    criteria: AgentSelectionCriteria,
    context: Record<string, any>
  ): Promise<SpecializedAgent[]> {
    return agents
      .filter(agent => agent.getState().status === 'idle')
      .sort((a, b) => a.getQueueSize() - b.getQueueSize())
      .slice(0, criteria.maxAgents);
  }
}

class SpecializationBasedStrategy extends SelectionStrategy {
  readonly name = 'specialization';

  async select(
    agents: SpecializedAgent[],
    criteria: AgentSelectionCriteria,
    context: Record<string, any>
  ): Promise<SpecializedAgent[]> {
    return agents
      .map(agent => ({
        agent,
        score: this.calculateSpecializationScore(agent, criteria)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, criteria.maxAgents)
      .map(item => item.agent);
  }

  private calculateSpecializationScore(
    agent: SpecializedAgent,
    criteria: AgentSelectionCriteria
  ): number {
    let score = 0;

    // Specialization match score
    for (const spec of criteria.specialization) {
      if (agent.config.specialization.includes(spec)) {
        score += 2;
      }
    }

    // Capability match score
    for (const cap of criteria.requiredCapabilities) {
      if (agent.config.capabilities?.includes(cap)) {
        score += 1;
      }
    }

    return score;
  }
}

class CostBasedStrategy extends SelectionStrategy {
  readonly name = 'cost';

  async select(
    agents: SpecializedAgent[],
    criteria: AgentSelectionCriteria,
    context: Record<string, any>
  ): Promise<SpecializedAgent[]> {
    // For now, prioritize agents with lower resource requirements
    return agents
      .sort((a, b) => {
        const perfA = a.config.performance;
        const perfB = b.config.performance;

        // Lower max concurrent tasks = lower cost
        return perfA.maxConcurrentTasks - perfB.maxConcurrentTasks;
      })
      .slice(0, criteria.maxAgents);
  }
}

class HybridStrategy extends SelectionStrategy {
  readonly name = 'hybrid';

  async select(
    agents: SpecializedAgent[],
    criteria: AgentSelectionCriteria,
    context: Record<string, any>
  ): Promise<SpecializedAgent[]> {
    return agents
      .map(agent => ({
        agent,
        score: this.calculateHybridScore(agent, criteria)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, criteria.maxAgents)
      .map(item => item.agent);
  }

  private calculateHybridScore(
    agent: SpecializedAgent,
    criteria: AgentSelectionCriteria
  ): number {
    let score = 0;

    // Performance component (40%)
    const metrics = agent.getMetrics();
    score += metrics.successRate * 0.4;

    // Availability component (30%)
    if (agent.getState().status === 'idle') {
      score += 0.3;
    }

    // Specialization component (30%)
    const specializationMatch = criteria.specialization.filter(spec =>
      agent.config.specialization.includes(spec)
    ).length;
    score += (specializationMatch / Math.max(criteria.specialization.length, 1)) * 0.3;

    return score;
  }
}

abstract class LoadBalancingAlgorithm {
  abstract readonly name: string;

  abstract balance(
    agents: SpecializedAgent[],
    maxAgents: number
  ): SpecializedAgent[];
}

class LeastBusyLoadBalancer extends LoadBalancingAlgorithm {
  readonly name = 'least_busy';

  balance(agents: SpecializedAgent[], maxAgents: number): SpecializedAgent[] {
    return agents
      .sort((a, b) => a.getQueueSize() - b.getQueueSize())
      .slice(0, maxAgents);
  }
}

class RoundRobinLoadBalancer extends LoadBalancingAlgorithm {
  readonly name = 'round_robin';
  private lastIndex = 0;

  balance(agents: SpecializedAgent[], maxAgents: number): SpecializedAgent[] {
    const selected: SpecializedAgent[] = [];

    for (let i = 0; i < Math.min(maxAgents, agents.length); i++) {
      const index = (this.lastIndex + i) % agents.length;
      selected.push(agents[index]);
    }

    this.lastIndex = (this.lastIndex + maxAgents) % agents.length;
    return selected;
  }
}

class BestFitLoadBalancer extends LoadBalancingAlgorithm {
  readonly name = 'best_fit';

  balance(agents: SpecializedAgent[], maxAgents: number): SpecializedAgent[] {
    return agents
      .sort((a, b) => {
        // Prefer agents with optimal queue size (not empty, not full)
        const queueA = a.getQueueSize();
        const queueB = b.getQueueSize();

        const optimalA = Math.abs(queueA - 2);
        const optimalB = Math.abs(queueB - 2);

        return optimalA - optimalB;
      })
      .slice(0, maxAgents);
  }
}