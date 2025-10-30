import type { IMemory } from '@agent-graph/core';
import { Logger, LogLevel } from '@agent-graph/core';

export interface LongTermMemoryConfig {
  dbPath: string;
  enableVectorSearch?: boolean;
  vectorDimension?: number;
}

export interface MemoryRecord {
  id: string;
  key: string;
  value: any;
  embeddings?: number[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  access_count: number;
  last_accessed: string;
}

export class LongTermMemory implements IMemory {
  private storage: Map<string, MemoryRecord> = new Map();
  private logger: Logger;

  constructor(config: LongTermMemoryConfig) {
    this.logger = new Logger({ level: LogLevel.INFO }, 'LongTermMemory');
  }

  async initialize(): Promise<void> {
    this.logger.info(`LongTermMemory initialized with simplified storage`);
  }

  async get(key: string): Promise<any> {
    const record = this.storage.get(key);
    if (record) {
      record.access_count++;
      record.last_accessed = new Date().toISOString();
      return record.value;
    }
    return null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const record: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random()}`,
      key,
      value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      access_count: 0,
      last_accessed: new Date().toISOString()
    };

    this.storage.set(key, record);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.storage.keys());
    if (!pattern) return allKeys;

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  async search(query: string, limit?: number): Promise<any[]> {
    const results: any[] = [];
    for (const record of this.storage.values()) {
      if (JSON.stringify(record.value).includes(query)) {
        results.push(record.value);
        if (limit && results.length >= limit) break;
      }
    }
    return results;
  }

  async close(): Promise<void> {
    this.storage.clear();
    this.logger.info('LongTermMemory closed');
  }
}