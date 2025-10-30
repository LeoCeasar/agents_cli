import { EventEmitter } from 'eventemitter3';
import type { ITaskManager, Task, IEventBus, ILogger } from '../interfaces/index.js';
import { v4 as uuidv4 } from 'uuid';

export class TaskManager extends EventEmitter implements ITaskManager {
  private tasks = new Map<string, Task>();
  private eventBus: IEventBus;
  private logger: ILogger;

  constructor(eventBus: IEventBus, logger: ILogger) {
    super();
    this.eventBus = eventBus;
    this.logger = logger;
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const task: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.logger.info(`Task created: ${task.id}`, { task });
    this.eventBus.emit('task:created', task);
    this.emit('created', task);

    return task;
  }

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask = {
      ...existingTask,
      ...updates,
      updatedAt: new Date()
    };

    this.tasks.set(id, updatedTask);
    this.logger.info(`Task updated: ${id}`, { updates });
    this.eventBus.emit('task:updated', updatedTask);
    this.emit('updated', updatedTask);

    return updatedTask;
  }

  async get(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async list(filter?: {
    status?: Task['status'];
    assignedAgent?: string;
    type?: string;
    priority?: Task['priority'];
  }): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      tasks = tasks.filter(task => {
        if (filter.status && task.status !== filter.status) return false;
        if (filter.assignedAgent && task.assignedAgent !== filter.assignedAgent) return false;
        if (filter.type && task.type !== filter.type) return false;
        if (filter.priority && task.priority !== filter.priority) return false;
        return true;
      });
    }

    // Sort by creation date (newest first)
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async delete(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }

    this.tasks.delete(id);
    this.logger.info(`Task deleted: ${id}`);
    this.eventBus.emit('task:deleted', id, task);
    this.emit('deleted', id, task);
  }

  async assign(taskId: string, agentId: string): Promise<void> {
    await this.update(taskId, { assignedAgent: agentId });
    this.logger.info(`Task assigned: ${taskId} -> ${agentId}`);
    this.eventBus.emit('task:assigned', taskId, agentId);
  }

  async complete(taskId: string, result: any): Promise<void> {
    await this.update(taskId, {
      status: 'completed',
      output: result
    });
    this.logger.info(`Task completed: ${taskId}`, { result });
    this.eventBus.emit('task:completed', taskId, result);
    this.emit('completed', taskId, result);
  }

  async fail(taskId: string, error: string): Promise<void> {
    await this.update(taskId, {
      status: 'failed',
      error
    });
    this.logger.error(`Task failed: ${taskId}`, new Error(error));
    this.eventBus.emit('task:failed', taskId, error);
    this.emit('failed', taskId, error);
  }

  // Utility methods
  async getPendingTasks(): Promise<Task[]> {
    return this.list({ status: 'pending' });
  }

  async getTasksForAgent(agentId: string): Promise<Task[]> {
    return this.list({ assignedAgent: agentId });
  }

  async getTasksByType(type: string): Promise<Task[]> {
    return this.list({ type });
  }

  async getHighPriorityTasks(): Promise<Task[]> {
    return this.list({ priority: 'high' });
  }

  async getCriticalTasks(): Promise<Task[]> {
    return this.list({ priority: 'critical' });
  }

  size(): number {
    return this.tasks.size;
  }

  clear(): void {
    const taskIds = Array.from(this.tasks.keys());
    this.tasks.clear();
    this.logger.info('All tasks cleared', { count: taskIds.length });
    this.eventBus.emit('tasks:cleared', taskIds);
    this.emit('cleared', taskIds);
  }
}