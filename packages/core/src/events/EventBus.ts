import { EventEmitter } from 'eventemitter3';
import type { IEventBus } from '../interfaces/index.js';

export class EventBus extends EventEmitter implements IEventBus {
  private middleware: Array<(event: string, ...args: any[]) => void> = [];

  emit(event: string, ...args: any[]): void {
    // Apply middleware before emitting
    for (const middleware of this.middleware) {
      try {
        middleware(event, ...args);
      } catch (error) {
        console.error('EventBus middleware error:', error);
      }
    }

    super.emit(event, ...args);
    super.emit('*', event, ...args); // Wildcard event for logging
  }

  use(middleware: (event: string, ...args: any[]) => void): void {
    this.middleware.push(middleware);
  }

  // Utility methods for common event patterns
  emitAgentEvent(agentId: string, action: string, data?: any): void {
    this.emit(`agent:${action}`, agentId, data);
  }

  emitTaskEvent(taskId: string, action: string, data?: any): void {
    this.emit(`task:${action}`, taskId, data);
  }

  emitMemoryEvent(action: string, data?: any): void {
    this.emit(`memory:${action}`, data);
  }

  emitKnowledgeGraphEvent(action: string, data?: any): void {
    this.emit(`knowledge:${action}`, data);
  }

  emitGitEvent(action: string, data?: any): void {
    this.emit(`git:${action}`, data);
  }
}