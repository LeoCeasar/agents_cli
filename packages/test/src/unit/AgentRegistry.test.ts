import { describe, it, expect } from 'bun:test';
import { AgentRegistry, EventBus, Logger, LogLevel } from '@agent-graph/core';
import { MockAgent, TestUtils } from '../fixtures/index.js';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let eventBus: EventBus;
  let logger: Logger;

  beforeEach(() => {
    eventBus = new EventBus();
    logger = new Logger({ level: LogLevel.DEBUG }, 'Test');
    registry = new AgentRegistry(eventBus, logger);
  });

  it('should register agents successfully', () => {
    const config = TestUtils.createMockAgentConfig({ id: 'test-agent-1' });
    const agent = new MockAgent(config);

    registry.register(agent);

    TestUtils.assert.equal(registry.size(), 1);
    TestUtils.assert.isTrue(registry.has('test-agent-1'));
  });

  it('should not allow duplicate agent registration', () => {
    const config = TestUtils.createMockAgentConfig({ id: 'test-agent-1' });
    const agent1 = new MockAgent(config);
    const agent2 = new MockAgent(config);

    registry.register(agent1);

    TestUtils.assert.throws(() => {
      registry.register(agent2);
    }, 'already registered');
  });

  it('should unregister agents', () => {
    const config = TestUtils.createMockAgentConfig({ id: 'test-agent-1' });
    const agent = new MockAgent(config);

    registry.register(agent);
    TestUtils.assert.equal(registry.size(), 1);

    registry.unregister('test-agent-1');
    TestUtils.assert.equal(registry.size(), 0);
    TestUtils.assert.isFalse(registry.has('test-agent-1'));
  });

  it('should find agents by type', () => {
    const config1 = TestUtils.createMockAgentConfig({ id: 'agent-1', type: 'primary' });
    const config2 = TestUtils.createMockAgentConfig({ id: 'agent-2', type: 'subagent' });
    const config3 = TestUtils.createMockAgentConfig({ id: 'agent-3', type: 'primary' });

    const agent1 = new MockAgent(config1);
    const agent2 = new MockAgent(config2);
    const agent3 = new MockAgent(config3);

    registry.register(agent1);
    registry.register(agent2);
    registry.register(agent3);

    const primaryAgents = registry.findByType('primary');
    const subagentAgents = registry.findByType('subagent');

    TestUtils.assert.equal(primaryAgents.length, 2);
    TestUtils.assert.equal(subagentAgents.length, 1);
  });

  it('should find agents by capability', () => {
    const config1 = TestUtils.createMockAgentConfig({
      id: 'agent-1',
      tools: ['code_generation', 'analysis']
    });
    const config2 = TestUtils.createMockAgentConfig({
      id: 'agent-2',
      tools: ['debugging']
    });
    const config3 = TestUtils.createMockAgentConfig({
      id: 'agent-3',
      tools: ['code_generation', 'testing']
    });

    const agent1 = new MockAgent(config1);
    const agent2 = new MockAgent(config2);
    const agent3 = new MockAgent(config3);

    registry.register(agent1);
    registry.register(agent2);
    registry.register(agent3);

    const codeGenAgents = registry.findByCapability('code_generation');
    const debugAgents = registry.findByCapability('debugging');
    const testAgents = registry.findByCapability('testing');

    TestUtils.assert.equal(codeGenAgents.length, 2);
    TestUtils.assert.equal(debugAgents.length, 1);
    TestUtils.assert.equal(testAgents.length, 1);
  });

  it('should list all agents', () => {
    const config1 = TestUtils.createMockAgentConfig({ id: 'agent-1' });
    const config2 = TestUtils.createMockAgentConfig({ id: 'agent-2' });

    const agent1 = new MockAgent(config1);
    const agent2 = new MockAgent(config2);

    registry.register(agent1);
    registry.register(agent2);

    const allAgents = registry.list();
    TestUtils.assert.equal(allAgents.length, 2);
  });

  it('should get specific agent by ID', () => {
    const config = TestUtils.createMockAgentConfig({ id: 'test-agent-1' });
    const agent = new MockAgent(config);

    registry.register(agent);

    const retrieved = registry.get('test-agent-1');
    TestUtils.assert.isDefined(retrieved);
    TestUtils.assert.equal(retrieved!.id, 'test-agent-1');

    const notFound = registry.get('non-existent');
    TestUtils.assert.isUndefined(notFound);
  });

  it('should clear all agents', () => {
    const config1 = TestUtils.createMockAgentConfig({ id: 'agent-1' });
    const config2 = TestUtils.createMockAgentConfig({ id: 'agent-2' });

    const agent1 = new MockAgent(config1);
    const agent2 = new MockAgent(config2);

    registry.register(agent1);
    registry.register(agent2);

    TestUtils.assert.equal(registry.size(), 2);

    registry.clear();
    TestUtils.assert.equal(registry.size(), 0);
  });
});