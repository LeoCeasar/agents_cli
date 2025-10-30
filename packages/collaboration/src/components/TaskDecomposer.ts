import type { Task, TaskDecomposition, CollaborationError } from '../types/index.js';
import { EventEmitter } from 'eventemitter3';

export class TaskDecomposer extends EventEmitter {
  private decompositionStrategies: Map<string, DecompositionStrategy>;
  private complexityThresholds: Record<string, number>;

  constructor(private logger: any) {
    super();
    this.decompositionStrategies = new Map();
    this.complexityThresholds = {
      simple: 1,
      medium: 5,
      complex: 10,
    };
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Register default decomposition strategies
    this.decompositionStrategies.set('code', new CodeDecompositionStrategy());
    this.decompositionStrategies.set('debug', new DebugDecompositionStrategy());
    this.decompositionStrategies.set('test', new TestDecompositionStrategy());
    this.decompositionStrategies.set('documentation', new DocumentationDecompositionStrategy());
    this.decompositionStrategies.set('architecture', new ArchitectureDecompositionStrategy());
    this.decompositionStrategies.set('security', new SecurityDecompositionStrategy());
  }

  // Main decomposition method
  async decomposeTask(
    originalTask: any,
    context: Record<string, any> = {}
  ): Promise<TaskDecomposition> {
    try {
      this.logger.info(`Starting task decomposition for: ${originalTask.id || 'unknown'}`);

      // Analyze task complexity and requirements
      const analysis = await this.analyzeTask(originalTask, context);

      // Select appropriate decomposition strategy
      const strategy = this.selectStrategy(analysis);

      // Execute decomposition
      const decomposition = await strategy.decompose(originalTask, analysis, context);

      // Validate decomposition
      this.validateDecomposition(decomposition);

      // Emit completion event
      this.emit('task:decomposed', {
        originalTaskId: originalTask.id,
        decomposition,
        strategy: strategy.name,
      });

      return decomposition;

    } catch (error) {
      const collaborationError: CollaborationError = {
        id: `decomp_error_${Date.now()}`,
        type: 'task_decomposition_failed',
        message: `Failed to decompose task: ${error.message}`,
        taskId: originalTask.id,
        severity: 'high',
        recoverable: true,
        retryCount: 0,
        originalError: error,
        timestamp: new Date(),
      };

      this.emit('error:decomposition', collaborationError);
      throw error;
    }
  }

  // Analyze task to determine decomposition approach
  private async analyzeTask(
    task: any,
    context: Record<string, any>
  ): Promise<TaskAnalysis> {
    const analysis: TaskAnalysis = {
      type: task.type || 'unknown',
      complexity: 'simple',
      estimatedDuration: 30, // default 30 minutes
      requiredCapabilities: [],
      dependencies: [],
      subtasks: [],
      parallelizable: false,
      requiresSpecialization: false,
    };

    // Analyze task description and requirements
    if (task.description) {
      const description = task.description.toLowerCase();
      analysis.complexity = this.assessComplexity(description);
      analysis.estimatedDuration = this.estimateDuration(description, analysis.complexity);
      analysis.requiredCapabilities = this.extractCapabilities(description);
    }

    // Analyze context for additional requirements
    if (context.projectStructure) {
      analysis.requiredCapabilities.push('file_system');
    }
    if (context.gitRepository) {
      analysis.requiredCapabilities.push('git_operations');
    }
    if (context.testFramework) {
      analysis.requiredCapabilities.push('testing');
    }

    // Determine if task can be parallelized
    analysis.parallelizable = this.canParallelize(task, analysis);

    // Check if specialized agents are needed
    analysis.requiresSpecialization = this.requiresSpecialization(analysis);

    return analysis;
  }

  // Select appropriate decomposition strategy
  private selectStrategy(analysis: TaskAnalysis): DecompositionStrategy {
    const strategy = this.decompositionStrategies.get(analysis.type);

    if (strategy) {
      return strategy;
    }

    // Fallback to generic strategy
    return new GenericDecompositionStrategy();
  }

  // Assess task complexity based on description
  private assessComplexity(description: string): 'simple' | 'medium' | 'complex' {
    const complexityIndicators = {
      simple: ['fix', 'update', 'add', 'remove', 'rename'],
      medium: ['refactor', 'implement', 'create', 'modify', 'optimize'],
      complex: ['architecture', 'redesign', 'migration', 'integration', 'system'],
    };

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => description.includes(indicator))) {
        return level as 'simple' | 'medium' | 'complex';
      }
    }

    return 'simple';
  }

  // Estimate task duration in minutes
  private estimateDuration(description: string, complexity: string): number {
    const baseDurations = {
      simple: 15,
      medium: 60,
      complex: 180,
    };

    let duration = baseDurations[complexity as keyof typeof baseDurations];

    // Adjust based on specific keywords
    if (description.includes('test')) duration *= 1.2;
    if (description.includes('document')) duration *= 0.8;
    if (description.includes('debug')) duration *= 1.5;
    if (description.includes('optimize')) duration *= 1.3;

    return Math.round(duration);
  }

  // Extract required capabilities from description
  private extractCapabilities(description: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'file': ['file_system'],
      'code': ['code_analysis', 'code_generation'],
      'test': ['testing', 'assertion'],
      'debug': ['debugging', 'error_analysis'],
      'git': ['git_operations'],
      'deploy': ['deployment'],
      'api': ['api_integration'],
      'database': ['database_operations'],
    };

    const capabilities: string[] = [];

    for (const [keyword, caps] of Object.entries(capabilityMap)) {
      if (description.includes(keyword)) {
        capabilities.push(...caps);
      }
    }

    return [...new Set(capabilities)]; // Remove duplicates
  }

  // Determine if task can be parallelized
  private canParallelize(task: any, analysis: TaskAnalysis): boolean {
    // Tasks that can typically be parallelized
    const parallelizableTypes = ['test', 'documentation', 'analysis'];

    return parallelizableTypes.includes(analysis.type) ||
           analysis.estimatedDuration > 120 || // Tasks over 2 hours
           analysis.subtasks.length > 3;
  }

  // Check if task requires specialized agents
  private requiresSpecialization(analysis: TaskAnalysis): boolean {
    const specializedCapabilities = [
      'security_analysis',
      'performance_optimization',
      'architecture_design',
      'database_operations',
    ];

    return analysis.requiredCapabilities.some(cap =>
      specializedCapabilities.includes(cap)
    );
  }

  // Validate decomposition result
  private validateDecomposition(decomposition: TaskDecomposition): void {
    if (!decomposition.taskId) {
      throw new Error('Decomposition must have a taskId');
    }

    if (decomposition.estimatedDuration <= 0) {
      throw new Error('Estimated duration must be positive');
    }

    if (!decomposition.requiredCapabilities || decomposition.requiredCapabilities.length === 0) {
      throw new Error('Task must have required capabilities');
    }
  }

  // Register custom decomposition strategy
  registerStrategy(taskType: string, strategy: DecompositionStrategy): void {
    this.decompositionStrategies.set(taskType, strategy);
    this.logger.info(`Registered custom decomposition strategy for: ${taskType}`);
  }

  // Get available strategies
  getAvailableStrategies(): string[] {
    return Array.from(this.decompositionStrategies.keys());
  }

  // Update complexity thresholds
  updateComplexityThresholds(thresholds: Record<string, number>): void {
    this.complexityThresholds = { ...this.complexityThresholds, ...thresholds };
  }
}

// Supporting interfaces and classes
interface TaskAnalysis {
  type: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number; // in minutes
  requiredCapabilities: string[];
  dependencies: string[];
  subtasks: string[];
  parallelizable: boolean;
  requiresSpecialization: boolean;
}

abstract class DecompositionStrategy {
  abstract readonly name: string;

  abstract decompose(
    task: any,
    analysis: TaskAnalysis,
    context: Record<string, any>
  ): Promise<TaskDecomposition>;
}

// Strategy implementations for different task types
class CodeDecompositionStrategy extends DecompositionStrategy {
  readonly name = 'code';

  async decompose(
    task: any,
    analysis: TaskAnalysis,
    context: Record<string, any>
  ): Promise<TaskDecomposition> {
    const subtasks = this.generateCodeSubtasks(task, analysis);

    return {
      taskId: task.id,
      type: task.type,
      complexity: analysis.complexity,
      estimatedDuration: analysis.estimatedDuration,
      requiredCapabilities: [
        ...analysis.requiredCapabilities,
        'code_analysis',
        'code_generation'
      ],
      dependencies: analysis.dependencies,
      context: {
        ...context,
        subtasks,
        strategy: 'code_decomposition'
      }
    };
  }

  private generateCodeSubtasks(task: any, analysis: TaskAnalysis): string[] {
    const subtasks: string[] = [];

    if (task.type === 'feature') {
      subtasks.push('analyze_requirements', 'design_solution', 'implement_code', 'write_tests');
    } else if (task.type === 'bugfix') {
      subtasks.push('reproduce_issue', 'identify_root_cause', 'implement_fix', 'verify_resolution');
    } else if (task.type === 'refactor') {
      subtasks.push('analyze_current_code', 'identify_refactoring_opportunities', 'apply_refactoring', 'run_tests');
    }

    return subtasks;
  }
}

class DebugDecompositionStrategy extends DecompositionStrategy {
  readonly name = 'debug';

  async decompose(
    task: any,
    analysis: TaskAnalysis,
    context: Record<string, any>
  ): Promise<TaskDecomposition> {
    return {
      taskId: task.id,
      type: task.type,
      complexity: analysis.complexity,
      estimatedDuration: analysis.estimatedDuration * 1.5, // Debugging takes longer
      requiredCapabilities: [
        ...analysis.requiredCapabilities,
        'debugging',
        'error_analysis',
        'log_analysis'
      ],
      dependencies: analysis.dependencies,
      context: {
        ...context,
        strategy: 'debug_decomposition',
        errorContext: task.errorContext
      }
    };
  }
}

class TestDecompositionStrategy extends DecompositionStrategy {
  readonly name = 'test';

  async decompose(
    task: any,
    analysis: TaskAnalysis,
    context: Record<string, any>
  ): Promise<TaskDecomposition> {
    const subtasks = this.generateTestSubtasks(task);

    return {
      taskId: task.id,
      type: task.type,
      complexity: analysis.complexity,
      estimatedDuration: analysis.estimatedDuration,
      requiredCapabilities: [
        ...analysis.requiredCapabilities,
        'testing',
        'assertion',
        'test_framework'
      ],
      dependencies: analysis.dependencies,
      context: {
        ...context,
        subtasks,
        strategy: 'test_decomposition',
        testType: task.testType || 'unit'
      }
    };
  }

  private generateTestSubtasks(task: any): string[] {
    const subtasks: string[] = ['identify_test_cases', 'write_test_code', 'run_tests', 'analyze_coverage'];

    if (task.testType === 'integration') {
      subtasks.push('setup_test_environment', 'mock_dependencies');
    }

    if (task.testType === 'e2e') {
      subtasks.push('setup_test_data', 'configure_test_environment');
    }

    return subtasks;
  }
}

class DocumentationDecompositionStrategy extends DecompositionStrategy {
  readonly name = 'documentation';

  async decompose(
    task: any,
    analysis: TaskAnalysis,
    context: Record<string, any>
  ): Promise<TaskDecomposition> {
    return {
      taskId: task.id,
      type: task.type,
      complexity: analysis.complexity,
      estimatedDuration: analysis.estimatedDuration * 0.8, // Documentation is often faster
      requiredCapabilities: [
        ...analysis.requiredCapabilities,
        'documentation',
        'writing'
      ],
      dependencies: analysis.dependencies,
      context: {
        ...context,
        strategy: 'documentation_decomposition',
        docType: task.docType || 'technical'
      }
    };
  }
}

class ArchitectureDecompositionStrategy extends DecompositionStrategy {
  readonly name = 'architecture';

  async decompose(
    task: any,
    analysis: TaskAnalysis,
    context: Record<string, any>
  ): Promise<TaskDecomposition> {
    return {
      taskId: task.id,
      type: task.type,
      complexity: 'complex', // Architecture tasks are inherently complex
      estimatedDuration: analysis.estimatedDuration * 2, // Architecture takes longer
      requiredCapabilities: [
        ...analysis.requiredCapabilities,
        'architecture_design',
        'system_analysis',
        'pattern_recognition'
      ],
      dependencies: analysis.dependencies,
      context: {
        ...context,
        strategy: 'architecture_decomposition',
        scope: task.scope || 'system'
      }
    };
  }
}

class SecurityDecompositionStrategy extends DecompositionStrategy {
  readonly name = 'security';

  async decompose(
    task: any,
    analysis: TaskAnalysis,
    context: Record<string, any>
  ): Promise<TaskDecomposition> {
    return {
      taskId: task.id,
      type: task.type,
      complexity: 'complex', // Security tasks are complex
      estimatedDuration: analysis.estimatedDuration * 1.8,
      requiredCapabilities: [
        ...analysis.requiredCapabilities,
        'security_analysis',
        'vulnerability_assessment',
        'compliance_check'
      ],
      dependencies: analysis.dependencies,
      context: {
        ...context,
        strategy: 'security_decomposition',
        securityLevel: task.securityLevel || 'standard'
      }
    };
  }
}

class GenericDecompositionStrategy extends DecompositionStrategy {
  readonly name = 'generic';

  async decompose(
    task: any,
    analysis: TaskAnalysis,
    context: Record<string, any>
  ): Promise<TaskDecomposition> {
    return {
      taskId: task.id,
      type: task.type,
      complexity: analysis.complexity,
      estimatedDuration: analysis.estimatedDuration,
      requiredCapabilities: analysis.requiredCapabilities,
      dependencies: analysis.dependencies,
      context: {
        ...context,
        strategy: 'generic_decomposition'
      }
    };
  }
}