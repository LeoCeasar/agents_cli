import type { Task, AgentConfig, Message } from '@agent-graph/core';

/**
 * Test utilities for the Agent Graph platform
 */
export class TestUtils {
  /**
   * Create a mock task for testing
   */
  static createMockTask(overrides: Partial<Task> = {}): Task {
    return {
      id: this.generateId(),
      type: 'test_task',
      description: 'Test task description',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock agent config for testing
   */
  static createMockAgentConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
    return {
      id: this.generateId(),
      name: 'Test Agent',
      description: 'Test agent description',
      type: 'primary',
      mode: 'interactive',
      permissions: {
        read: true,
        write: false,
        execute: false
      },
      model: {
        provider: 'test',
        model: 'test-model'
      },
      ...overrides
    };
  }

  /**
   * Create a mock message for testing
   */
  static createMockMessage(overrides: Partial<Message> = {}): Message {
    return {
      id: this.generateId(),
      type: 'user',
      content: 'Test message content',
      timestamp: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock project structure for testing
   */
  static createMockProjectStructure() {
    return {
      name: 'test-project',
      files: {
        'src/index.ts': `
          export function greet(name: string): string {
            return \`Hello, \${name}!\`;
          }
        `,
        'src/utils.ts': `
          export function formatDate(date: Date): string {
            return date.toISOString();
          }
        `,
        'package.json': JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          dependencies: {}
        }, null, 2),
        'README.md': '# Test Project\n\nThis is a test project for testing purposes.'
      }
    };
  }

  /**
   * Generate a unique ID for testing
   */
  static generateId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Wait for a specified amount of time (useful for async tests)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a mock file system structure
   */
  static createMockFileSystem() {
    const fs = new Map<string, string>();

    return {
      setFile: (path: string, content: string) => {
        fs.set(path, content);
      },
      getFile: (path: string): string | undefined => {
        return fs.get(path);
      },
      hasFile: (path: string): boolean => {
        return fs.has(path);
      },
      deleteFile: (path: string): boolean => {
        return fs.delete(path);
      },
      listFiles: (): string[] => {
        return Array.from(fs.keys());
      },
      clear: () => {
        fs.clear();
      }
    };
  }

  /**
   * Create test data for various scenarios
   */
  static createTestData() {
    return {
      codeSamples: {
        typescript: `
          interface User {
            id: number;
            name: string;
            email: string;
          }

          class UserService {
            private users: User[] = [];

            addUser(user: User): void {
              this.users.push(user);
            }

            getUser(id: number): User | undefined {
              return this.users.find(u => u.id === id);
            }
          }
        `,
        javascript: `
          function calculateTotal(items) {
            return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          }

          const cart = [
            { name: 'Book', price: 20, quantity: 2 },
            { name: 'Pen', price: 1.5, quantity: 5 }
          ];

          console.log('Total:', calculateTotal(cart));
        `,
        python: `
          class Calculator:
              def __init__(self):
                  self.history = []

              def add(self, a, b):
                  result = a + b
                  self.history.append(f"{a} + {b} = {result}")
                  return result

              def get_history(self):
                  return self.history
        `
      },
      gitDiffs: {
        simple: `
          --- a/src/example.ts
          +++ b/src/example.ts
          @@ -1,3 +1,5 @@
           export function example() {
          -  return 'old';
          +  return 'new';
           }
         `,
        complex: `
          --- a/src/calculator.ts
          +++ b/src/calculator.ts
          @@ -1,8 +1,12 @@
           export class Calculator {
          +  private history: string[] = [];
          +
             add(a: number, b: number): number {
          +    const result = a + b;
          +    this.history.push(\`\${a} + \${b} = \${result}\`);
          -    return a + b;
          +    return result;
             }

          +  getHistory(): string[] {
          +    return this.history;
          +  }
           }
         `
      },
      commitMessages: [
        'feat: add user authentication system',
        'fix: resolve memory leak in data processing',
        'docs: update API documentation',
        'style: format code with prettier',
        'refactor: extract common utilities',
        'test: add unit tests for calculator',
        'perf: optimize database queries',
        'build: update dependencies'
      ]
    };
  }

  /**
   * Assert utilities for testing
   */
  static assert = {
    deepEqual: (actual: any, expected: any, message?: string) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },

    equal: (actual: any, expected: any, message?: string) => {
      if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, but got ${actual}`);
      }
    },

    notEqual: (actual: any, expected: any, message?: string) => {
      if (actual === expected) {
        throw new Error(message || `Expected values to be different`);
      }
    },

    isTrue: (value: any, message?: string) => {
      if (value !== true) {
        throw new Error(message || `Expected true, but got ${value}`);
      }
    },

    isFalse: (value: any, message?: string) => {
      if (value !== false) {
        throw new Error(message || `Expected false, but got ${value}`);
      }
    },

    isNull: (value: any, message?: string) => {
      if (value !== null) {
        throw new Error(message || `Expected null, but got ${value}`);
      }
    },

    isNotNull: (value: any, message?: string) => {
      if (value === null) {
        throw new Error(message || `Expected not null, but got null`);
      }
    },

    isUndefined: (value: any, message?: string) => {
      if (value !== undefined) {
        throw new Error(message || `Expected undefined, but got ${value}`);
      }
    },

    isDefined: (value: any, message?: string) => {
      if (value === undefined) {
        throw new Error(message || `Expected defined value, but got undefined`);
      }
    },

    contains: (array: any[], item: any, message?: string) => {
      if (!array.includes(item)) {
        throw new Error(message || `Expected array to contain ${item}`);
      }
    },

    notContains: (array: any[], item: any, message?: string) => {
      if (array.includes(item)) {
        throw new Error(message || `Expected array not to contain ${item}`);
      }
    },

    throws: async (fn: () => Promise<void> | void, expectedMessage?: string, message?: string) => {
      try {
        await fn();
        throw new Error(message || 'Expected function to throw an error');
      } catch (error) {
        if (expectedMessage && !error.message.includes(expectedMessage)) {
          throw new Error(message || `Expected error message to contain "${expectedMessage}", but got "${error.message}"`);
        }
      }
    }
  };
}