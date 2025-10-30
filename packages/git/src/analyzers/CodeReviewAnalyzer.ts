import type { IGitIntegration } from '@agent-graph/core';
import { Logger, LogLevel } from '@agent-graph/core';

export interface CodeReviewRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  pattern: RegExp;
  message: string;
  suggestion?: string;
  filePatterns?: string[];
}

export interface CodeReviewIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  code?: string;
}

export interface MergeConflict {
  file: string;
  conflicts: Array<{
    startMarker: number;
    endMarker: number;
    lines: string[];
    ours: string[];
    theirs: string[];
  }>;
}

export interface CodeReviewResult {
  issues: CodeReviewIssue[];
  conflicts: MergeConflict[];
  summary: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
    conflictCount: number;
    filesReviewed: number;
  };
  suggestions: string[];
}

export class CodeReviewAnalyzer {
  private logger: Logger;
  private gitIntegration: IGitIntegration;
  private rules: CodeReviewRule[] = [];

  constructor(gitIntegration: IGitIntegration) {
    this.gitIntegration = gitIntegration;
    this.logger = new Logger({ level: LogLevel.INFO }, 'CodeReviewAnalyzer');
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      // Security issues
      {
        name: 'hardcoded-secret',
        description: 'Hardcoded secrets detected',
        severity: 'error',
        pattern: /(password|secret|token|key|api_key)\s*[=:]\s*['""]?([^'"`\s]+)/gi,
        message: 'Hardcoded secret detected. Use environment variables or secure storage.',
        suggestion: 'Move secret to environment variables or secure configuration.',
        filePatterns: ['*.js', '*.ts', '*.py', '*.java', '*.cpp', '*.c']
      },

      // Code quality issues
      {
        name: 'console-log',
        description: 'Console.log statements should be removed in production',
        severity: 'warning',
        pattern: /console\.(log|warn|error|debug|info)\s*\(/g,
        message: 'Console statement detected. Remove before production.',
        suggestion: 'Use proper logging framework or remove for production.',
        filePatterns: ['*.js', '*.ts']
      },

      {
        name: 'todo-comment',
        description: 'TODO comments should be addressed',
        severity: 'info',
        pattern: /TODO|FIXME|HACK|XXX/gi,
        message: 'Unfinished work detected.',
        suggestion: 'Address the TODO comment or create an issue.',
        filePatterns: ['*.js', '*.ts', '*.py', '*.java', '*.cpp', '*.c']
      },

      // Performance issues
      {
        name: 'inefficient-loop',
        description: 'Potentially inefficient loop detected',
        severity: 'warning',
        pattern: /for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\w+\.length\s*;\s*\w+\+\+\s*\)/g,
        message: 'Potential inefficient loop. Consider caching array length.',
        suggestion: 'Cache array length outside the loop for better performance.',
        filePatterns: ['*.js', '*.ts']
      },

      // Best practices
      {
        name: 'unused-import',
        description: 'Potentially unused import detected',
        severity: 'warning',
        pattern: /^import\s+.*\s+from\s+['"][^'"]+['"];?\s*$/gm,
        message: 'Potentially unused import detected.',
        suggestion: 'Remove unused imports to clean up code.',
        filePatterns: ['*.js', '*.ts']
      },

      // Security best practices
      {
        name: 'eval-usage',
        description: 'eval() usage detected',
        severity: 'error',
        pattern: /eval\s*\(/g,
        message: 'eval() usage detected. This is a security risk.',
        suggestion: 'Use safer alternatives like JSON.parse() for JSON data.',
        filePatterns: ['*.js', '*.ts']
      },

      // Database security
      {
        name: 'sql-injection',
        description: 'Potential SQL injection vulnerability',
        severity: 'error',
        pattern: /(query|execute)\s*\(\s*['"`][^'"`]*\s*\+\s*\w+/gi,
        message: 'Potential SQL injection vulnerability.',
        suggestion: 'Use parameterized queries or prepared statements.',
        filePatterns: ['*.js', '*.ts', '*.py', '*.java']
      },

      // Hardcoded URLs
      {
        name: 'hardcoded-url',
        description: 'Hardcoded URL detected',
        severity: 'warning',
        pattern: /(https?:\/\/[^\s'"`]+)/g,
        message: 'Hardcoded URL detected. Consider using configuration.',
        suggestion: 'Move URLs to configuration files or environment variables.',
        filePatterns: ['*.js', '*.ts', '*.py', '*.java', '*.yml', '*.yaml']
      }
    ];
  }

  async reviewChanges(options: {
    baseBranch?: string;
    files?: string[];
    includeStaged?: boolean;
    customRules?: CodeReviewRule[];
  } = {}): Promise<CodeReviewResult> {
    try {
      const {
        baseBranch = 'main',
        files,
        includeStaged = true,
        customRules = []
      } = options;

      // Combine default rules with custom rules
      const allRules = [...this.rules, ...customRules];

      // Get files to review
      const filesToReview = await this.getFilesToReview(files, includeStaged);
      this.logger.info(`Reviewing ${filesToReview.length} files`);

      const issues: CodeReviewIssue[] = [];
      const conflicts: MergeConflict[] = [];

      // Review each file
      for (const file of filesToReview) {
        try {
          const fileIssues = await this.reviewFile(file, allRules);
          issues.push(...fileIssues);

          const fileConflicts = await this.detectMergeConflicts(file);
          conflicts.push(...fileConflicts);

        } catch (error) {
          this.logger.warn(`Failed to review file: ${file}`, { error: (error as Error).message });
        }
      }

      // Generate summary and suggestions
      const summary = this.generateSummary(issues, conflicts, filesToReview.length);
      const suggestions = this.generateSuggestions(issues, conflicts);

      this.logger.info(`Code review complete: ${summary.errorCount} errors, ${summary.warningCount} warnings`);

      return {
        issues,
        conflicts,
        summary,
        suggestions
      };

    } catch (error) {
      this.logger.error('Code review failed', error as Error);
      throw error;
    }
  }

  private async getFilesToReview(
    explicitFiles?: string[],
    includeStaged?: boolean
  ): Promise<string[]> {
    if (explicitFiles && explicitFiles.length > 0) {
      return explicitFiles;
    }

    const status = await this.gitIntegration.getStatus();

    let files: string[] = [];

    if (includeStaged) {
      files.push(...status.staged);
    }

    files.push(...status.modified);
    files.push(...status.untracked);

    return [...new Set(files)]; // Remove duplicates
  }

  private async reviewFile(file: string, rules: CodeReviewRule[]): Promise<CodeReviewIssue[]> {
    const issues: CodeReviewIssue[] = [];

    try {
      const diff = await this.gitIntegration.diff(file, false);
      const lines = diff.split('\n');

      // Filter rules based on file pattern
      const applicableRules = rules.filter(rule => {
        if (!rule.filePatterns) {
          return true;
        }
        return rule.filePatterns.some(pattern => this.matchesPattern(file, pattern));
      });

      // Check each line for issues
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Skip diff markers
        if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('index ')) {
          continue;
        }

        for (const rule of applicableRules) {
          let match;
          while ((match = rule.pattern.exec(line)) !== null) {
            issues.push({
              file,
              line: lineNumber,
              column: match.index,
              rule: rule.name,
              severity: rule.severity,
              message: rule.message,
              suggestion: rule.suggestion,
              code: line.trim()
            });

            // Reset regex lastIndex to avoid infinite loops
            rule.pattern.lastIndex = 0;
          }
        }
      }

    } catch (error) {
      this.logger.warn(`Failed to review file: ${file}`, { error: (error as Error).message });
    }

    return issues;
  }

  private async detectMergeConflicts(file: string): Promise<MergeConflict[]> {
    const conflicts: MergeConflict[] = [];

    try {
      const content = await this.gitIntegration.diff(file);
      const lines = content.split('\n');

      let currentConflict: MergeConflict['conflicts'][0] | null = null;
      let conflictSection: 'ours' | 'theirs' | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('<<<<<<<')) {
          // Start of conflict
          currentConflict = {
            startMarker: i + 1,
            endMarker: 0,
            lines: [],
            ours: [],
            theirs: []
          };
          conflictSection = 'ours';
        } else if (line.startsWith('=======')) {
          // Middle of conflict
          if (currentConflict) {
            conflictSection = 'theirs';
          }
        } else if (line.startsWith('>>>>>>>')) {
          // End of conflict
          if (currentConflict) {
            currentConflict.endMarker = i + 1;
            conflicts.push({
              file,
              conflicts: [currentConflict]
            });
            currentConflict = null;
            conflictSection = null;
          }
        } else if (currentConflict && conflictSection) {
          currentConflict.lines.push(line);
          if (conflictSection === 'ours') {
            currentConflict.ours.push(line);
          } else {
            currentConflict.theirs.push(line);
          }
        }
      }

    } catch (error) {
      this.logger.warn(`Failed to detect conflicts in file: ${file}`, { error: (error as Error).message });
    }

    return conflicts;
  }

  private matchesPattern(file: string, pattern: string): boolean {
    const regex = new RegExp(
      pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
    );
    return regex.test(file);
  }

  private generateSummary(
    issues: CodeReviewIssue[],
    conflicts: MergeConflict[],
    filesReviewed: number
  ): CodeReviewResult['summary'] {
    return {
      errorCount: issues.filter(i => i.severity === 'error').length,
      warningCount: issues.filter(i => i.severity === 'warning').length,
      infoCount: issues.filter(i => i.severity === 'info').length,
      conflictCount: conflicts.length,
      filesReviewed
    };
  }

  private generateSuggestions(
    issues: CodeReviewIssue[],
    conflicts: MergeConflict[]
  ): string[] {
    const suggestions: string[] = [];

    // Analyze issue patterns
    const issueTypes = issues.reduce((types, issue) => {
      types[issue.rule] = (types[issue.rule] || 0) + 1;
      return types;
    }, {} as Record<string, number>);

    // Generate specific suggestions based on common issues
    if (issueTypes['hardcoded-secret'] > 0) {
      suggestions.push('Consider using a secrets management system or environment variables for sensitive data.');
    }

    if (issueTypes['console-log'] > 2) {
      suggestions.push('Multiple console statements found. Consider implementing a proper logging system.');
    }

    if (issueTypes['todo-comment'] > 3) {
      suggestions.push('Many TODO comments found. Consider creating issues in your tracking system.');
    }

    if (issueTypes['eval-usage'] > 0) {
      suggestions.push('Security risk detected: eval() usage. Review these cases immediately.');
    }

    if (conflicts.length > 0) {
      suggestions.push(`${conflicts.length} merge conflicts detected. Resolve these before merging.`);
    }

    // General suggestions
    if (issues.length > 10) {
      suggestions.push('Large number of issues found. Consider addressing them in batches or setting up automated linting.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Good job! No major issues found. Keep up the code quality standards.');
    }

    return suggestions;
  }

  // Public API for rule management
  addRule(rule: CodeReviewRule): void {
    this.rules.push(rule);
    this.logger.info(`Added code review rule: ${rule.name}`);
  }

  removeRule(ruleName: string): void {
    const index = this.rules.findIndex(rule => rule.name === ruleName);
    if (index !== -1) {
      this.rules.splice(index, 1);
      this.logger.info(`Removed code review rule: ${ruleName}`);
    }
  }

  getRules(): CodeReviewRule[] {
    return [...this.rules];
  }

  // Utility methods for conflict resolution
  async suggestConflictResolution(conflict: MergeConflict): Promise<{
    resolution: 'ours' | 'theirs' | 'manual';
    suggestion: string;
    confidence: number;
  }> {
    // Simple heuristic for suggesting conflict resolution
    const totals = conflict.conflicts.map(c => ({
      oursSize: c.ours.join('\n').length,
      theirsSize: c.theirs.join('\n').length
    }));

    const totalOursSize = totals.reduce((sum, t) => sum + t.oursSize, 0);
    const totalTheirsSize = totals.reduce((sum, t) => sum + t.theirsSize, 0);

    if (totalTheirsSize > totalOursSize * 2) {
      return {
        resolution: 'theirs',
        suggestion: 'The incoming changes appear to be more substantial. Consider accepting theirs.',
        confidence: 0.7
      };
    } else if (totalOursSize > totalTheirsSize * 2) {
      return {
        resolution: 'ours',
        suggestion: 'Your changes appear to be more substantial. Consider accepting ours.',
        confidence: 0.7
      };
    } else {
      return {
        resolution: 'manual',
        suggestion: 'Changes appear to be of similar size. Manual resolution recommended.',
        confidence: 0.8
      };
    }
  }
}