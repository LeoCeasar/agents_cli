import { EventEmitter } from 'eventemitter3';
import type { IAgent, AgentConfig, Task, Message, IEventBus, ILogger } from '../interfaces/index.js';
import { v4 as uuidv4 } from 'uuid';

export class BaseAgent extends EventEmitter implements IAgent {
  public readonly id: string;
  public readonly config: AgentConfig;

  protected eventBus: IEventBus;
  protected logger: ILogger;
  protected isInitialized = false;

  constructor(config: AgentConfig, eventBus: IEventBus, logger: ILogger) {
    super();
    this.id = config.id;
    this.config = config;
    this.eventBus = eventBus;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info(`Initializing agent: ${this.id}`, { config: this.config });

    // Initialize tools if specified
    if (this.config.tools) {
      await this.initializeTools();
    }

    this.isInitialized = true;
    this.emit('initialized');
    this.eventBus.emit('agent:initialized', this.id);

    this.logger.info(`Agent initialized successfully: ${this.id}`);
  }

  async execute(task: Task): Promise<Task> {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.id} is not initialized`);
    }

    this.logger.info(`Executing task: ${task.id}`, { task, agent: this.id });

    try {
      // Update task status to in_progress
      const updatedTask = { ...task, status: 'in_progress' as const, updatedAt: new Date() };
      this.eventBus.emit('task:updated', updatedTask);

      // Execute the task based on its type
      const result = await this.executeTask(updatedTask);

      // Update task with result
      const completedTask = {
        ...updatedTask,
        status: 'completed' as const,
        output: result,
        updatedAt: new Date()
      };

      this.eventBus.emit('task:completed', completedTask);
      this.logger.info(`Task completed successfully: ${task.id}`, { result });

      return completedTask;
    } catch (error) {
      const failedTask = {
        ...task,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : String(error),
        updatedAt: new Date()
      };

      this.eventBus.emit('task:failed', failedTask);
      this.logger.error(`Task failed: ${task.id}`, error as Error, { agent: this.id });

      return failedTask;
    }
  }

  async chat(message: Message): Promise<Message> {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.id} is not initialized`);
    }

    this.logger.info(`Processing message: ${message.id}`, { message, agent: this.id });

    try {
      const response = await this.processMessage(message);

      this.eventBus.emit('message:processed', { original: message, response });
      this.logger.info(`Message processed successfully: ${message.id}`);

      return response;
    } catch (error) {
      this.logger.error(`Message processing failed: ${message.id}`, error as Error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.logger.info(`Shutting down agent: ${this.id}`);

    this.isInitialized = false;
    this.emit('shutdown');
    this.eventBus.emit('agent:shutdown', this.id);

    this.logger.info(`Agent shutdown complete: ${this.id}`);
  }

  protected async initializeTools(): Promise<void> {
    // Tool initialization logic to be implemented by subclasses
    this.logger.debug(`Initializing tools for agent: ${this.id}`, { tools: this.config.tools });
  }

  protected async executeTask(task: Task): Promise<any> {
    // Default task execution logic
    switch (task.type) {
      case 'code_generation':
        return this.generateCode(task.input);
      case 'analysis':
        return this.analyzeCode(task.input);
      case 'refactoring':
        return this.refactorCode(task.input);
      case 'debugging':
        return this.debugCode(task.input);
      case 'testing':
        return this.generateTests(task.input);
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  protected async processMessage(message: Message): Promise<Message> {
    // Default message processing logic
    const responseContent = await this.generateResponse(message.content);

    return {
      id: uuidv4(),
      type: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      metadata: {
        agentId: this.id,
        originalMessageId: message.id
      }
    };
  }

  // Abstract methods to be implemented by concrete agents
  protected async generateCode(input: any): Promise<any> {
    throw new Error('generateCode method must be implemented by subclass');
  }

  protected async analyzeCode(input: any): Promise<any> {
    throw new Error('analyzeCode method must be implemented by subclass');
  }

  protected async refactorCode(input: any): Promise<any> {
    throw new Error('refactorCode method must be implemented by subclass');
  }

  protected async debugCode(input: any): Promise<any> {
    throw new Error('debugCode method must be implemented by subclass');
  }

  protected async generateTests(input: any): Promise<any> {
    throw new Error('generateTests method must be implemented by subclass');
  }

  protected async generateResponse(content: string): Promise<string> {
    throw new Error('generateResponse method must be implemented by subclass');
  }

  // Utility methods
  protected hasPermission(permission: string): boolean {
    return this.config.permissions[permission as keyof typeof this.config.permissions] || false;
  }

  protected validateAccess(operation: string): void {
    const requiredPermissions: Record<string, string> = {
      'read': 'read',
      'write': 'write',
      'execute': 'execute',
      'network': 'network'
    };

    const permission = requiredPermissions[operation];
    if (!permission || !this.hasPermission(permission)) {
      throw new Error(`Agent ${this.id} does not have permission for operation: ${operation}`);
    }
  }
}