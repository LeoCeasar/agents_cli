import type { Task, AgentRegistry } from '@agent-graph/core';
import type { SubTask, TaskDecompositionResult, CollaborationPlan } from './types/index.js';
import type { SpecializedAgent } from '../base/SpecializedAgent.js';
import { TaskDecomposer } from './TaskDecomposer.js';
import { AgentSelector } from './AgentSelector.js';
import { EventEmitter } from 'eventemitter3';

export interface CollaborationOptions {
  maxParallelTasks?: number;
  timeoutMs?: number;
  retryAttempts?: number;
  enableLoadBalancing?: boolean;
  enableFailover?: boolean;
}

export interface CollaborationResult {
  taskId: string;
  success: boolean;
  results: Array<{
    subtaskId: string;
    agentId: string;
    result: any;
    duration: number;
    success: boolean;
    error?: string;
  }>;
  totalDuration: number;
  summary: {
    subtasksCompleted: number;
    subtasksFailed: number;
    agentsInvolved: string[];
    averageAgentTime: number;
  };
}

export class CollaborationManager {
  private taskDecomposer: TaskDecomposer;
  private agentSelector: AgentSelector;
  private agentRegistry: AgentRegistry;
  private eventBus: EventEmitter;
  private logger: any;
  private options: CollaborationOptions;

  // Track ongoing collaborations
  private activeCollaborations = new Map<string, {
    decomposition: TaskDecompositionResult;
    startTime: number;
    agents: Map<string, SpecializedAgent>;
    results: Map<string, any>;
    status: 'setup' | 'executing' | 'completed' | 'failed' | 'cancelled';
  }>();

  constructor(
    taskManager: any,
    agentRegistry: AgentRegistry,
    eventBus: EventEmitter,
    logger: any,
    options: CollaborationOptions = {}
  ) {
    this.taskDecomposer = new TaskDecomposer(taskManager, logger);
    this.agentSelector = new AgentSelector(eventBus, logger);
    this.agentRegistry = agentRegistry;
    this.eventBus = eventBus;
    this.logger = logger;
    this.options = {
      maxParallelTasks: 3,
      timeoutMs: 300000, // 5 minutes
      retryAttempts: 2,
      enableLoadBalancing: true,
      enableFailover: true,
      ...options
    };

    this.setupEventHandlers();
  }

  async orchestrateCollaboration(task: Task): Promise<CollaborationResult> {
    this.logger.info(`Starting collaboration for task: ${task.description}`, { taskId: task.id });

    const startTime = Date.now();
    const collaborationId = task.id;

    try {
      // Phase 1: Task decomposition
      this.updateCollaborationStatus(collaborationId, 'setup');
      const decomposition = await this.taskDecomposer.decomposeTask(task);

      // Phase 2: Agent selection and team formation
      const team = await this.selectCollaborationTeam(decomposition);

      // Phase 3: Execute collaboration
      this.updateCollaborationStatus(collaborationId, 'executing');
      const results = await this.executeCollaboration(decomposition, team);

      // Phase 4: Finalize and return results
      this.updateCollaborationStatus(collaborationId, 'completed');
      const totalDuration = Date.now() - startTime;

      const result: CollaborationResult = {
        taskId: task.id,
        success: results.every(r => r.success),
        results,
        totalDuration,
        summary: this.generateSummary(results, totalDuration)
      };

      this.logger.info(`Collaboration completed for task: ${task.id}`, {
        success: result.success,
        duration: totalDuration,
        subtasks: results.length
      });

      this.eventBus.emit('collaboration:completed', result);
      return result;

    } catch (error) {
      this.updateCollaborationStatus(collaborationId, 'failed');
      this.logger.error(`Collaboration failed for task: ${task.id}`, error);

      const result: CollaborationResult = {
        taskId: task.id,
        success: false,
        results: [],
        totalDuration: Date.now() - startTime,
        summary: {
          subtasksCompleted: 0,
          subtasksFailed: 0,
          agentsInvolved: [],
          averageAgentTime: 0
        }
      };

      this.eventBus.emit('collaboration:failed', { taskId: task.id, error });
      return result;
    }
  }

  private async selectCollaborationTeam(decomposition: TaskDecompositionResult): Promise<{
    primary: string;
    collaborators: Array<{
      agentId: string;
      subtaskIds: string[];
      role: string;
    }>;
  }> {
    // Select collaborative team for all subtasks
    return await this.agentSelector.selectCollaborativeTeam(decomposition.subtasks);
  }

  private async executeCollaboration(
    decomposition: TaskDecompositionResult,
    team: {
      primary: string;
      collaborators: Array<{
        agentId: string;
        subtaskIds: string[];
        role: string;
      }>;
    }
  ): Promise<CollaborationResult['results']> {
    const results: CollaborationResult['results'] = [];
    const agents = new Map<string, SpecializedAgent>();

    // Get agent instances
    const primaryAgent = this.agentRegistry.get(team.primary) as SpecializedAgent;
    if (!primaryAgent) {
      throw new Error(`Primary agent not found: ${team.primary}`);
    }
    agents.set(team.primary, primaryAgent);

    for (const collaborator of team.collaborators) {
      const agent = this.agentRegistry.get(collaborator.agentId) as SpecializedAgent;
      if (!agent) {
        throw new Error(`Collaborator agent not found: ${collaborator.agentId}`);
      }
      agents.set(collaborator.agentId, agent);
    }

    // Execute based on the execution plan
    for (const phase of decomposition.executionPlan.phases) {
      this.logger.info(`Executing phase: ${phase.name}`, {
        mode: phase.mode,
        subtasks: phase.tasks.length
      });

      if (phase.mode === 'sequential') {
        await this.executeSequentialPhase(phase, decomposition.subtasks, agents, results);
      } else {
        await this.executeParallelPhase(phase, decomposition.subtasks, agents, results);
      }
    }

    return results;
  }

  private async executeSequentialPhase(
    phase: TaskDecompositionResult['executionPlan']['phases'][0],
    allSubtasks: SubTask[],
    agents: Map<string, SpecializedAgent>,
    results: CollaborationResult['results']
  ): Promise<void> {
    for (const subtaskId of phase.tasks) {
      const subtask = allSubtasks.find(st => st.id === subtaskId);
      if (!subtask) continue;

      const result = await this.executeSubtask(subtask, agents);
      results.push(result);
    }
  }

  private async executeParallelPhase(
    phase: TaskDecompositionResult['executionPlan']['phases'][0],
    allSubtasks: SubTask[],
    agents: Map<string, SpecializedAgent>,
    results: CollaborationResult['results']
  ): Promise<void> {
    const tasks = phase.tasks.map(subtaskId => {
      const subtask = allSubtasks.find(st => st.id === subtaskId);
      if (!subtask) return null;
      return this.executeSubtask(subtask, agents);
    }).filter(Boolean);

    // Execute with concurrency limit
    const maxParallel = this.options.maxParallelTasks || 3;
    const chunks = this.chunkArray(tasks, maxParallel);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(chunk);
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error('Subtask execution failed', result.reason);
        }
      }
    }
  }

  private async executeSubtask(
    subtask: SubTask,
    agents: Map<string, SpecializedAgent>
  ): Promise<CollaborationResult['results'][0]> {
    const startTime = Date.now();

    try {
      // Select optimal agent for this subtask
      const agentId = await this.agentSelector.selectOptimalAgent(subtask);
      if (!agentId) {
        throw new Error(`No agent available for subtask: ${subtask.id}`);
      }

      const agent = agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Execute the subtask
      const task = this.convertSubtaskToTask(subtask);
      const result = await agent.execute(task);

      const duration = Date.now() - startTime;

      this.logger.debug(`Subtask completed: ${subtask.id}`, {
        agentId,
        duration,
        success: true
      });

      return {
        subtaskId: subtask.id,
        agentId,
        result: result.output,
        duration,
        success: true
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Subtask failed: ${subtask.id}`, error);

      // Retry logic
      if (this.options.retryAttempts && this.options.retryAttempts > 0) {
        this.logger.info(`Retrying subtask: ${subtask.id}`);
        // Implement retry logic here
      }

      return {
        subtaskId: subtask.id,
        agentId: 'unknown',
        result: null,
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private convertSubtaskToTask(subtask: SubTask): Task {
    return {
      id: subtask.id,
      type: subtask.type,
      description: subtask.description,
      status: 'pending',
      priority: subtask.priority,
      input: subtask.input,
      createdAt: subtask.createdAt,
      updatedAt: subtask.updatedAt
    };
  }

  private generateSummary(
    results: CollaborationResult['results'],
    totalDuration: number
  ): CollaborationResult['summary'] {
    const completed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const agentsInvolved = [...new Set(results.map(r => r.agentId))];
    const averageTime = results.length > 0
      ? results.reduce((sum, r) => sum + r.duration, 0) / results.length
      : 0;

    return {
      subtasksCompleted: completed,
      subtasksFailed: failed,
      agentsInvolved,
      averageAgentTime: averageTime
    };
  }

  private updateCollaborationStatus(collaborationId: string, status: 'setup' | 'executing' | 'completed' | 'failed' | 'cancelled'): void {
    const collaboration = this.activeCollaborations.get(collaborationId);
    if (collaboration) {
      collaboration.status = status;
      this.eventBus.emit('collaboration:status-updated', { collaborationId, status });
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private setupEventHandlers(): void {
    // Handle agent events
    this.eventBus.on('agent:completed', (agentId, result) => {
      this.updateAgentPerformance(agentId, { success: true, duration: result.duration || 0 });
    });

    this.eventBus.on('agent:failed', (agentId, error) => {
      this.updateAgentPerformance(agentId, { success: false, duration: 0 });
    });

    // Handle performance updates from agents
    this.eventBus.on('metrics:updated', (metrics) => {
      this.agentSelector.updateAgentPerformance(metrics.agentId, {
        successRate: metrics.successRate,
        averageTime: metrics.averageCompletionTime,
        specializationScore: 1.0 // Would be calculated
      });
    });
  }

  private updateAgentPerformance(agentId: string, performance: { success: boolean; duration: number }): void {
    // Simple moving average update
    this.agentSelector.updateAgentPerformance(agentId, {
      successRate: 0.9, // Would be calculated properly
      averageTime: performance.duration,
      specializationScore: 0.8 // Would be calculated properly
    });
  }

  // Public API methods
  getActiveCollaborations(): string[] {
    return Array.from(this.activeCollaborations.keys());
  }

  getCollaborationStatus(collaborationId: string): {
    status: string;
    startTime: number;
    agents: string[];
  } | null {
    const collaboration = this.activeCollaborations.get(collaborationId);
    if (!collaboration) return null;

    return {
      status: collaboration.status,
      startTime: collaboration.startTime,
      agents: Array.from(collaboration.agents.keys())
    };
  }

  cancelCollaboration(collaborationId: string): boolean {
    const collaboration = this.activeCollaborations.get(collaborationId);
    if (!collaboration || collaboration.status === 'completed' || collaboration.status === 'cancelled') {
      return false;
    }

    this.updateCollaborationStatus(collaborationId, 'cancelled');
    this.logger.info(`Collaboration cancelled: ${collaborationId}`);
    return true;
  }

  // Analytics
  getCollaborationAnalytics(): {
    totalCollaborations: number;
    activeCollaborations: number;
    successRate: number;
    averageDuration: number;
    agentUtilization: Record<string, number>;
  } {
    return {
      totalCollaborations: this.activeCollaborations.size,
      activeCollaborations: this.activeCollaborations.size,
      successRate: 0.85, // Would be calculated from historical data
      averageDuration: 120000, // Would be calculated from historical data
      agentUtilization: this.agentSelector.getAgentAnalytics().categoryDistribution
    };
  }
}