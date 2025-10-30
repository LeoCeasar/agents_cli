import { describe, it, expect } from 'bun:test';
import { MemoryManager } from '@agent-graph/memory';
import { MockMemory, TestUtils } from '../fixtures/index.js';

describe('MemoryManager Integration', () => {
  let memoryManager: MemoryManager;
  let mockShortTermMemory: MockMemory;
  let mockLongTermMemory: MockMemory;

  beforeEach(async () => {
    mockShortTermMemory = new MockMemory();
    mockLongTermMemory = new MockMemory();

    // Mock the MemoryManager constructor to use our mock memories
    memoryManager = new MemoryManager({
      shortTerm: { maxSize: 50 },
      longTerm: { dbPath: ':memory:' }
    });

    // Replace internal memories with mocks for testing
    (memoryManager as any).shortTermMemory = mockShortTermMemory;
    (memoryManager as any).longTermMemory = mockLongTermMemory;
  });

  it('should store and retrieve from short-term memory first', async () => {
    const key = 'test_key';
    const value = { data: 'test_data' };

    await memoryManager.set(key, value);
    const retrieved = await memoryManager.get(key);

    TestUtils.assert.deepEqual(retrieved, value);
  });

  it('should fall back to long-term memory when not in short-term', async () => {
    const key = 'persistent_key';
    const value = { important: 'data' };

    // Store only in long-term memory
    await mockLongTermMemory.set(key, value);

    const retrieved = await memoryManager.get(key);
    TestUtils.assert.deepEqual(retrieved, value);
  });

  it('should search across both memory types', async () => {
    const shortTermKey = 'short_term_data';
    const longTermKey = 'long_term_data';
    const query = 'data';

    await mockShortTermMemory.set(shortTermKey, { content: 'short term data' });
    await mockLongTermMemory.set(longTermKey, { content: 'long term data' });

    const results = await memoryManager.search(query);

    TestUtils.assert.isTrue(results.length >= 2);

    const sources = results.map(r => r.source);
    TestUtils.assert.contains(sources, 'short-term');
    TestUtils.assert.contains(sources, 'long-term');
  });

  it('should provide memory statistics', async () => {
    // Add some test data
    await mockShortTermMemory.set('key1', 'value1');
    await mockShortTermMemory.set('key2', 'value2');
    await mockLongTermMemory.set('key3', 'value3');

    const stats = await memoryManager.getMemoryStats();

    TestUtils.assert.equal(stats.shortTerm.size, 2);
    TestUtils.assert.equal(stats.longTerm.size, 1);
  });

  it('should promote important data to long-term memory', async () => {
    const importantKey = 'user_preferences';
    const importantValue = { theme: 'dark', language: 'en' };

    await memoryManager.set(importantKey, importantValue);

    // Important data should be in both memories
    const shortTermValue = await mockShortTermMemory.get(importantKey);
    const longTermValue = await mockLongTermMemory.get(importantKey);

    TestUtils.assert.deepEqual(shortTermValue, importantValue);
    TestUtils.assert.deepEqual(longTermValue, importantValue);
  });

  it('should handle memory consolidation', async () => {
    // Add various types of data
    await mockShortTermMemory.set('temp_data', 'temporary');
    await mockShortTermMemory.set('analysis_result', { conclusion: 'important finding' });
    await mockShortTermMemory.set('debug_info', { error: 'null pointer' });

    await memoryManager.consolidate();

    // Important data should be promoted
    const analysisResult = await mockLongTermMemory.get('analysis_result');
    TestUtils.assert.isDefined(analysisResult);
  });
});