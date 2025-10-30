import type { AgentConfig, Task, Message } from '@agent-graph/core';
import { BaseAgent } from '@agent-graph/core';
import { GitRepository } from '../operations/GitRepository.js';

export interface CommitMessageTemplate {
  format: string;
  includeScope: boolean;
  includeTicket: boolean;
  ticketPrefix?: string;
  maxLineLength: number;
}

export interface SmartCommitOptions {
  autoStage: boolean;
  includeDiff: boolean;
  maxDiffLines: number;
  template: CommitMessageTemplate;
}

export class SmartCommitAgent extends BaseAgent {
  private gitRepository: GitRepository;
  private options: SmartCommitOptions;

  constructor(config: AgentConfig, gitRepository: GitRepository, options: SmartCommitOptions) {
    super(config, gitRepository['eventBus'], gitRepository['logger']);
    this.gitRepository = gitRepository;
    this.options = options;
  }

  protected async generateCommitMessage(diff: string, changedFiles: string[]): Promise<string> {
    const analysis = await this.analyzeChanges(diff, changedFiles);
    const message = this.buildCommitMessage(analysis);
    return message;
  }

  private async analyzeChanges(diff: string, changedFiles: string[]): Promise<{
    type: string;
    scope?: string;
    description: string;
    ticket?: string;
    breaking: boolean;
  }> {
    // Analyze file types to determine scope
    const scopes = this.extractScopes(changedFiles);
    const type = this.determineCommitType(diff, changedFiles);
    const ticket = this.extractTicketNumber(diff, changedFiles);
    const breaking = this.hasBreakingChanges(diff);

    // Extract main changes from diff
    const description = this.extractDescription(diff);

    return {
      type,
      scope: scopes.length > 0 ? scopes.join(', ') : undefined,
      description,
      ticket,
      breaking
    };
  }

  private extractScopes(files: string[]): string[] {
    const scopes = new Set<string>();

    for (const file of files) {
      const parts = file.split('/');

      // Extract directory as scope
      if (parts.length > 1) {
        scopes.add(parts[0]);
      }

      // Extract file type as scope
      const ext = file.split('.').pop();
      if (ext) {
        scopes.add(ext);
      }
    }

    return Array.from(scopes);
  }

  private determineCommitType(diff: string, files: string[]): string {
    // Check for feature additions
    if (diff.includes('+++ ') || this.hasNewFiles(files)) {
      return 'feat';
    }

    // Check for bug fixes
    if (this.looksLikeBugFix(diff)) {
      return 'fix';
    }

    // Check for documentation changes
    if (this.hasDocumentationChanges(files)) {
      return 'docs';
    }

    // Check for style changes
    if (this.looksLikeStyleChange(diff)) {
      return 'style';
    }

    // Check for refactoring
    if (this.looksLikeRefactoring(diff)) {
      return 'refactor';
    }

    // Check for performance changes
    if (this.looksLikePerformanceChange(diff)) {
      return 'perf';
    }

    // Check for test changes
    if (this.hasTestChanges(files)) {
      return 'test';
    }

    // Check for build/CI changes
    if (this.hasBuildChanges(files)) {
      return 'build';
    }

    // Default to chore
    return 'chore';
  }

  private hasNewFiles(files: string[]): boolean {
    // This would need to be determined from git status
    // For now, assume any file with common new file patterns
    return files.some(file =>
      file.includes('test/') ||
      file.includes('__tests__/') ||
      file.includes('spec/') ||
      file.endsWith('.test.js') ||
      file.endsWith('.test.ts')
    );
  }

  private looksLikeBugFix(diff: string): boolean {
    const bugIndicators = [
      /fix/i,
      /bug/i,
      /error/i,
      /issue/i,
      /problem/i,
      /broken/i,
      /crash/i,
      /exception/i
    ];

    return bugIndicators.some(indicator => indicator.test(diff));
  }

  private hasDocumentationChanges(files: string[]): boolean {
    const docPatterns = [
      /\.md$/,
      /\.txt$/,
      /readme/i,
      /doc/i,
      /docs/i,
      /change/i,
      /license/i
    ];

    return files.some(file =>
      docPatterns.some(pattern => pattern.test(file))
    );
  }

  private looksLikeStyleChange(diff: string): boolean {
    // Check if diff only contains whitespace/formatting changes
    const lines = diff.split('\n');
    const hasNonWhitespaceChanges = lines.some(line => {
      const trimmed = line.trim();
      return trimmed &&
             !trimmed.startsWith('+') &&
             !trimmed.startsWith('-') &&
             !trimmed.match(/^\s*$/);
    });

    return !hasNonWhitespaceChanges;
  }

  private looksLikeRefactoring(diff: string): boolean {
    const refactorIndicators = [
      /rename/i,
      /move/i,
      /extract/i,
      /inline/i,
      /restructure/i,
      /reorganize/i,
      /simplify/i,
      /cleanup/i
    ];

    return refactorIndicators.some(indicator => indicator.test(diff));
  }

  private looksLikePerformanceChange(diff: string): boolean {
    const perfIndicators = [
      /optimization/i,
      /optimize/i,
      /performance/i,
      /cache/i,
      /speed/i,
      /fast/i,
      /slow/i,
      /memory/i,
      /async/i,
      /parallel/i
    ];

    return perfIndicators.some(indicator => indicator.test(diff));
  }

  private hasTestChanges(files: string[]): boolean {
    const testPatterns = [
      /test/i,
      /spec/i,
      /\.test\./,
      /\.spec\./,
      /__tests__/
    ];

    return files.some(file =>
      testPatterns.some(pattern => pattern.test(file))
    );
  }

  private hasBuildChanges(files: string[]): boolean {
    const buildPatterns = [
      /package\.json$/,
      /tsconfig\.json$/,
      /webpack/,
      /rollup/,
      /vite/,
      /babel/,
      /eslint/,
      /prettier/,
      /\.yml$/,
      /\.yaml$/,
      /dockerfile/i,
      /\.dockerfile/
    ];

    return files.some(file =>
      buildPatterns.some(pattern => pattern.test(file))
    );
  }

  private extractTicketNumber(diff: string, files: string[]): string | undefined {
    const ticketPatterns = [
      /#(\d+)/,
      /JIRA-\d+/,
      /TICKET-\d+/,
      /ISSUE-\d+/,
      /\[([A-Z]+-\d+)\]/
    ];

    for (const pattern of ticketPatterns) {
      const match = diff.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  private hasBreakingChanges(diff: string): boolean {
    const breakingIndicators = [
      /BREAKING CHANGE/i,
      /breaking change/i,
      /API CHANGE/i,
      /deprecat/i,
      /remove/i,
      /delete/i,
      /breaking/i
    ];

    return breakingIndicators.some(indicator => indicator.test(diff));
  }

  private extractDescription(diff: string): string {
    // Extract meaningful description from diff
    const lines = diff.split('\n');
    const addedLines = lines
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))
      .map(line => line.substring(1).trim())
      .filter(line => line.length > 0);

    if (addedLines.length === 0) {
      return 'Update files';
    }

    // Try to extract the most meaningful line
    const meaningfulLines = addedLines.filter(line =>
      !line.startsWith('//') &&
      !line.startsWith('#') &&
      !line.startsWith('*') &&
      line.length > 5
    );

    if (meaningfulLines.length > 0) {
      return meaningfulLines[0].substring(0, 72); // Limit length
    }

    // Fallback to first added line
    return addedLines[0].substring(0, 72);
  }

  private buildCommitMessage(analysis: {
    type: string;
    scope?: string;
    description: string;
    ticket?: string;
    breaking: boolean;
  }): string {
    const { template } = this.options;

    let message = '';

    // Build header
    if (template.includeScope && analysis.scope) {
      message = `${analysis.type}(${analysis.scope}): ${analysis.description}`;
    } else {
      message = `${analysis.type}: ${analysis.description}`;
    }

    // Add ticket number
    if (template.includeTicket && analysis.ticket) {
      message += ` ${analysis.ticket}`;
    }

    // Ensure line length limit
    if (message.length > template.maxLineLength) {
      message = message.substring(0, template.maxLineLength - 3) + '...';
    }

    // Add breaking change indicator
    if (analysis.breaking) {
      message += '\n\nBREAKING CHANGE: This change introduces breaking modifications';
    }

    return message;
  }

  // Public API methods
  async generateSmartCommit(options?: {
    message?: string;
    files?: string[];
    autoStage?: boolean;
  }): Promise<string> {
    try {
      const opts = { ...this.options, ...options };

      // Get current status
      const status = await this.gitRepository.getStatus();

      let filesToStage: string[] = [];

      if (opts.autoStage) {
        filesToStage = [
          ...status.modified,
          ...status.untracked
        ];
      } else if (options?.files) {
        filesToStage = options.files;
      }

      if (filesToStage.length === 0 && !options?.message) {
        throw new Error('No files to commit and no message provided');
      }

      let commitMessage = options?.message;

      if (!commitMessage && opts.includeDiff) {
        // Generate diff for analysis
        const diff = await this.gitRepository.diff(undefined, true);
        commitMessage = await this.generateCommitMessage(diff, filesToStage);
      }

      if (!commitMessage) {
        throw new Error('Unable to generate commit message');
      }

      // Create commit
      const commitHash = await this.gitRepository.commit(
        commitMessage,
        filesToStage.length > 0 ? filesToStage : undefined
      );

      this.logger.info(`Smart commit created: ${commitHash.substring(0, 8)}`);
      return commitHash;

    } catch (error) {
      this.logger.error('Failed to create smart commit', error as Error);
      throw error;
    }
  }

  async analyzeCommitHistory(limit: number = 10): Promise<{
    commonPatterns: string[];
    suggestion: string;
  }> {
    try {
      const commits = await this.gitRepository.log({ maxCount: limit });

      // Analyze commit patterns
      const types = commits.map(commit => commit.message.split(':')[0]);
      const typeFrequency = types.reduce((freq, type) => {
        freq[type] = (freq[type] || 0) + 1;
        return freq;
      }, {} as Record<string, number>);

      const commonPatterns = Object.entries(typeFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      // Generate suggestion
      const suggestion = this.generateCommitSuggestion(typeFrequency, commits);

      return { commonPatterns, suggestion };

    } catch (error) {
      this.logger.error('Failed to analyze commit history', error as Error);
      throw error;
    }
  }

  private generateCommitSuggestion(
    typeFrequency: Record<string, number>,
    commits: any[]
  ): string {
    const totalCommits = commits.length;
    const featCount = typeFrequency['feat'] || 0;
    const fixCount = typeFrequency['fix'] || 0;
    const refactorCount = typeFrequency['refactor'] || 0;

    if (featCount / totalCommits > 0.6) {
      return 'Your project is in active development. Consider creating releases more frequently.';
    } else if (fixCount / totalCommits > 0.4) {
      return 'High number of bug fixes detected. Consider improving testing and code review processes.';
    } else if (refactorCount / totalCommits > 0.3) {
      return 'Active refactoring observed. Consider documenting architectural decisions.';
    } else {
      return 'Good commit message diversity. Keep up the consistent practices!';
    }
  }
}