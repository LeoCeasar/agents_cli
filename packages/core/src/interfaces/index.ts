import type { AgentConfig, Task, Message, ToolConfig } from '../types/index.js';

export type { AgentConfig, Task, Message, ToolConfig };

// Core Agent Interface
export interface IAgent {
  readonly id: string;
  readonly config: AgentConfig;

  initialize(): Promise<void>;
  execute(task: Task): Promise<Task>;
  chat(message: Message): Promise<Message>;
  shutdown(): Promise<void>;

  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

// Tool Interface
export interface ITool {
  readonly name: string;
  readonly config: ToolConfig;

  execute(params: any): Promise<any>;
  validate(params: any): boolean;
}

// Memory Interface
export interface IMemory {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  search(query: string, options?: any): Promise<any[]>;
}

// Knowledge Graph Interface
export interface IKnowledgeGraph {
  addNode(node: any): Promise<void>;
  addEdge(from: string, to: string, type: string, properties?: any): Promise<void>;
  getNode(id: string): Promise<any>;
  getNeighbors(id: string): Promise<any[]>;
  query(query: string, params?: any): Promise<any[]>;
  updateNode(id: string, updates: any): Promise<void>;
  deleteNode(id: string): Promise<void>;
}

// Git Interface
export interface IGitIntegration {
  getStatus(): Promise<any>;
  commit(message: string, files?: string[]): Promise<string>;
  branch(name: string): Promise<void>;
  merge(branch: string): Promise<void>;
  diff(file?: string): Promise<string>;
  log(options?: any): Promise<any[]>;
  add(files: string[]): Promise<void>;
  push(remote?: string, branch?: string): Promise<void>;
  pull(remote?: string, branch?: string): Promise<void>;
}

// Storage Interface
export interface IStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
}

// Plugin Interface
export interface IPlugin {
  readonly name: string;
  readonly version: string;

  initialize(context: any): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): Promise<void>;
}

// Agent Registry Interface
export interface IAgentRegistry {
  register(agent: IAgent): void;
  unregister(agentId: string): void;
  get(agentId: string): IAgent | undefined;
  list(): IAgent[];
  findByType(type: string): IAgent[];
  findByCapability(capability: string): IAgent[];
}

// Task Manager Interface
export interface ITaskManager {
  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  update(id: string, updates: Partial<Task>): Promise<Task>;
  get(id: string): Promise<Task | undefined>;
  list(filter?: any): Promise<Task[]>;
  delete(id: string): Promise<void>;
  assign(taskId: string, agentId: string): Promise<void>;
  complete(taskId: string, result: any): Promise<void>;
  fail(taskId: string, error: string): Promise<void>;
}

// Event Bus Interface
export interface IEventBus {
  emit(event: string, ...args: any[]): void;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  once(event: string, listener: (...args: any[]) => void): void;
}

// Logger Interface
export interface ILogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}

// Config Manager Interface
export interface IConfigManager {
  get<T = any>(key: string): T;
  set(key: string, value: any): void;
  has(key: string): boolean;
  delete(key: string): void;
  reload(): Promise<void>;
  save(): Promise<void>;
}