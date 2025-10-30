import type { IMemory } from '@agent-graph/core';
import { Logger, LogLevel } from '@agent-graph/core';

export interface MemoryItem {
  key: string;
  value: any;
  timestamp: number;
  ttl?: number;
  metadata?: Record<string, any>;
}

export class ShortTermMemory implements IMemory {
  private items = new Map<string, MemoryItem>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;
  private logger: Logger;

  constructor(maxSize: number = 100, cleanupIntervalMs: number = 60000) {
    this.maxSize = maxSize;
    this.logger = new Logger({ level: LogLevel.INFO }, 'ShortTermMemory');

    // Set up periodic cleanup of expired items
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);

    this.logger.info(`ShortTermMemory initialized with max size: ${maxSize}`);
  }

  async get(key: string): Promise<any> {
    const item = this.items.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.items.delete(key);
      this.logger.debug(`Expired item removed: ${key}`);
      return null;
    }

    this.logger.debug(`Memory item retrieved: ${key}`);
    return item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Ensure we don't exceed max size
    if (this.items.size >= this.maxSize && !this.items.has(key)) {
      // Remove oldest item (LRU eviction)
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.items.delete(oldestKey);
        this.logger.debug(`Evicted oldest item: ${oldestKey}`);
      }
    }

    const item: MemoryItem = {
      key,
      value,
      timestamp: Date.now(),
      ttl
    };

    this.items.set(key, item);
    this.logger.debug(`Memory item set: ${key}`, { ttl });
  }

  async delete(key: string): Promise<void> {
    const deleted = this.items.delete(key);
    if (deleted) {
      this.logger.debug(`Memory item deleted: ${key}`);
    }
  }

  async clear(): Promise<void> {
    const size = this.items.size;
    this.items.clear();
    this.logger.info(`ShortTermMemory cleared: ${size} items removed`);
  }

  async search(query: string, options: {
    limit?: number;
    includeMetadata?: boolean;
  } = {}): Promise<Array<{ key: string; value: any; metadata?: any }>> {
    const { limit = 10, includeMetadata = false } = options;
    const results: Array<{ key: string; value: any; metadata?: any }> = [];

    const queryLower = query.toLowerCase();

    for (const [key, item] of this.items.entries()) {
      // Skip expired items
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        continue;
      }

      // Simple text search in key and stringified value
      const keyMatch = key.toLowerCase().includes(queryLower);
      const valueMatch = typeof item.value === 'string' &&
        item.value.toLowerCase().includes(queryLower);

      if (keyMatch || valueMatch) {
        results.push({
          key,
          value: item.value,
          ...(includeMetadata && {
            metadata: {
              timestamp: item.timestamp,
              ttl: item.ttl,
              ...item.metadata
            }
          })
        });

        if (results.length >= limit) {
          break;
        }
      }
    }

    this.logger.debug(`Memory search returned ${results.length} results for query: ${query}`);
    return results;
  }

  // Utility methods
  async getAllKeys(): Promise<string[]> {
    return Array.from(this.items.keys());
  }

  async getSize(): Promise<number> {
    return this.items.size;
  }

  async exists(key: string): Promise<boolean> {
    const item = this.items.get(key);
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.items.delete(key);
      return false;
    }

    return true;
  }

  async setMetadata(key: string, metadata: Record<string, any>): Promise<void> {
    const item = this.items.get(key);
    if (item) {
      item.metadata = { ...item.metadata, ...metadata };
      this.logger.debug(`Metadata updated for key: ${key}`);
    }
  }

  async getMetadata(key: string): Promise<Record<string, any> | null> {
    const item = this.items.get(key);
    return item?.metadata || null;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.items.entries()) {
      if (item.ttl && now - item.timestamp > item.ttl) {
        this.items.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleanup removed ${cleanedCount} expired items`);
    }
  }

  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, item] of this.items.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.items.clear();
    this.logger.info('ShortTermMemory destroyed');
  }
}