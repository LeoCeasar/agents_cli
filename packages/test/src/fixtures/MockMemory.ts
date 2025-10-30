import type { IMemory } from '@agent-graph/core';

export class MockMemory implements IMemory {
  private data = new Map<string, { value: any; timestamp: number; ttl?: number }>();
  private currentTime = Date.now();

  async get(key: string): Promise<any> {
    const item = this.data.get(key);
    if (!item) {
      return null;
    }

    // Check TTL
    if (item.ttl && (this.currentTime - item.timestamp) > item.ttl) {
      this.data.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.data.set(key, {
      value,
      timestamp: this.currentTime,
      ttl
    });
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async search(query: string, options?: any): Promise<any[]> {
    const results: any[] = [];
    const queryLower = query.toLowerCase();

    for (const [key, item] of this.data.entries()) {
      const keyMatch = key.toLowerCase().includes(queryLower);
      const valueMatch = typeof item.value === 'string' &&
        item.value.toLowerCase().includes(queryLower);

      if (keyMatch || valueMatch) {
        results.push({
          key,
          value: item.value,
          timestamp: item.timestamp,
          ttl: item.ttl
        });
      }
    }

    return results;
  }

  // Utility methods for testing
  advanceTime(ms: number): void {
    this.currentTime += ms;
    // Clean up expired items
    for (const [key, item] of this.data.entries()) {
      if (item.ttl && (this.currentTime - item.timestamp) > item.ttl) {
        this.data.delete(key);
      }
    }
  }

  getTime(): number {
    return this.currentTime;
  }

  getAllKeys(): string[] {
    return Array.from(this.data.keys());
  }

  getSize(): number {
    return this.data.size;
  }

  exists(key: string): Promise<boolean> {
    return Promise.resolve(this.data.has(key));
  }
}