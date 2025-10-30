import type { IGitIntegration } from '@agent-graph/core';

export interface MockGitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
}

export class MockGitIntegration implements IGitIntegration {
  private status: MockGitStatus = {
    branch: 'main',
    ahead: 0,
    behind: 0,
    staged: [],
    modified: [],
    untracked: [],
    conflicted: []
  };

  private commits: Array<{
    hash: string;
    message: string;
    author: string;
    date: Date;
    files: string[];
  }> = [];

  private branches: string[] = ['main', 'develop', 'feature/test'];

  // Status manipulation for testing
  setFileStaged(file: string): void {
    if (!this.status.staged.includes(file)) {
      this.status.staged.push(file);
    }
  }

  setFileModified(file: string): void {
    if (!this.status.modified.includes(file)) {
      this.status.modified.push(file);
    }
  }

  setFileUntracked(file: string): void {
    if (!this.status.untracked.includes(file)) {
      this.status.untracked.push(file);
    }
  }

  setFileConflicted(file: string): void {
    if (!this.status.conflicted.includes(file)) {
      this.status.conflicted.push(file);
    }
  }

  clearAllChanges(): void {
    this.status.staged = [];
    this.status.modified = [];
    this.status.untracked = [];
    this.status.conflicted = [];
  }

  getCurrentStatus(): MockGitStatus {
    return { ...this.status };
  }

  // IGitIntegration implementation
  async getStatus(): Promise<any> {
    return { ...this.status };
  }

  async commit(message: string, files?: string[]): Promise<string> {
    const hash = `mock${this.commits.length + 1}`;
    const commitFiles = files || [...this.status.staged];

    this.commits.push({
      hash,
      message,
      author: 'Test User',
      date: new Date(),
      files: commitFiles
    });

    // Clear staged files after commit
    this.status.staged = [];

    return hash;
  }

  async branch(name: string, fromBranch?: string): Promise<void> {
    if (!this.branches.includes(name)) {
      this.branches.push(name);
    }
    this.status.branch = name;
  }

  async merge(branch: string): Promise<void> {
    // Mock merge - just add to branches
    if (!this.branches.includes(branch)) {
      this.branches.push(branch);
    }
  }

  async diff(file?: string, staged?: boolean): Promise<string> {
    if (file) {
      return `Mock diff for ${file}`;
    }
    return 'Mock diff output';
  }

  async log(options?: any): Promise<any[]> {
    let commits = [...this.commits];

    if (options?.maxCount) {
      commits = commits.slice(0, options.maxCount);
    }

    if (options?.file) {
      commits = commits.filter(commit =>
        commit.files.includes(options.file)
      );
    }

    return commits;
  }

  async add(files: string[]): Promise<void> {
    for (const file of files) {
      if (this.status.modified.includes(file)) {
        this.status.modified = this.status.modified.filter(f => f !== file);
        this.status.staged.push(file);
      }
      if (this.status.untracked.includes(file)) {
        this.status.untracked = this.status.untracked.filter(f => f !== file);
        this.status.staged.push(file);
      }
    }
  }

  async push(remote?: string, branch?: string): Promise<void> {
    // Mock push - no actual implementation
    console.log(`Mock push to ${remote || 'origin'}/${branch || this.status.branch}`);
  }

  async pull(remote?: string, branch?: string): Promise<void> {
    // Mock pull - no actual implementation
    console.log(`Mock pull from ${remote || 'origin'}/${branch || this.status.branch}`);
  }

  // Additional utility methods for testing
  getCommitCount(): number {
    return this.commits.length;
  }

  getLatestCommit(): any {
    return this.commits[this.commits.length - 1] || null;
  }

  getBranches(): string[] {
    return [...this.branches];
  }

  addCommit(hash: string, message: string, files: string[] = []): void {
    this.commits.push({
      hash,
      message,
      author: 'Test User',
      date: new Date(),
      files
    });
  }
}