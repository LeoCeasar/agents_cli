import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { BaseAgent, EventBus, Logger, LogLevel } from '@agent-graph/core';
import { MockAgent, TestUtils } from '../fixtures/index.js';

describe('BaseAgent', () => {
  let agent: MockAgent;
  let eventBus: EventBus;
  let logger: Logger;

  beforeAll(() => {
    eventBus = new EventBus();
    logger = new Logger({ level: LogLevel.DEBUG }, 'Test');
  });

  it('should initialize successfully', async () => {
    const config = TestUtils.createMockAgentConfig();
    agent = new MockAgent(config);

    await agent.initialize();

    TestUtils.assert.isTrue(agent['isInitialized']);
  });

  it('should execute tasks correctly', async () => {
    const task = TestUtils.createMockTask({
      type: 'code_generation',
      input: { prompt: 'Create a hello world function' }
    });

    // Set mock response
    agent.setResponse('code_generation', {
      code: 'function hello() { return "Hello, World!"; }',
      language: 'javascript'
    });

    const result = await agent.execute(task);

    TestUtils.assert.equal(result.status, 'completed');
    TestUtils.assert.isDefined(result.output);
    TestUtils.assert.equal(result.output.code, 'function hello() { return "Hello, World!"; }');
  });

  it('should handle chat messages', async () => {
    const message = TestUtils.createMockMessage({
      content: 'Hello, how can you help me?'
    });

    // Set mock response
    agent.setResponse('chat', 'I can help you with coding tasks!');

    const response = await agent.chat(message);

    TestUtils.assert.equal(response.type, 'assistant');
    TestUtils.assert.equal(response.content, 'I can help you with coding tasks!');
  });

  it('should track execution history', async () => {
    const task1 = TestUtils.createMockTask({ type: 'analysis' });
    const task2 = TestUtils.createMockTask({ type: 'refactoring' });

    agent.setResponse('analysis', { analysis: 'Code looks good' });
    agent.setResponse('refactoring', { refactoredCode: 'Improved code' });

    await agent.execute(task1);
    await agent.execute(task2);

    const history = agent.getExecutionHistory();
    TestUtils.assert.equal(history.length, 2);
    TestUtils.assert.equal(history[0].type, 'analysis');
    TestUtils.assert.equal(history[1].type, 'refactoring');
  });

  it('should handle task failures gracefully', async () => {
    const task = TestUtils.createMockTask({
      type: 'unknown_type'
    });

    const result = await agent.execute(task);

    TestUtils.assert.equal(result.status, 'failed');
    TestUtils.assert.isDefined(result.error);
  });

  it('should emit events', async () => {
    const config = TestUtils.createMockAgentConfig({ id: 'test-agent-events' });
    const testAgent = new MockAgent(config);

    let initializedEventFired = false;
    testAgent.on('initialized', () => {
      initializedEventFired = true;
    });

    await testAgent.initialize();

    TestUtils.assert.isTrue(initializedEventFired);
  });

  afterAll(async () => {
    if (agent) {
      await agent.shutdown();
    }
  });
});