import type { AgentConfig } from '@agent-graph/core';
import { z } from 'zod';

export const EnhancedAgentConfigSchema = z.object({
  // Base configuration from core
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

  // Enhanced configuration
  category: z.enum(['code', 'debug', 'test', 'doc', 'architect', 'security']),
  specialization: z.array(z.string()),
  collaboration: z.object({
    canWorkWith: z.array(z.string()),
    preferredAsSubagent: z.boolean(),
    delegationCapabilities: z.array(z.string()),
  }),
  knowledge: z.object({
    requiresContext: z.boolean(),
    memoryAccess: z.enum(['short', 'long', 'both']),
    gitAwareness: z.boolean(),
  }),
  performance: z.object({
    maxConcurrentTasks: z.number(),
    timeoutMs: z.number(),
    retryAttempts: z.number(),
  }),
  capabilities: z.array(z.string()).optional(),
  learning: z.object({
    adaptsToUser: z.boolean(),
    learnsFromFeedback: z.boolean(),
    improvesOverTime: z.boolean(),
  }).optional(),
});

export type EnhancedAgentConfig = z.infer<typeof EnhancedAgentConfigSchema>;

// Task-related types
export const TaskDecompositionSchema = z.object({
  taskId: z.string(),
  type: z.string(),
  complexity: z.enum(['simple', 'medium', 'complex']),
  estimatedDuration: z.number(), // in minutes
  requiredCapabilities: z.array(z.string()),
  dependencies: z.array(z.string()),
  context: z.record(z.any()).optional(),
});

export type TaskDecomposition = z.infer<typeof TaskDecompositionSchema>;

// Agent collaboration types
export const CollaborationPlanSchema = z.object({
  primaryAgent: z.string(),
  subAgents: z.array(z.object({
    agentId: z.string(),
    role: z.string(),
    tasks: z.array(z.string()),
    dependencies: z.array(z.string()).optional(),
  })),
  communicationProtocol: z.enum(['sequential', 'parallel', 'pipeline']),
  integrationStrategy: z.enum(['merge', 'vote', 'consensus', 'primary_decision']),
});

export type CollaborationPlan = z.infer<typeof CollaborationPlanSchema>;

// Performance metrics
export const AgentMetricsSchema = z.object({
  agentId: z.string(),
  tasksCompleted: z.number(),
  averageCompletionTime: z.number(),
  successRate: z.number(),
  userSatisfactionScore: z.number().optional(),
  collaborationCount: z.number(),
  lastActive: z.date(),
});

export type AgentMetrics = z.infer<typeof AgentMetricsSchema>;

// Learning data
export const LearningDataSchema = z.object({
  agentId: z.string(),
  patterns: z.array(z.object({
    input: z.any(),
    output: z.any(),
    success: z.boolean(),
    feedback: z.number().optional(),
    timestamp: z.date(),
  })),
  preferences: z.record(z.any()),
  adaptations: z.array(z.object({
    type: z.string(),
    change: z.any(),
    reason: z.string(),
    timestamp: z.date(),
  })),
});

export type LearningData = z.infer<typeof LearningDataSchema>;

// Agent states
export const AgentStateSchema = z.object({
  id: z.string(),
  status: z.enum(['idle', 'busy', 'learning', 'error']),
  currentTask: z.string().optional(),
  queue: z.array(z.string()),
  metrics: AgentMetricsSchema.optional(),
  learningData: LearningDataSchema.optional(),
});

export type AgentState = z.infer<typeof AgentStateSchema>;