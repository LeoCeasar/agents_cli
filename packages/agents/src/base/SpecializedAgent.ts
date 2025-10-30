import type { EnhancedAgentConfig, AgentState, AgentMetrics } from '../types/index.js';
import { BaseAgent } from '@agent-graph/core';
import { EventEmitter } from 'eventemitter3';

export abstract class SpecializedAgent extends BaseAgent {
  public readonly config: EnhancedAgentConfig;
  protected state: AgentState;
  protected metrics: AgentMetrics;
  protected learningData: any[] = [];

  constructor(config: EnhancedAgentConfig, eventBus: EventEmitter, logger: any) {
    super(config as any, eventBus, logger);
    this.config = config;
    this.state = {
      id: config.id,
      status: 'idle',
      queue: []
    };
    this.metrics = {
      agentId: config.id,
      tasksCompleted: 0,
      averageCompletionTime: 0,
      successRate: 1.0,
      collaborationCount: 0,
      lastActive: new Date()
    };
  }

  // Enhanced lifecycle methods
  async initialize(): Promise<void> {
    await super.initialize();

    // Initialize specialized capabilities
    await this.initializeSpecializedCapabilities();

    // Load learning data if enabled
    if (this.config.learning?.adaptsToUser) {
      await this.loadLearningData();
    }

    this.state.status = 'idle';
    this.emit('specialized:initialized', this.config);
  }

  // Abstract method for specialized initialization
  protected abstract initializeSpecializedCapabilities(): Promise<void>;

  // Enhanced task execution with metrics
  async execute(task: any): Promise<any> {
    const startTime = Date.now();
    this.state.status = 'busy';
    this.state.currentTask = task.id;

    try {
      // Check if this task is within agent's specialization
      if (!this.canHandleTask(task)) {
        throw new Error(`Agent ${this.id} cannot handle task type: ${task.type}`);
      }

      // Pre-execute setup
      await this.preExecuteSetup(task);

      // Execute the task
      const result = await super.execute(task);

      // Update metrics
      this.updateMetrics(startTime, true, result);

      // Learn from successful execution if enabled
      if (this.config.learning?.learnsFromFeedback) {
        await this.learnFromExecution(task, result, true);
      }

      return result;

    } catch (error) {
      // Update metrics for failure
      this.updateMetrics(startTime, false, error);

      // Learn from failure if enabled
      if (this.config.learning?.learnsFromFeedback) {
        await this.learnFromExecution(task, error, false);
      }

      throw error;
    } finally {
      this.state.status = 'idle';
      this.state.currentTask = undefined;
      this.metrics.lastActive = new Date();
    }
  }

  // Check if agent can handle specific task
  protected canHandleTask(task: any): boolean {
    // Check if task type matches specialization
    if (!this.config.specialization.includes(task.type)) {
      return false;
    }

    // Check required capabilities
    if (task.requiredCapabilities) {
      const hasCapabilities = task.requiredCapabilities.every(
        capability => this.config.capabilities?.includes(capability)
      );
      if (!hasCapabilities) {
        return false;
      }
    }

    return true;
  }

  // Pre-execution setup for specialized agents
  protected async preExecuteSetup(task: any): Promise<void> {
    // Get context if required
    if (this.config.knowledge.requiresContext) {
      await this.gatherContext(task);
    }

    // Access memory if required
    if (this.config.knowledge.memoryAccess !== 'none') {
      await this.accessRelevantMemory(task);
    }

    // Get Git context if required
    if (this.config.knowledge.gitAwareness) {
      await this.gatherGitContext(task);
    }
  }

  // Context gathering methods
  protected async gatherContext(task: any): Promise<void> {
    // Implementation depends on knowledge graph integration
    this.logger.debug(`Gathering context for task: ${task.id}`);
  }

  protected async accessRelevantMemory(task: any): Promise<void> {
    // Implementation depends on memory integration
    this.logger.debug(`Accessing memory for task: ${task.id}`);
  }

  protected async gatherGitContext(task: any): Promise<void> {
    // Implementation depends on git integration
    this.logger.debug(`Gathering Git context for task: ${task.id}`);
  }

  // Metrics management
  private updateMetrics(startTime: number, success: boolean, result: any): void {
    const duration = Date.now() - startTime;
    const totalTasks = this.metrics.tasksCompleted + 1;

    // Update completion metrics
    this.metrics.tasksCompleted = totalTasks;

    // Update average completion time
    this.metrics.averageCompletionTime =
      (this.metrics.averageCompletionTime * (totalTasks - 1) + duration) / totalTasks;

    // Update success rate
    if (success) {
      this.metrics.successRate =
        (this.metrics.successRate * (totalTasks - 1) + 1) / totalTasks;
    } else {
      this.metrics.successRate =
        (this.metrics.successRate * (totalTasks - 1)) / totalTasks;
    }

    this.emit('metrics:updated', this.metrics);
  }

  // Learning and adaptation
  protected async learnFromExecution(task: any, result: any, success: boolean): Promise<void> {
    if (!this.config.learning?.learnsFromFeedback) {
      return;
    }

    const learningEntry = {
      input: task,
      output: result,
      success,
      timestamp: new Date(),
    };

    this.learningData.push(learningEntry);

    // Keep only recent learning data (last 100 entries)
    if (this.learningData.length > 100) {
      this.learningData = this.learningData.slice(-100);
    }

    // Trigger adaptation if enabled
    if (this.config.learning?.improvesOverTime && this.shouldAdapt()) {
      await this.adaptBehavior();
    }

    this.emit('learning:updated', learningEntry);
  }

  protected shouldAdapt(): boolean {
    // Simple heuristic: adapt every 10 successful executions
    const successfulExecutions = this.learningData.filter(entry => entry.success).length;
    return successfulExecutions > 0 && successfulExecutions % 10 === 0;
  }

  protected async adaptBehavior(): Promise<void> {
    this.state.status = 'learning';

    try {
      // Implementation depends on specific agent type
      this.logger.debug(`Agent ${this.id} is adapting behavior based on learning data`);

      // Emit adaptation event
      this.emit('agent:adapted', {
        agentId: this.id,
        learningDataSize: this.learningData.length,
        adaptationType: 'behavioral'
      });
    } finally {
      this.state.status = 'idle';
    }
  }

  // Collaboration support
  canCollaborateWith(agentCategory: string): boolean {
    return this.config.collaboration.canWorkWith.includes(agentCategory);
  }

  prefersToBeSubagent(): boolean {
    return this.config.collaboration.preferredAsSubagent;
  }

  canDelegateTask(taskType: string): boolean {
    return this.config.collaboration.delegationCapabilities.includes(taskType);
  }

  // State management
  getState(): AgentState {
    return { ...this.state };
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  getLearningData(): any[] {
    return [...this.learningData];
  }

  // Queue management
  addToQueue(taskId: string): void {
    if (!this.state.queue.includes(taskId)) {
      this.state.queue.push(taskId);
      this.emit('queue:updated', this.state.queue);
    }
  }

  removeFromQueue(taskId: string): void {
    const index = this.state.queue.indexOf(taskId);
    if (index > -1) {
      this.state.queue.splice(index, 1);
      this.emit('queue:updated', this.state.queue);
    }
  }

  getQueueSize(): number {
    return this.state.queue.length;
  }

  // Performance optimization
  async optimizePerformance(): Promise<void> {
    // Implement performance optimization based on metrics
    if (this.metrics.averageCompletionTime > 30000) { // 30 seconds
      this.logger.warn(`Agent ${this.id} has slow average completion time: ${this.metrics.averageCompletionTime}ms`);
    }

    if (this.metrics.successRate < 0.8) {
      this.logger.warn(`Agent ${this.id} has low success rate: ${this.metrics.successRate}`);
    }
  }

  // Persistence
  protected async loadLearningData(): Promise<void> {
    // Implementation depends on storage integration
    this.logger.debug(`Loading learning data for agent: ${this.id}`);
  }

  protected async saveLearningData(): Promise<void> {
    // Implementation depends on storage integration
    this.logger.debug(`Saving learning data for agent: ${this.id}`);
  }

  // Cleanup
  async shutdown(): Promise<void> {
    await super.shutdown();

    // Save learning data
    if (this.config.learning?.learnsFromFeedback) {
      await this.saveLearningData();
    }

    this.state.status = 'idle';
    this.state.queue = [];

    this.emit('specialized:shutdown', this.config);
  }
}