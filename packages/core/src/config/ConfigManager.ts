import type { IConfigManager } from '../interfaces/index.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export interface ConfigOptions {
  globalConfigPath?: string;
  projectConfigPath?: string;
  environmentPrefix?: string;
}

export class ConfigManager implements IConfigManager {
  private globalConfigPath: string;
  private projectConfigPath: string;
  private environmentPrefix: string;
  private cache = new Map<string, any>();

  constructor(options: ConfigOptions = {}) {
    this.globalConfigPath = options.globalConfigPath || join(homedir(), '.agent-graph', 'config.json');
    this.projectConfigPath = options.projectConfigPath || join(process.cwd(), '.agent-graph', 'config.json');
    this.environmentPrefix = options.environmentPrefix || 'AGENT_GRAPH_';
  }

  get<T = any>(key: string): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const value = this.resolveValue(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  async reload(): Promise<void> {
    this.cache.clear();
  }

  async save(): Promise<void> {
    // Save cache to project config
    const configData: Record<string, any> = {};
    for (const [key, value] of this.cache.entries()) {
      this.setNestedValue(configData, key, value);
    }

    await this.ensureDirectoryExists(dirname(this.projectConfigPath));
    writeFileSync(this.projectConfigPath, JSON.stringify(configData, null, 2));
  }

  private resolveValue(key: string): any {
    // Priority: Environment variables > Project config > Global config > Defaults
    const envValue = this.getEnvironmentValue(key);
    if (envValue !== undefined) {
      return envValue;
    }

    const projectValue = this.getConfigValue(this.projectConfigPath, key);
    if (projectValue !== undefined) {
      return projectValue;
    }

    const globalValue = this.getConfigValue(this.globalConfigPath, key);
    if (globalValue !== undefined) {
      return globalValue;
    }

    return this.getDefaultValue(key);
  }

  private getEnvironmentValue(key: string): any {
    const envKey = this.environmentPrefix + key.toUpperCase().replace(/\./g, '_');
    const envValue = process.env[envKey];

    if (envValue === undefined) {
      return undefined;
    }

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(envValue);
    } catch {
      return envValue;
    }
  }

  private getConfigValue(configPath: string, key: string): any {
    if (!existsSync(configPath)) {
      return undefined;
    }

    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      return this.getNestedValue(config, key);
    } catch {
      return undefined;
    }
  }

  private getDefaultValue(key: string): any {
    const defaults: Record<string, any> = {
      'agents.default.model.provider': 'anthropic',
      'agents.default.model.model': 'claude-3.5-sonnet',
      'agents.default.temperature': 0.7,
      'agents.default.maxTokens': 4000,
      'memory.shortTerm.provider': 'memory',
      'memory.shortTerm.maxSize': 100,
      'memory.longTerm.provider': 'file',
      'knowledge.autoUpdate': true,
      'knowledge.provider': 'neo4j',
      'git.autoCommit': false,
      'git.autoPush': false,
      'logging.level': 'info',
      'logging.format': 'text'
    };

    return defaults[key];
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, prop) => {
      if (!current[prop] || typeof current[prop] !== 'object') {
        current[prop] = {};
      }
      return current[prop];
    }, obj);
    target[lastKey] = value;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }
}