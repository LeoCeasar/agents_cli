import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { BaseAgent, AgentRegistry, TaskManager, EventBus, Logger, LogLevel } from '@agent-graph/core';
import { MemoryManager } from '@agent-graph/memory';
import { MockAgent, MockMemory, TestUtils } from '../fixtures/index.js';

describe('Agent Platform E2E Workflow', () => {
  let eventBus: EventBus;
  let logger: Logger;
  let agentRegistry: AgentRegistry;
  let taskManager: TaskManager;
  let memoryManager: MemoryManager;
  let mockMemory: MockMemory;

  beforeAll(async () => {
    eventBus = new EventBus();
    logger = new Logger({ level: LogLevel.INFO }, 'E2E-Test');
    agentRegistry = new AgentRegistry(eventBus, logger);
    taskManager = new TaskManager(eventBus, logger);
    mockMemory = new MockMemory();

    memoryManager = new MemoryManager({
      shortTerm: { maxSize: 100 },
      longTerm: { dbPath: ':memory:' }
    });

    // Replace internal memory with mock for testing
    (memoryManager as any).shortTermMemory = mockMemory;
    (memoryManager as any).longTermMemory = mockMemory;
  });

  it('should complete a full agent workflow', async () => {
    // 1. Create and register agents
    const codeAgentConfig = TestUtils.createMockAgentConfig({
      id: 'code-agent',
      name: 'Code Generation Agent',
      type: 'primary',
      tools: ['code_generation', 'analysis']
    });

    const debugAgentConfig = TestUtils.createMockAgentConfig({
      id: 'debug-agent',
      name: 'Debugging Agent',
      type: 'subagent',
      tools: ['debugging', 'analysis']
    });

    const codeAgent = new MockAgent(codeAgentConfig);
    const debugAgent = new MockAgent(debugAgentConfig);

    // Set up mock responses
    codeAgent.setResponse('code_generation', {
      code: 'function hello() { return "Hello, World!"; }',
      language: 'javascript'
    });

    debugAgent.setResponse('debugging', {
      issue: 'Potential null reference',
      fix: 'Add null check before accessing property'
    });

    // Register agents
    agentRegistry.register(codeAgent);
    agentRegistry.register(debugAgent);

    TestUtils.assert.equal(agentRegistry.size(), 2);

    // 2. Create and assign tasks
    const codeGenerationTask = await taskManager.create({
      type: 'code_generation',
      description: 'Generate a hello world function',
      status: 'pending',
      priority: 'high',
      input: { prompt: 'Create a hello world function' }
    });

    const debuggingTask = await taskManager.create({
      type: 'debugging',
      description: 'Debug the application',
      status: 'pending',
      priority: 'medium',
      input: { error: 'Cannot read property of undefined' }
    });

    // Assign tasks to agents
    await taskManager.assign(codeGenerationTask.id, 'code-agent');
    await taskManager.assign(debuggingTask.id, 'debug-agent');

    // 3. Execute tasks via agents
    const codeAgentInstance = agentRegistry.get('code-agent')!;
    const debugAgentInstance = agentRegistry.get('debug-agent')!;

    const codeResult = await codeAgentInstance.execute(codeGenerationTask);
    const debugResult = await debugAgentInstance.execute(debuggingTask);

    // 4. Verify task completion
    TestUtils.assert.equal(codeResult.status, 'completed');
    TestUtils.assert.equal(debugResult.status, 'completed');

    TestUtils.assert.isDefined(codeResult.output);
    TestUtils.assert.isDefined(debugResult.output);

    // 5. Store results in memory
    await memoryManager.set(`task_result_${codeResult.id}`, codeResult.output);
    await memoryManager.set(`task_result_${debugResult.id}`, debugResult.output);

    await memoryManager.set('workflow_summary', {
      totalTasks: 2,
      completedTasks: 2,
      agentsInvolved: ['code-agent', 'debug-agent'],
      timestamp: new Date().toISOString()
    });

    // 6. Verify memory storage
    const storedCodeResult = await memoryManager.get(`task_result_${codeResult.id}`);
    const storedDebugResult = await memoryManager.get(`task_result_${debugResult.id}`);
    const summary = await memoryManager.get('workflow_summary');

    TestUtils.assert.deepEqual(storedCodeResult, codeResult.output);
    TestUtils.assert.deepEqual(storedDebugResult, debugResult.output);
    TestUtils.assert.equal(summary.totalTasks, 2);
    TestUtils.assert.equal(summary.completedTasks, 2);

    // 7. Test memory search functionality
    const searchResults = await memoryManager.search('hello');
    TestUtils.assert.isTrue(searchResults.length > 0);

    // 8. Test agent communication via events
    let eventReceived = false;
    eventBus.on('task:completed', (taskId, result) => {
      eventReceived = true;
    });

    // Create another task to trigger event
    const testTask = await taskManager.create({
      type: 'analysis',
      description: 'Test event',
      status: 'pending',
      priority: 'low'
    });

    await taskManager.complete(testTask.id, { analysis: 'Test complete' });

    TestUtils.assert.isTrue(eventReceived);
  });

  it('should handle agent chat interactions', async () => {
    const agentConfig = TestUtils.createMockAgentConfig({
      id: 'chat-agent',
      name: 'Chat Agent',
      type: 'primary'
    });

    const chatAgent = new MockAgent(agentConfig);
    chatAgent.setResponse('chat', (content: string) => {
      return `I understand you said: "${content}"`;
    });

    agentRegistry.register(chatAgent);

    const message = TestUtils.createMockMessage({
      content: 'Can you help me with TypeScript?'
    });

    const response = await chatAgent.chat(message);

    TestUtils.assert.equal(response.type, 'assistant');
    TestUtils.assert.isTrue(response.content.includes('TypeScript'));

    // Verify chat history
    const history = chatAgent.getMessageHistory();
    TestUtils.assert.equal(history.length, 2); // Original message + response
  });

  it('should handle complex multi-agent workflows', async () => {
    // Create specialized agents
    const analysisAgent = new MockAgent(TestUtils.createMockAgentConfig({
      id: 'analysis-agent',
      name: 'Analysis Agent',
      tools: ['analysis']
    }));

    const codeAgent = new MockAgent(TestUtils.createMockAgentConfig({
      id: 'code-agent-2',
      name: 'Code Agent',
      tools: ['code_generation']
    }));

    const testAgent = new MockAgent(TestUtils.createMockAgentConfig({
      id: 'test-agent',
      name: 'Test Agent',
      tools: ['testing']
    }));

    // Set up responses
    analysisAgent.setResponse('analysis', {
      complexity: 'medium',
      suggestions: ['Add error handling', 'Improve documentation'],
      estimatedTime: '2 hours'
    });

    codeAgent.setResponse('code_generation', {
      code: 'function processData(data) { /* implementation */ }',
      improvements: ['Added error handling', 'Added type safety']
    });

    testAgent.setResponse('testing', {
      tests: ['test basic functionality', 'test error cases'],
      coverage: 85
    });

    // Register agents
    agentRegistry.register(analysisAgent);
    agentRegistry.register(codeAgent);
    agentRegistry.register(testAgent);

    // Create workflow tasks
    const analysisTask = await taskManager.create({
      type: 'analysis',
      description: 'Analyze existing code',
      status: 'pending',
      priority: 'high'
    });

    // Execute analysis
    const analysisResult = await analysisAgent.execute(analysisTask);
    await taskManager.complete(analysisTask.id, analysisResult.output);

    // Create code generation task based on analysis
    const codeTask = await taskManager.create({
      type: 'code_generation',
      description: 'Implement improvements based on analysis',
      status: 'pending',
      priority: 'high',
      input: analysisResult.output
    });

    // Execute code generation
    const codeResult = await codeAgent.execute(codeTask);
    await taskManager.complete(codeTask.id, codeResult.output);

    // Create testing task
    const testTask = await taskManager.create({
      type: 'testing',
      description: 'Generate tests for new code',
      status: 'pending',
      priority: 'medium',
      input: codeResult.output
    });

    // Execute testing
    const testResult = await testAgent.execute(testTask);
    await taskManager.complete(testTask.id, testResult.output);

    // Verify workflow completion
    const allTasks = await taskManager.list();
    const completedTasks = allTasks.filter(t => t.status === 'completed');

    TestUtils.assert.equal(completedTasks.length, 3);

    // Store workflow results
    await memoryManager.set('multi_agent_workflow', {
      analysis: analysisResult.output,
      code: codeResult.output,
      tests: testResult.output,
      completedAt: new Date().toISOString()
    });

    const workflow = await memoryManager.get('multi_agent_workflow');
    TestUtils.assert.isDefined(workflow.analysis);
    TestUtils.assert.isDefined(workflow.code);
    TestUtils.assert.isDefined(workflow.tests);
  });

  afterAll(async () => {
    // Cleanup
    agentRegistry.clear();
    taskManager.clear();
    await memoryManager.close();
  });
});