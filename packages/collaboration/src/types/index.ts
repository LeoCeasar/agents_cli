import type { EnhancedAgentConfig, AgentState, AgentMetrics, TaskDecomposition } from '../types/index.js';

// Task management types
export const TaskSchema = TaskDecompositionSchema.extend({
  id: string,
  title: string,
  description: string,
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
  assignedAgent: z.string().optional(),
  subtasks: z.array(z.string()),
  parentTask: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deadline: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// Collaboration workflow types
export const CollaborationWorkflowSchema = z.object({
  id: string,
  name: string,
  description: string,
  tasks: z.array(z.string()), // Task IDs
  agents: z.array(z.string()), // Agent IDs
  mode: z.enum(['sequential', 'parallel', 'pipeline', 'hybrid']),
  dependencies: z.array(z.object({
    from: z.string(), // Task ID or Agent ID
    to: z.string(),   // Task ID or Agent ID
    type: z.enum(['task_to_task', 'agent_to_agent', 'task_to_agent']),
  })),
  communicationPattern: z.enum(['broadcast', 'point_to_point', 'publish_subscribe']),
  errorHandling: z.enum(['fail_fast', 'retry', 'skip', 'delegate']),
  timeout: z.number(), // in minutes
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CollaborationWorkflow = z.infer<typeof CollaborationWorkflowSchema>;

// Agent selection criteria
export const AgentSelectionCriteriaSchema = z.object({
  taskType: z.string(),
  requiredCapabilities: z.array(z.string()),
  specialization: z.array(z.string()),
  priority: z.enum(['performance', 'availability', 'cost', 'specialization']),
  maxAgents: z.number(),
  excludeAgents: z.array(z.string()).optional(),
  preferredAgents: z.array(z.string()).optional(),
});

export type AgentSelectionCriteria = z.infer<typeof AgentSelectionCriteriaSchema>;

// Performance monitoring types
export const CollaborationMetricsSchema = z.object({
  workflowId: string,
  totalTasks: z.number(),
  completedTasks: z.number(),
  failedTasks: z.number(),
  averageTaskDuration: z.number(),
  totalDuration: z.number(),
  agentUtilization: z.record(z.number()), // agentId -> utilization percentage
  successRate: z.number(),
  errorRate: z.number(),
  collaborationEfficiency: z.number(), // 0-1 score
  bottlenecks: z.array(z.string()), // Agent or Task IDs
  recommendations: z.array(z.string()),
  timestamp: z.date(),
});

export type CollaborationMetrics = z.infer<typeof CollaborationMetricsSchema>;

// Result integration types
export const ResultIntegrationSchema = z.object({
  workflowId: z.string(),
  taskId: z.string(),
  agentResults: z.array(z.object({
    agentId: string,
    result: z.any(),
    confidence: z.number(),
    metadata: z.record(z.any()).optional(),
  })),
  integrationStrategy: z.enum(['merge', 'vote', 'consensus', 'primary_decision', 'custom']),
  finalResult: z.any(),
  confidence: z.number(),
  conflicts: z.array(z.object({
    type: z.string(),
    description: z.string(),
    agents: z.array(z.string()),
    resolution: z.string().optional(),
  })),
  timestamp: z.date(),
});

export type ResultIntegration = z.infer<typeof ResultIntegrationSchema>;

// Manager state
export const CollaborationManagerStateSchema = z.object({
  id: string,
  status: z.enum(['idle', 'planning', 'executing', 'monitoring', 'integrating', 'error']),
  activeWorkflows: z.array(z.string()),
  completedWorkflows: z.array(z.string()),
  availableAgents: z.array(z.string()),
  busyAgents: z.array(z.string()),
  metrics: CollaborationMetricsSchema.optional(),
  configuration: z.object({
    maxConcurrentWorkflows: z.number(),
    defaultTimeout: z.number(),
    retryPolicy: z.object({
      maxAttempts: z.number(),
      backoffMs: z.number(),
    }),
    loadBalancing: z.enum(['round_robin', 'least_busy', 'best_fit', 'random']),
  }),
});

export type CollaborationManagerState = z.infer<typeof CollaborationManagerStateSchema>;

// Event types for collaboration
export const CollaborationEventSchema = z.object({
  id: string,
  type: z.enum([
    'workflow_started',
    'workflow_completed',
    'workflow_failed',
    'task_assigned',
    'task_started',
    'task_completed',
    'task_failed',
    'agent_selected',
    'agent_busy',
    'agent_available',
    'result_integrated',
    'error_occurred',
    'performance_warning',
  ]),
  workflowId: z.string().optional(),
  taskId: z.string().optional(),
  agentId: z.string().optional(),
  data: z.record(z.any()).optional(),
  timestamp: z.date(),
});

export type CollaborationEvent = z.infer<typeof CollaborationEventSchema>;

// Error handling types
export const CollaborationErrorSchema = z.object({
  id: string,
  type: z.enum([
    'task_decomposition_failed',
    'agent_selection_failed',
    'collaboration_failed',
    'integration_failed',
    'timeout_exceeded',
    'agent_unavailable',
    'resource_exhausted',
    'communication_error',
  ]),
  message: string,
  workflowId: z.string().optional(),
  taskId: z.string().optional(),
  agentId: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  recoverable: z.boolean(),
  retryCount: z.number(),
  originalError: z.any(),
  timestamp: z.date(),
});

export type CollaborationError = z.infer<typeof CollaborationErrorSchema>;

// Re-export from agents package
export { TaskDecompositionSchema, TaskDecomposition, AgentStateSchema, AgentState, AgentMetricsSchema, AgentMetrics };