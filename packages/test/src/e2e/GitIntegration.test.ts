import { describe, it, expect } from 'bun:test';
import { GitRepository, SmartCommitAgent, CodeReviewAnalyzer } from '@agent-graph/git';
import { MockGitIntegration, TestUtils } from '../fixtures/index.js';

describe('Git Integration E2E', () => {
  let mockGit: MockGitIntegration;
  let gitRepo: GitRepository;
  let smartCommitAgent: SmartCommitAgent;
  let codeReviewAnalyzer: CodeReviewAnalyzer;

  beforeEach(async () => {
    mockGit = new MockGitIntegration();

    // Mock GitRepository to use our mock integration
    gitRepo = new GitRepository({
      path: '/test/repo',
      author: { name: 'Test User', email: 'test@example.com' }
    }) as any;

    (gitRepo as any).git = mockGit;

    const agentConfig = TestUtils.createMockAgentConfig({
      id: 'smart-commit-agent',
      name: 'Smart Commit Agent'
    });

    smartCommitAgent = new SmartCommitAgent(
      agentConfig,
      gitRepo,
      {
        autoStage: true,
        includeDiff: true,
        maxDiffLines: 100,
        template: {
          format: '{type}{(scope)}: {description}',
          includeScope: true,
          includeTicket: true,
          maxLineLength: 72
        }
      }
    );

    codeReviewAnalyzer = new CodeReviewAnalyzer(mockGit);
  });

  it('should perform a complete git workflow', async () => {
    // Setup some changes
    mockGit.setFileModified('src/example.ts');
    mockGit.setFileUntracked('src/new-file.ts');

    // Stage and commit changes
    await gitRepo.add(['src/example.ts', 'src/new-file.ts']);
    const commitHash = await gitRepo.commit('feat: add new functionality');

    TestUtils.assert.isDefined(commitHash);
    TestUtils.assert.isTrue(commitHash.length > 0);

    // Verify commit was created
    const commits = await gitRepo.log();
    TestUtils.assert.isTrue(commits.length > 0);
    TestUtils.assert.equal(commits[0].message, 'feat: add new functionality');
  });

  it('should generate smart commit messages', async () => {
    // Setup changes that would trigger different commit types
    mockGit.setFileModified('src/user.ts');
    mockGit.setFileModified('tests/user.test.ts');

    // Mock diff analysis
    const mockDiff = `
      --- a/src/user.ts
      +++ b/src/user.ts
      @@ -1,3 +1,5 @@
       export class User {
      +  private email: string;
      +
      +  constructor(email: string) {
      +    this.email = email;
      +  }
       }
    `;

    // Generate smart commit
    const commitHash = await smartCommitAgent.generateSmartCommit({
      files: ['src/user.ts'],
      includeDiff: true
    });

    TestUtils.assert.isDefined(commitHash);
  });

  it('should perform code review with issue detection', async () => {
    // Setup files with potential issues
    mockGit.setFileModified('src/secure.ts');
    mockGit.setFileModified('src/debug.ts');

    // Mock diff with security issues
    const mockDiff = `
      --- a/src/secure.ts
      +++ b/src/secure.ts
      @@ -1,3 +1,5 @@
       export class AuthService {
      +  private password = "secret123"; // Hardcoded secret
      +
      +  login() {
      +    console.log("Login attempt"); // Console log in production
      +  }
       }
    `;

    const reviewResult = await codeReviewAnalyzer.reviewChanges({
      files: ['src/secure.ts', 'src/debug.ts'],
      includeStaged: false
    });

    TestUtils.assert.isTrue(reviewResult.issues.length > 0);
    TestUtils.assert.isTrue(
      reviewResult.issues.some(issue => issue.rule === 'hardcoded-secret')
    );
    TestUtils.assert.isTrue(
      reviewResult.issues.some(issue => issue.rule === 'console-log')
    );

    TestUtils.assert.isTrue(reviewResult.summary.errorCount > 0);
    TestUtils.assert.isTrue(reviewResult.summary.warningCount > 0);
  });

  it('should detect and suggest resolutions for merge conflicts', async () => {
    // Mock a merge conflict
    const mockConflictDiff = `
      <<<<<<< HEAD
      const version = "1.0.0";
      =======
      const version = "2.0.0";
      >>>>>> feature/new-version
    `;

    // Mock the conflict detection
    mockGit.setFileConflicted('package.json');

    const reviewResult = await codeReviewAnalyzer.reviewChanges({
      files: ['package.json']
    });

    TestUtils.assert.isTrue(reviewResult.conflicts.length > 0);

    // Test conflict resolution suggestion
    const conflict = reviewResult.conflicts[0];
    const suggestion = await codeReviewAnalyzer.suggestConflictResolution(conflict);

    TestUtils.assert.isDefined(suggestion.resolution);
    TestUtils.assert.isDefined(suggestion.suggestion);
    TestUtils.assert.isTrue(suggestion.confidence > 0);
  });

  it('should analyze commit history and provide suggestions', async () => {
    // Add mock commits with different patterns
    mockGit.addCommit('feat1', 'feat: add user authentication');
    mockGit.addCommit('fix1', 'fix: resolve login issue');
    mockGit.addCommit('feat2', 'feat: implement password reset');
    mockGit.addCommit('fix2', 'fix: handle edge case in validation');
    mockGit.addCommit('refactor1', 'refactor: extract common utilities');

    const analysis = await smartCommitAgent.analyzeCommitHistory();

    TestUtils.assert.isTrue(analysis.commonPatterns.length > 0);
    TestUtils.assert.isDefined(analysis.suggestion);

    // Should detect high number of bug fixes
    TestUtils.assert.contains(analysis.commonPatterns, 'feat');
    TestUtils.assert.contains(analysis.commonPatterns, 'fix');
  });

  it('should handle branch operations', async () => {
    // Create a new branch
    await gitRepo.branch('feature/new-feature');

    const status = await gitRepo.getStatus();
    TestUtils.assert.equal(status.branch, 'feature/new-feature');

    // Switch back to main
    await gitRepo.checkout('main');

    const mainStatus = await gitRepo.getStatus();
    TestUtils.assert.equal(mainStatus.branch, 'main');
  });

  it('should handle git status and file operations', async () => {
    // Setup file states
    mockGit.setFileStaged('src/app.ts');
    mockGit.setFileModified('src/utils.ts');
    mockGit.setFileUntracked('docs/api.md');
    mockGit.setFileConflicted('package.json');

    const status = await gitRepo.getStatus();

    TestUtils.assert.equal(status.staged.length, 1);
    TestUtils.assert.equal(status.modified.length, 1);
    TestUtils.assert.equal(status.untracked.length, 1);
    TestUtils.assert.equal(status.conflicted.length, 1);

    TestUtils.assert.contains(status.staged, 'src/app.ts');
    TestUtils.assert.contains(status.modified, 'src/utils.ts');
    TestUtils.assert.contains(status.untracked, 'docs/api.md');
    TestUtils.assert.contains(status.conflicted, 'package.json');
  });
});