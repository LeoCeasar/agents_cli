import type { IAgent, Task, Message, AgentConfig } from '@agent-graph/core';
import { BaseAgent, EventBus, Logger, LogLevel } from '@agent-graph/core';

export class MockAgent extends BaseAgent {
  private responses: Map<string, any> = new Map();
  private executionHistory: Task[] = [];
  private messageHistory: Message[] = [];

  constructor(config: AgentConfig) {
    const eventBus = new EventBus();
    const logger = new Logger({ level: LogLevel.DEBUG }, 'MockAgent');
    super(config, eventBus, logger);
  }

  // Mock response setup
  setResponse(taskType: string, response: any): void {
    this.responses.set(taskType, response);
  }

  setResponseGenerator(taskType: string, generator: (task: Task) => any): void {
    this.responses.set(taskType, generator);
  }

  // History access
  getExecutionHistory(): Task[] {
    return [...this.executionHistory];
  }

  getMessageHistory(): Message[] {
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.executionHistory = [];
    this.messageHistory = [];
  }

  // Override base methods with mock implementations
  protected async generateCode(input: any): Promise<any> {
    const response = this.responses.get('code_generation');
    if (typeof response === 'function') {
      return response({ type: 'code_generation', input });
    }
    return response || { code: '// Mock generated code', language: 'javascript' };
  }

  protected async analyzeCode(input: any): Promise<any> {
    const response = this.responses.get('analysis');
    if (typeof response === 'function') {
      return response({ type: 'analysis', input });
    }
    return response || { analysis: 'Mock analysis result', issues: [] };
  }

  protected async refactorCode(input: any): Promise<any> {
    const response = this.responses.get('refactoring');
    if (typeof response === 'function') {
      return response({ type: 'refactoring', input });
    }
    return response || { refactoredCode: '// Mock refactored code', changes: [] };
  }

  protected async debugCode(input: any): Promise<any> {
    const response = this.responses.get('debugging');
    if (typeof response === 'function') {
      return response({ type: 'debugging', input });
    }
    return response || { bug: 'Mock bug found', fix: 'Mock fix suggestion' };
  }

  protected async generateTests(input: any): Promise<any> {
    const response = this.responses.get('testing');
    if (typeof response === 'function') {
      return response({ type: 'testing', input });
    }
    return response || { tests: ['// Mock test case'], coverage: 80 };
  }

  protected async generateResponse(content: string): Promise<string> {
    const response = this.responses.get('chat');
    if (typeof response === 'function') {
      return response(content);
    }
    return response || `Mock response to: ${content}`;
  }

  // Override execute to track history
  async execute(task: Task): Promise<Task> {
    this.executionHistory.push({ ...task });
    const result = await super.execute(task);
    this.executionHistory[this.executionHistory.length - 1] = result;
    return result;
  }

  // Override chat to track history
  async chat(message: Message): Promise<Message> {
    this.messageHistory.push({ ...message });
    const response = await super.chat(message);
    this.messageHistory.push(response);
    return response;
  }
}