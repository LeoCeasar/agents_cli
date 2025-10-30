import { describe, it, expect } from 'bun:test';
import { TaskManager, EventBus, Logger, LogLevel } from '@agent-graph/core';
import { TestUtils } from '../fixtures/index.js';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let eventBus: EventBus;
  let logger: Logger;

  beforeEach(() => {
    eventBus = new EventBus();
    logger = new Logger({ level: LogLevel.DEBUG }, 'Test');
    taskManager = new TaskManager(eventBus, logger);
  });

  it('should create tasks successfully', async () => {
    const taskData = {
      type: 'code_generation',
      description: 'Generate a hello world function',
      status: 'pending' as const,
      priority: 'medium' as const,
      input: { prompt: 'Create hello world function' }
    };

    const task = await taskManager.create(taskData);

    TestUtils.assert.isDefined(task.id);
    TestUtils.assert.equal(task.type, 'code_generation');
    TestUtils.assert.equal(task.description, 'Generate a hello world function');
    TestUtils.assert.equal(task.status, 'pending');
    TestUtils.assert.equal(task.priority, 'medium');
    TestUtils.assert.isDefined(task.createdAt);
    TestUtils.assert.isDefined(task.updatedAt);
  });

  it('should update tasks', async () => {
    const task = await taskManager.create({
      type: 'analysis',
      description: 'Analyze code',
      status: 'pending',
      priority: 'medium'
    });

    const updatedTask = await taskManager.update(task.id, {
      status: 'in_progress',
      assignedAgent: 'test-agent'
    });

    TestUtils.assert.equal(updatedTask.status, 'in_progress');
    TestUtils.assert.equal(updatedTask.assignedAgent, 'test-agent');
    TestUtils.assert.notEqual(updatedTask.updatedAt.getTime(), task.updatedAt.getTime());
  });

  it('should get tasks by ID', async () => {
    const taskData = {
      type: 'debugging',
      description: 'Debug the application',
      status: 'pending',
      priority: 'high'
    };

    const createdTask = await taskManager.create(taskData);
    const retrievedTask = await taskManager.get(createdTask.id);

    TestUtils.assert.isDefined(retrievedTask);
    TestUtils.assert.equal(retrievedTask!.id, createdTask.id);
    TestUtils.assert.equal(retrievedTask!.description, 'Debug the application');
  });

  it('should list tasks with filtering', async () => {
    // Create tasks with different properties
    await taskManager.create({
      type: 'code_generation',
      description: 'Generate code',
      status: 'pending',
      priority: 'high'
    });

    await taskManager.create({
      type: 'analysis',
      description: 'Analyze code',
      status: 'completed',
      priority: 'medium'
    });

    await taskManager.create({
      type: 'testing',
      description: 'Run tests',
      status: 'pending',
      priority: 'low'
    });

    // Test filtering by status
    const pendingTasks = await taskManager.list({ status: 'pending' });
    TestUtils.assert.equal(pendingTasks.length, 2);

    // Test filtering by priority
    const highPriorityTasks = await taskManager.list({ priority: 'high' });
    TestUtils.assert.equal(highPriorityTasks.length, 1);

    // Test filtering by type
    const codeGenTasks = await taskManager.list({ type: 'code_generation' });
    TestUtils.assert.equal(codeGenTasks.length, 1);
  });

  it('should assign tasks to agents', async () => {
    const task = await taskManager.create({
      type: 'refactoring',
      description: 'Refactor code',
      status: 'pending',
      priority: 'medium'
    });

    await taskManager.assign(task.id, 'test-agent');

    const updatedTask = await taskManager.get(task.id);
    TestUtils.assert.equal(updatedTask!.assignedAgent, 'test-agent');
  });

  it('should complete tasks with results', async () => {
    const task = await taskManager.create({
      type: 'documentation',
      description: 'Generate documentation',
      status: 'in_progress',
      priority: 'medium'
    });

    const result = {
      documentation: 'Generated API documentation',
      format: 'markdown'
    };

    await taskManager.complete(task.id, result);

    const completedTask = await taskManager.get(task.id);
    TestUtils.assert.equal(completedTask!.status, 'completed');
    TestUtils.assert.deepEqual(completedTask!.output, result);
  });

  it('should fail tasks with error messages', async () => {
    const task = await taskManager.create({
      type: 'deployment',
      description: 'Deploy application',
      status: 'in_progress',
      priority: 'high'
    });

    const errorMessage = 'Deployment failed due to network error';

    await taskManager.fail(task.id, errorMessage);

    const failedTask = await taskManager.get(task.id);
    TestUtils.assert.equal(failedTask!.status, 'failed');
    TestUtils.assert.equal(failedTask!.error, errorMessage);
  });

  it('should delete tasks', async () => {
    const task = await taskManager.create({
      type: 'cleanup',
      description: 'Clean up resources',
      status: 'completed',
      priority: 'low'
    });

    const taskId = task.id;
    TestUtils.assert.isDefined(await taskManager.get(taskId));

    await taskManager.delete(taskId);
    TestUtils.assert.isUndefined(await taskManager.get(taskId));
  });

  it('should provide utility methods', async () => {
    // Create a mix of tasks
    await taskManager.create({ type: 'task1', description: 'Task 1', status: 'pending', priority: 'high' });
    await taskManager.create({ type: 'task2', description: 'Task 2', status: 'completed', priority: 'medium' });
    await taskManager.create({ type: 'task3', description: 'Task 3', status: 'pending', priority: 'critical' });

    const pendingTasks = await taskManager.getPendingTasks();
    TestUtils.assert.equal(pendingTasks.length, 2);

    const highPriorityTasks = await taskManager.getHighPriorityTasks();
    TestUtils.assert.equal(highPriorityTasks.length, 1);

    const criticalTasks = await taskManager.getCriticalTasks();
    TestUtils.assert.equal(criticalTasks.length, 1);
  });

  it('should handle task size tracking', async () => {
    TestUtils.assert.equal(taskManager.size(), 0);

    await taskManager.create({
      type: 'test',
      description: 'Test task',
      status: 'pending',
      priority: 'medium'
    });

    TestUtils.assert.equal(taskManager.size(), 1);

    await taskManager.create({
      type: 'test2',
      description: 'Test task 2',
      status: 'pending',
      priority: 'medium'
    });

    TestUtils.assert.equal(taskManager.size(), 2);

    taskManager.clear();
    TestUtils.assert.equal(taskManager.size(), 0);
  });
});