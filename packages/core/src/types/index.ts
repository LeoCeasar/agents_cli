import { z } from 'zod';

// Core Agent Types
export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['primary', 'subagent', 'meta']),
  mode: z.enum(['interactive', 'batch', 'service']),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    execute: z.boolean(),
    network: z.boolean().optional(),
  }),
  model: z.object({
    provider: z.string(),
    model: z.string(),
    parameters: z.record(z.any()).optional(),
  }),
  tools: z.array(z.string()).optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Message Types
export const MessageSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// Task Types
export const TaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedAgent: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  input: z.any().optional(),
  output: z.any().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Task = z.infer<typeof TaskSchema>;

// Tool Types
export const ToolConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(['function', 'builtin', 'plugin']),
  parameters: z.record(z.any()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type ToolConfig = z.infer<typeof ToolConfigSchema>;

// Memory Types
export const MemoryConfigSchema = z.object({
  type: z.enum(['short_term', 'long_term']),
  provider: z.string(),
  config: z.record(z.any()).optional(),
});

export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

// Knowledge Graph Types
export const KnowledgeNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['file', 'function', 'class', 'variable', 'concept']),
  name: z.string(),
  properties: z.record(z.any()).optional(),
  relationships: z.array(z.object({
    type: z.string(),
    target: z.string(),
    properties: z.record(z.any()).optional(),
  })).optional(),
});

export type KnowledgeNode = z.infer<typeof KnowledgeNodeSchema>;

// Git Types
export const GitConfigSchema = z.object({
  repositoryPath: z.string(),
  autoCommit: z.boolean().optional(),
  commitMessageTemplate: z.string().optional(),
  excludedPaths: z.array(z.string()).optional(),
});

export type GitConfig = z.infer<typeof GitConfigSchema>;

// Project Types
export const ProjectConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  type: z.enum(['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'mixed']),
  agents: z.array(AgentConfigSchema).optional(),
  memory: MemoryConfigSchema.optional(),
  knowledge: z.object({
    enabled: z.boolean(),
    autoUpdate: z.boolean(),
    provider: z.string(),
  }).optional(),
  git: GitConfigSchema.optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;