import type { IMemory } from '@agent-graph/core';
import { ShortTermMemory } from './short-term/ShortTermMemory.js';
import { LongTermMemory, type LongTermMemoryConfig } from './long-term/LongTermMemory.js';
import { Logger, LogLevel } from '@agent-graph/core';

export interface MemoryManagerConfig {
  shortTerm?: {
    maxSize?: number;
    cleanupIntervalMs?: number;
  };
  longTerm: LongTermMemoryConfig;
  autoPromote?: boolean;
  promoteThreshold?: number;
  promoteInterval?: number;
}

export class MemoryManager implements IMemory {
  private shortTermMemory: ShortTermMemory;
  private longTermMemory: LongTermMemory;
  private logger: Logger;
  private config: MemoryManagerConfig;
  private promoteInterval: NodeJS.Timeout | null = null;

  constructor(config: MemoryManagerConfig) {
    this.config = {
      autoPromote: true,
      promoteThreshold: 10,
      promoteInterval: 300000, // 5 minutes
      ...config
    };

    this.shortTermMemory = new ShortTermMemory(
      this.config.shortTerm?.maxSize || 100,
      this.config.shortTerm?.cleanupIntervalMs || 60000
    );

    this.longTermMemory = new LongTermMemory(this.config.longTerm);
    this.logger = new Logger({ level: LogLevel.INFO }, 'MemoryManager');

    // Set up auto-promotion if enabled
    if (this.config.autoPromote) {
      this.setupAutoPromotion();
    }
  }

  async initialize(): Promise<void> {
    await this.longTermMemory.initialize();
    this.logger.info('MemoryManager initialized');
  }

  async get(key: string): Promise<any> {
    // Try short-term memory first
    let value = await this.shortTermMemory.get(key);

    if (value !== null) {
      this.logger.debug(`Retrieved from short-term memory: ${key}`);
      return value;
    }

    // Try long-term memory
    value = await this.longTermMemory.get(key);

    if (value !== null) {
      this.logger.debug(`Retrieved from long-term memory: ${key}`);

      // Optionally promote back to short-term memory
      if (this.shouldPromoteToShortTerm(key)) {
        await this.shortTermMemory.set(key, value);
        this.logger.debug(`Promoted to short-term memory: ${key}`);
      }
    }

    return value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Always store in short-term memory first
    await this.shortTermMemory.set(key, value, ttl);
    this.logger.debug(`Stored in short-term memory: ${key}`, { ttl });

    // For long-term storage, check if we should store immediately
    if (this.shouldStoreInLongTerm(key, value)) {
      await this.longTermMemory.set(key, value);
      this.logger.debug(`Also stored in long-term memory: ${key}`);
    }
  }

  async delete(key: string): Promise<void> {
    await Promise.all([
      this.shortTermMemory.delete(key),
      this.longTermMemory.delete(key)
    ]);

    this.logger.debug(`Deleted from both memories: ${key}`);
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.shortTermMemory.clear(),
      this.longTermMemory.clear()
    ]);

    this.logger.info('Both memories cleared');
  }

  async search(query: string, options: {
    limit?: number;
    includeMetadata?: boolean;
    searchLongTerm?: boolean;
  } = {}): Promise<Array<{ key: string; value: any; source: 'short-term' | 'long-term'; metadata?: any }>> {
    const { limit = 20, includeMetadata = false, searchLongTerm = true } = options;

    // Search short-term memory
    const shortTermResults = await this.shortTermMemory.search(query, {
      limit: Math.ceil(limit / 2),
      includeMetadata
    });

    const results: Array<{ key: string; value: any; source: 'short-term' | 'long-term'; metadata?: any }> = shortTermResults.map(result => ({
      ...result,
      source: 'short-term' as const
    }));

    // Search long-term memory if enabled
    if (searchLongTerm) {
      try {
        const longTermResults = await this.longTermMemory.search(query, {
          limit: limit - results.length,
          includeMetadata
        });

        results.push(...longTermResults.map(result => ({
          ...result,
          source: 'long-term' as const
        })));
      } catch (error) {
        this.logger.warn('Long-term memory search failed', { error: (error as Error).message });
      }
    }

    this.logger.debug(`Memory search returned ${results.length} results for query: ${query}`);
    return results;
  }

  // Memory management methods
  async promoteToLongTerm(key: string): Promise<void> {
    const value = await this.shortTermMemory.get(key);
    if (value !== null) {
      await this.longTermMemory.set(key, value);
      await this.shortTermMemory.delete(key);
      this.logger.debug(`Promoted to long-term memory: ${key}`);
    }
  }

  async promoteToShortTerm(key: string): Promise<void> {
    const value = await this.longTermMemory.get(key);
    if (value !== null) {
      await this.shortTermMemory.set(key, value);
      this.logger.debug(`Promoted to short-term memory: ${key}`);
    }
  }

  async getMemoryStats(): Promise<{
    shortTerm: { size: number; maxSize: number };
    longTerm: { size: number };
  }> {
    const shortTermSize = await this.shortTermMemory.getSize();
    const longTermSize = await this.longTermMemory.getSize();

    return {
      shortTerm: {
        size: shortTermSize,
        maxSize: this.config.shortTerm?.maxSize || 100
      },
      longTerm: { size: longTermSize }
    };
  }

  async getAllKeys(): Promise<{
    shortTerm: string[];
    longTerm: string[];
    all: string[];
  }> {
    const [shortTermKeys, longTermKeys] = await Promise.all([
      this.shortTermMemory.getAllKeys(),
      this.longTermMemory.getAllKeys()
    ]);

    const allKeys = Array.from(new Set([...shortTermKeys, ...longTermKeys]));

    return {
      shortTerm: shortTermKeys,
      longTerm: longTermKeys,
      all: allKeys
    };
  }

  async consolidate(): Promise<void> {
    this.logger.info('Starting memory consolidation');

    const shortTermKeys = await this.shortTermMemory.getAllKeys();
    let promotedCount = 0;

    for (const key of shortTermKeys) {
      if (this.shouldPromoteToLongTerm(key)) {
        await this.promoteToLongTerm(key);
        promotedCount++;
      }
    }

    this.logger.info(`Memory consolidation complete: ${promotedCount} items promoted`);
  }

  // Private helper methods
  private shouldStoreInLongTerm(key: string, value: any): boolean {
    // Store important data immediately in long-term memory
    const importantKeys = ['config', 'preferences', 'user_profile', 'project_info'];
    return importantKeys.some(importantKey => key.includes(importantKey));
  }

  private shouldPromoteToShortTerm(key: string): boolean {
    // Promote frequently accessed or recent items back to short-term
    const recentKeys = ['last_context', 'current_task', 'active_conversation'];
    return recentKeys.some(recentKey => key.includes(recentKey));
  }

  private shouldPromoteToLongTerm(key: string): boolean {
    // Promote based on access patterns or importance
    const importantPatterns = ['analysis', 'conclusion', 'decision', 'learning'];
    return importantPatterns.some(pattern => key.includes(pattern));
  }

  private setupAutoPromotion(): void {
    if (this.config.promoteInterval) {
      this.promoteInterval = setInterval(async () => {
        try {
          await this.consolidate();
        } catch (error) {
          this.logger.error('Auto-promotion failed', error as Error);
        }
      }, this.config.promoteInterval);

      this.logger.debug(`Auto-promotion set up with interval: ${this.config.promoteInterval}ms`);
    }
  }

  async close(): Promise<void> {
    // Final consolidation before closing
    if (this.config.autoPromote) {
      await this.consolidate();
    }

    // Clear promotion interval
    if (this.promoteInterval) {
      clearInterval(this.promoteInterval);
      this.promoteInterval = null;
    }

    // Close long-term memory database
    await this.longTermMemory.close();

    // Destroy short-term memory
    this.shortTermMemory.destroy();

    this.logger.info('MemoryManager closed');
  }
}