import type { Task, TaskManager } from '@agent-graph/core';
import type { SubTask, TaskDecompositionResult, AgentCapability } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export class TaskDecomposer {
  private taskManager: TaskManager;
  private logger: any;

  constructor(taskManager: TaskManager, logger: any) {
    this.taskManager = taskManager;
    this.logger = logger;
  }

  async decomposeTask(task: Task): Promise<TaskDecompositionResult> {
    this.logger.info(`Decomposing task: ${task.description}`, { taskId: task.id });

    try {
      // Analyze task complexity and requirements
      const analysis = await this.analyzeTask(task);

      // Generate subtasks based on task type and complexity
      const subtasks = await this.generateSubtasks(task, analysis);

      // Create execution plan
      const executionPlan = this.createExecutionPlan(subtasks, analysis);

      // Assess risks and identify bottlenecks
      const riskAssessment = await this.assessRisks(subtasks, executionPlan);

      const result: TaskDecompositionResult = {
        originalTask: task,
        subtasks,
        executionPlan,
        riskAssessment
      };

      this.logger.info(`Task decomposition complete: ${subtasks.length} subtasks created`, {
        taskId: task.id,
        subtaskCount: subtasks.length,
        estimatedTime: executionPlan.estimatedTotalTime
      });

      return result;

    } catch (error) {
      this.logger.error(`Task decomposition failed: ${error.message}`, { taskId: task.id });
      throw error;
    }
  }

  private async analyzeTask(task: Task): Promise<{
    type: string;
    complexity: 'simple' | 'medium' | 'complex';
    requiresCodeGeneration: boolean;
    requiresDebugging: boolean;
    requiresTesting: boolean;
    requiresDocumentation: boolean;
    requiresArchitecture: boolean;
    requiresSecurity: boolean;
    estimatedPhases: string[];
  }> {
    const type = task.type;
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';

    // Determine complexity based on task description and type
    if (task.description.includes('simple') || task.description.includes('basic')) {
      complexity = 'simple';
    } else if (task.description.includes('complex') || task.description.includes('comprehensive')) {
      complexity = 'complex';
    }

    // Determine required phases based on task type and description
    const requiresCodeGeneration = ['code_generation', 'feature_development', 'implementation'].includes(type) ||
                                 task.description.toLowerCase().includes('implement') ||
                                 task.description.toLowerCase().includes('develop');

    const requiresDebugging = ['debugging', 'bug_fixing', 'troubleshooting'].includes(type) ||
                              task.description.toLowerCase().includes('debug') ||
                              task.description.toLowerCase().includes('fix');

    const requiresTesting = ['testing', 'quality_assurance'].includes(type) ||
                           task.description.toLowerCase().includes('test') ||
                           requiresCodeGeneration; // Code gen usually needs testing

    const requiresDocumentation = ['documentation', 'api_docs'].includes(type) ||
                                 task.description.toLowerCase().includes('document') ||
                                 complexity === 'complex';

    const requiresArchitecture = ['architecture', 'design', 'planning'].includes(type) ||
                                 task.description.toLowerCase().includes('design') ||
                                 task.description.toLowerCase().includes('architecture') ||
                                 complexity === 'complex';

    const requiresSecurity = ['security', 'audit'].includes(type) ||
                             task.description.toLowerCase().includes('security') ||
                             task.description.toLowerCase().includes('vulnerability');

    const estimatedPhases: string[] = [];
    if (requiresArchitecture) estimatedPhases.push('analysis', 'design');
    if (requiresCodeGeneration) estimatedPhases.push('implementation');
    if (requiresDebugging) estimatedPhases.push('debugging');
    if (requiresTesting) estimatedPhases.push('testing');
    if (requiresDocumentation) estimatedPhases.push('documentation');
    if (requiresSecurity) estimatedPhases.push('security');

    return {
      type,
      complexity,
      requiresCodeGeneration,
      requiresDebugging,
      requiresTesting,
      requiresDocumentation,
      requiresArchitecture,
      requiresSecurity,
      estimatedPhases
    };
  }

  private async generateSubtasks(task: Task, analysis: any): Promise<SubTask[]> {
    const subtasks: SubTask[] = [];
    const now = new Date();

    subtasks.push(this.createSubTask({
      task,
      type: 'initialization',
      description: 'Initialize task and gather requirements',
      priority: 'high',
      complexity: 'simple',
      duration: 5,
      capabilities: ['analysis'],
      parentId: task.id
    }));

    // Architecture/Design phase
    if (analysis.requiresArchitecture) {
      subtasks.push(this.createSubTask({
        task,
        type: 'architecture',
        description: 'Analyze requirements and design architecture',
        priority: 'high',
        complexity: analysis.complexity === 'complex' ? 'complex' : 'medium',
        duration: analysis.complexity === 'complex' ? 30 : 15,
        capabilities: ['architecture', 'analysis'],
        dependencies: ['initialization'],
        parentId: task.id
      }));
    }

    // Code generation phase
    if (analysis.requiresCodeGeneration) {
      subtasks.push(this.createSubTask({
        task,
        type: 'code_generation',
        description: 'Generate or implement code',
        priority: 'high',
        complexity: analysis.complexity,
        duration: this.estimateCodeGenerationDuration(task, analysis),
        capabilities: ['code_generation', 'programming'],
        dependencies: analysis.requiresArchitecture ? ['architecture'] : ['initialization'],
        parentId: task.id
      }));
    }

    // Debugging phase
    if (analysis.requiresDebugging) {
      subtasks.push(this.createSubTask({
        task,
        type: 'debugging',
        description: 'Debug and fix issues',
        priority: 'high',
        complexity: analysis.complexity === 'simple' ? 'medium' : 'complex',
        duration: 20,
        capabilities: ['debugging', 'analysis'],
        dependencies: ['code_generation'],
        parentId: task.id
      }));
    }

    // Testing phase
    if (analysis.requiresTesting) {
      subtasks.push(this.createSubTask({
        task,
        type: 'testing',
        description: 'Generate and run tests',
        priority: 'medium',
        complexity: 'medium',
        duration: 15,
        capabilities: ['testing', 'quality_assurance'],
        dependencies: ['code_generation'],
        parentId: task.id
      }));
    }

    // Documentation phase
    if (analysis.requiresDocumentation) {
      subtasks.push(this.createSubTask({
        task,
        type: 'documentation',
        description: 'Create or update documentation',
        priority: 'low',
        complexity: 'simple',
        duration: 10,
        capabilities: ['documentation', 'writing'],
        dependencies: ['code_generation'],
        parentId: task.id
      }));
    }

    // Security phase
    if (analysis.requiresSecurity) {
      subtasks.push(this.createSubTask({
        task,
        type: 'security',
        description: 'Perform security analysis and hardening',
        priority: 'medium',
        complexity: 'medium',
        duration: 25,
        capabilities: ['security', 'analysis'],
        dependencies: ['code_generation'],
        parentId: task.id
      }));
    }

    // Final integration/review phase
    subtasks.push(this.createSubTask({
      task,
      type: 'integration',
      description: 'Integrate results and perform final review',
      priority: 'high',
      complexity: 'medium',
      duration: 10,
      capabilities: ['integration', 'review'],
      dependencies: this.getFinalDependencies(analysis),
      parentId: task.id
    }));

    return subtasks;
  }

  private createSubTask(params: {
    task: Task;
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'simple' | 'medium' | 'complex';
    duration: number;
    capabilities: string[];
    dependencies?: string[];
    parentId: string;
  }): SubTask {
    return {
      id: uuidv4(),
      parentId: params.parentId,
      type: params.type,
      description: params.description,
      priority: params.priority,
      complexity: params.complexity,
      estimatedDuration: params.duration,
      requiredCapabilities: params.capabilities,
      dependencies: params.dependencies || [],
      input: {
        originalTask: params.task,
        context: {}
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private estimateCodeGenerationDuration(task: Task, analysis: any): number {
    let baseDuration = 20; // Base duration in minutes

    // Adjust based on complexity
    if (analysis.complexity === 'simple') {
      baseDuration = 10;
    } else if (analysis.complexity === 'complex') {
      baseDuration = 45;
    }

    // Adjust based on priority
    if (task.priority === 'critical') {
      baseDuration *= 1.2; // Allow more time for critical tasks
    }

    return baseDuration;
  }

  private getFinalDependencies(analysis: any): string[] {
    const dependencies = ['initialization'];

    if (analysis.requiresArchitecture) dependencies.push('architecture');
    if (analysis.requiresCodeGeneration) dependencies.push('code_generation');
    if (analysis.requiresDebugging) dependencies.push('debugging');
    if (analysis.requiresTesting) dependencies.push('testing');
    if (analysis.requiresSecurity) dependencies.push('security');
    if (analysis.requiresDocumentation) dependencies.push('documentation');

    return dependencies;
  }

  private createExecutionPlan(subtasks: SubTask[], analysis: any): TaskDecompositionResult['executionPlan'] {
    const phases: Array<{
      name: string;
      tasks: string[];
      mode: 'sequential' | 'parallel';
      dependencies: string[];
    }> = [];

    // Group subtasks by execution phase
    const phasesConfig = [
      {
        name: 'Setup',
        types: ['initialization'],
        mode: 'sequential' as const
      },
      {
        name: 'Analysis & Design',
        types: ['architecture'],
        mode: 'sequential' as const,
        dependencies: ['initialization']
      },
      {
        name: 'Implementation',
        types: ['code_generation'],
        mode: 'sequential' as const,
        dependencies: ['architecture']
      },
      {
        name: 'Quality Assurance',
        types: ['debugging', 'testing', 'security'],
        mode: 'parallel' as const,
        dependencies: ['code_generation']
      },
      {
        name: 'Documentation',
        types: ['documentation'],
        mode: 'sequential' as const,
        dependencies: ['code_generation']
      },
      {
        name: 'Finalization',
        types: ['integration'],
        mode: 'sequential' as const,
        dependencies: ['debugging', 'testing', 'security']
      }
    ];

    let estimatedTotalTime = 0;
    const criticalPath: string[] = [];

    for (const phaseConfig of phasesConfig) {
      const phaseTasks = subtasks.filter(task => phaseConfig.types.includes(task.type));

      if (phaseTasks.length === 0) continue;

      const taskIds = phaseTasks.map(task => task.id);
      const phaseDuration = Math.max(...phaseTasks.map(task => task.estimatedDuration));

      phases.push({
        name: phaseConfig.name,
        tasks: taskIds,
        mode: phaseConfig.mode,
        dependencies: phaseConfig.dependencies || []
      });

      estimatedTotalTime += phaseDuration;

      // Add to critical path (simplified - critical path analysis would be more complex)
      if (phaseConfig.mode === 'sequential' || !criticalPath.length) {
        criticalPath.push(...taskIds);
      }
    }

    return {
      phases,
      estimatedTotalTime,
      criticalPath
    };
  }

  private async assessRisks(
    subtasks: SubTask[],
    executionPlan: TaskDecompositionResult['executionPlan']
  ): Promise<TaskDecompositionResult['riskAssessment']> {
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    const bottlenecks: string[] = [];
    const mitigation: string[] = [];

    // Assess overall complexity
    const complexTasks = subtasks.filter(task => task.complexity === 'complex');
    if (complexTasks.length > subtasks.length / 2) {
      complexity = 'high';
    } else if (complexTasks.length === 0) {
      complexity = 'low';
    }

    // Identify bottlenecks
    for (const phase of executionPlan.phases) {
      for (const taskId of phase.tasks) {
        const task = subtasks.find(t => t.id === taskId);
        if (task && task.estimatedDuration > 30) {
          bottlenecks.push(`${task.type} (${task.estimatedDuration}min)`);
        }
      }
    }

    // Generate mitigation strategies
    if (complexity === 'high') {
      mitigation.push('Break down complex tasks into smaller subtasks');
      mitigation.push('Assign experienced agents to critical tasks');
      mitigation.push('Implement frequent checkpoints');
    }

    if (bottlenecks.length > 0) {
      mitigation.push('Parallelize independent tasks');
      mitigation.push('Monitor and optimize task execution');
      mitigation.push('Have backup agents available');
    }

    return {
      complexity,
      bottlenecks,
      mitigation
    };
  }

  // Utility methods for task management
  async updateSubTaskStatus(subtaskId: string, status: SubTask['status'], result?: any, error?: string): Promise<void> {
    // Implementation would update subtask status in storage
    this.logger.info(`Updating subtask status: ${subtaskId} -> ${status}`, { result, error });
  }

  async getSubTask(subtaskId: string): Promise<SubTask | null> {
    // Implementation would retrieve subtask from storage
    return null;
  }

  async getSubtasksForTask(parentTaskId: string): Promise<SubTask[]> {
    // Implementation would retrieve all subtasks for a parent task
    return [];
  }
}