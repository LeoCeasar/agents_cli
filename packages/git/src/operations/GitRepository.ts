import type { IGitIntegration } from '@agent-graph/core';
import { Logger, LogLevel } from '@agent-graph/core';
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

export interface GitRepositoryConfig {
  path: string;
  author?: {
    name: string;
    email: string;
  };
  defaultBranch?: string;
  autoStash?: boolean;
  excludePatterns?: string[];
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

export interface BranchInfo {
  name: string;
  current: boolean;
  remote?: string;
  ahead?: number;
  behind?: number;
}

export class GitRepository implements IGitIntegration {
  private git: SimpleGit;
  private config: GitRepositoryConfig;
  private logger: Logger;

  constructor(config: GitRepositoryConfig) {
    this.config = config;
    this.logger = new Logger({ level: LogLevel.INFO }, 'GitRepository');

    const gitOptions: SimpleGitOptions = {
      baseDir: config.path,
      binary: 'git',
      maxConcurrentProcesses: 1,
      timeout: {
        block: 30000,
        stdio: 30000
      }
    };

    this.git = simpleGit(gitOptions);

    // Configure git author if provided
    if (config.author) {
      this.git.addConfig('user.name', config.author.name);
      this.git.addConfig('user.email', config.author.email);
    }
  }

  async initialize(): Promise<void> {
    try {
      // Check if this is a git repository
      const isRepo = await this.git.checkIsRepo();

      if (!isRepo) {
        this.logger.info('Initializing git repository');
        await this.git.init();
        await this.git.addConfig('init.defaultBranch', this.config.defaultBranch || 'main');
      }

      // Get current status
      const status = await this.getStatus();
      this.logger.info(`Git repository ready: ${status.branch}`);

    } catch (error) {
      this.logger.error('Failed to initialize git repository', error as Error);
      throw error;
    }
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const statusSummary = await this.git.status();
      const branchSummary = await this.git.branch();

      return {
        branch: statusSummary.current || 'main',
        ahead: statusSummary.ahead || 0,
        behind: statusSummary.behind || 0,
        staged: statusSummary.staged.map(file => file),
        modified: statusSummary.modified.map(file => file),
        untracked: statusSummary.not_added.map(file => file),
        conflicted: statusSummary.conflicted.map(file => file)
      };
    } catch (error) {
      this.logger.error('Failed to get git status', error as Error);
      throw error;
    }
  }

  async commit(message: string, files?: string[]): Promise<string> {
    try {
      // Auto-stash if there are conflicts and auto-stash is enabled
      if (this.config.autoStash) {
        await this.handleAutoStash();
      }

      // Add files if specified
      if (files && files.length > 0) {
        // Filter out excluded patterns
        const filteredFiles = this.filterFiles(files);
        if (filteredFiles.length > 0) {
          await this.git.add(filteredFiles);
          this.logger.debug(`Added files to staging: ${filteredFiles.join(', ')}`);
        }
      } else {
        // Add all changes
        await this.git.add('.');
      }

      // Check if there are staged changes
      const status = await this.getStatus();
      if (status.staged.length === 0) {
        this.logger.warn('No staged changes to commit');
        throw new Error('No staged changes to commit');
      }

      // Create commit
      const commitResult = await this.git.commit(message);
      const commitHash = commitResult.commit || '';

      this.logger.info(`Commit created: ${commitHash.substring(0, 8)} - ${message}`);
      return commitHash;

    } catch (error) {
      this.logger.error('Failed to create commit', error as Error);
      throw error;
    }
  }

  async branch(name: string, fromBranch?: string): Promise<void> {
    try {
      if (fromBranch) {
        // Create branch from specific branch
        await this.git.checkoutBranch(name, fromBranch);
      } else {
        // Create branch from current branch
        await this.git.checkoutLocalBranch(name);
      }

      this.logger.info(`Created and switched to branch: ${name}`);

    } catch (error) {
      this.logger.error(`Failed to create branch: ${name}`, error as Error);
      throw error;
    }
  }

  async merge(branch: string, options: { noFF?: boolean; message?: string } = {}): Promise<void> {
    try {
      const mergeOptions: string[] = [];

      if (options.noFF) {
        mergeOptions.push('--no-ff');
      }

      if (options.message) {
        mergeOptions.push('-m', options.message);
      }

      await this.git.merge([branch, ...mergeOptions]);
      this.logger.info(`Merged branch: ${branch}`);

    } catch (error) {
      this.logger.error(`Failed to merge branch: ${branch}`, error as Error);
      throw error;
    }
  }

  async diff(file?: string, staged: boolean = false): Promise<string> {
    try {
      let diffCommand = file ? [file] : [];

      if (staged) {
        diffCommand.unshift('--cached');
      }

      const diffResult = await this.git.diff(diffCommand);
      return diffResult;

    } catch (error) {
      this.logger.error('Failed to get diff', error as Error);
      throw error;
    }
  }

  async log(options: {
    maxCount?: number;
    file?: string;
    since?: string;
    until?: string;
    author?: string;
  } = {}): Promise<CommitInfo[]> {
    try {
      const logOptions: string[] = ['--pretty=format:%H|%s|%an|%ad', '--date=iso'];

      if (options.maxCount) {
        logOptions.push(`-${options.maxCount}`);
      }

      if (options.file) {
        logOptions.push('--follow', options.file);
      }

      if (options.since) {
        logOptions.push(`--since=${options.since}`);
      }

      if (options.until) {
        logOptions.push(`--until=${options.until}`);
      }

      if (options.author) {
        logOptions.push(`--author=${options.author}`);
      }

      const logResult = await this.git.log(logOptions);

      return logResult.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: new Date(commit.date),
        files: [] // Would need additional git commands to get files
      }));

    } catch (error) {
      this.logger.error('Failed to get git log', error as Error);
      throw error;
    }
  }

  async add(files: string[]): Promise<void> {
    try {
      const filteredFiles = this.filterFiles(files);

      if (filteredFiles.length === 0) {
        this.logger.warn('No files to add after filtering');
        return;
      }

      await this.git.add(filteredFiles);
      this.logger.debug(`Added files: ${filteredFiles.join(', ')}`);

    } catch (error) {
      this.logger.error('Failed to add files', error as Error);
      throw error;
    }
  }

  async push(remote?: string, branch?: string): Promise<void> {
    try {
      const remoteName = remote || 'origin';
      const branchName = branch || (await this.getStatus()).branch;

      await this.git.push(remoteName, branchName);
      this.logger.info(`Pushed to ${remoteName}/${branchName}`);

    } catch (error) {
      this.logger.error('Failed to push', error as Error);
      throw error;
    }
  }

  async pull(remote?: string, branch?: string): Promise<void> {
    try {
      const remoteName = remote || 'origin';
      const branchName = branch || (await this.getStatus()).branch;

      await this.git.pull(remoteName, branchName);
      this.logger.info(`Pulled from ${remoteName}/${branchName}`);

    } catch (error) {
      this.logger.error('Failed to pull', error as Error);
      throw error;
    }
  }

  // Additional utility methods
  async getBranches(): Promise<BranchInfo[]> {
    try {
      const branchSummary = await this.git.branch();
      const branches: BranchInfo[] = [];

      // Local branches
      Object.keys(branchSummary.branches).forEach(name => {
        branches.push({
          name,
          current: name === branchSummary.current,
          remote: undefined
        });
      });

      // Remote branches
      if (branchSummary.remotes) {
        Object.keys(branchSummary.remotes).forEach(name => {
          branches.push({
            name: name.replace('origin/', ''),
            current: false,
            remote: 'origin'
          });
        });
      }

      return branches;

    } catch (error) {
      this.logger.error('Failed to get branches', error as Error);
      throw error;
    }
  }

  async checkout(branch: string, create: boolean = false): Promise<void> {
    try {
      if (create) {
        await this.git.checkoutLocalBranch(branch);
      } else {
        await this.git.checkout(branch);
      }

      this.logger.info(`Switched to branch: ${branch}`);

    } catch (error) {
      this.logger.error(`Failed to checkout branch: ${branch}`, error as Error);
      throw error;
    }
  }

  async stash(message?: string): Promise<string> {
    try {
      const stashResult = await this.git.stash([message ? `--message=${message}` : '']);
      this.logger.info('Changes stashed');
      return stashResult;

    } catch (error) {
      this.logger.error('Failed to stash changes', error as Error);
      throw error;
    }
  }

  async stashPop(stashRef?: string): Promise<void> {
    try {
      const stashCommand = stashRef ? ['pop', stashRef] : ['pop'];
      await this.git.stash(stashCommand);
      this.logger.info('Stash popped');

    } catch (error) {
      this.logger.error('Failed to pop stash', error as Error);
      throw error;
    }
  }

  async reset(mode: 'soft' | 'mixed' | 'hard' = 'mixed', commit?: string): Promise<void> {
    try {
      const resetCommand = [mode];
      if (commit) {
        resetCommand.push(commit);
      }

      await this.git.reset(resetCommand);
      this.logger.info(`Reset ${mode}${commit ? ` to ${commit}` : ''}`);

    } catch (error) {
      this.logger.error('Failed to reset', error as Error);
      throw error;
    }
  }

  async revert(commit: string): Promise<void> {
    try {
      await this.git.revert([commit]);
      this.logger.info(`Reverted commit: ${commit}`);

    } catch (error) {
      this.logger.error(`Failed to revert commit: ${commit}`, error as Error);
      throw error;
    }
  }

  // Private helper methods
  private filterFiles(files: string[]): string[] {
    if (!this.config.excludePatterns) {
      return files;
    }

    return files.filter(file => {
      return !this.config.excludePatterns!.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(file);
      });
    });
  }

  private async handleAutoStash(): Promise<void> {
    try {
      const status = await this.getStatus();

      if (status.conflicted.length > 0) {
        this.logger.info('Auto-stashing changes due to conflicts');
        await this.stash('Auto-stash before operation');
      }
    } catch (error) {
      this.logger.warn('Auto-stash failed', { error: (error as Error).message });
    }
  }

  // Repository information methods
  async getRemoteUrl(remote: string = 'origin'): Promise<string | undefined> {
    try {
      const remotes = await this.git.getRemotes(true);
      const remoteInfo = remotes.find(r => r.name === remote);
      return remoteInfo?.refs.fetch;
    } catch (error) {
      this.logger.error(`Failed to get remote URL for ${remote}`, error as Error);
      return undefined;
    }
  }

  async isClean(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.staged.length === 0 &&
             status.modified.length === 0 &&
             status.untracked.length === 0 &&
             status.conflicted.length === 0;
    } catch (error) {
      this.logger.error('Failed to check if repository is clean', error as Error);
      return false;
    }
  }

  async getCurrentCommit(): Promise<string> {
    try {
      const result = await this.git.revparse(['HEAD']);
      return result.trim();
    } catch (error) {
      this.logger.error('Failed to get current commit', error as Error);
      throw error;
    }
  }
}