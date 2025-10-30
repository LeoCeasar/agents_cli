import type { Task, AgentConfig } from '@agent-graph/core';
import type { EnhancedAgentConfig, CollaborationPlan } from '../types/index.js';
import { z } from 'zod';

export interface SubTask {
  id: string;
  parentId?: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number; // in minutes
  requiredCapabilities: string[];
  dependencies: string[];
  input: any;
  context?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  assignedAgent?: string;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDecompositionResult {
  originalTask: Task;
  subtasks: SubTask[];
  executionPlan: {
    phases: Array<{
      name: string;
      tasks: string[];
      mode: 'sequential' | 'parallel';
      dependencies: string[];
    }>;
    estimatedTotalTime: number;
    criticalPath: string[];
  };
  riskAssessment: {
    complexity: 'low' | 'medium' | 'high';
    bottlenecks: string[];
    mitigation: string[];
  };
}

export const SubTaskSchema = z.object({
  id: z.string(),
  parentId: z.string().optional(),
  type: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  complexity: z.enum(['simple', 'medium', 'complex']),
  estimatedDuration: z.number(),
  requiredCapabilities: z.array(z.string()),
  dependencies: z.array(z.string()),
  input: z.any(),
  context: z.any().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'blocked']),
  assignedAgent: z.string().optional(),
  result: z.any().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubTaskType = z.infer<typeof SubTaskSchema>;

export interface AgentCapability {
  agentId: string;
  category: string;
  capabilities: string[];
  performance: {
    successRate: number;
    averageTime: number;
    specializationScore: number;
  };
  availability: {
    status: 'idle' | 'busy' | 'offline';
    queueSize: number;
    maxConcurrent: number;
  };
  collaboration: {
    canWorkWith: string[];
    preferredAsSubagent: boolean;
    delegationCapabilities: string[];
  };
}

export interface AgentSelectionCriteria {
  capability: string;
  specialization: string[];
  performance: {
    minSuccessRate: number;
    maxAverageTime: number;
  };
  availability: {
    requireIdle: boolean;
    maxQueueSize: number;
  };
  collaboration: {
    canCollaborate?: string[];
    preferredRole?: 'primary' | 'subagent';
  };
}