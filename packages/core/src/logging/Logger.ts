import type { ILogger } from '../interfaces/index.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text';
  includeTimestamp: boolean;
  includeMetadata: boolean;
}

export class Logger implements ILogger {
  private config: LoggerConfig;
  private context?: string;

  constructor(config: Partial<LoggerConfig> = {}, context?: string) {
    this.config = {
      level: LogLevel.INFO,
      format: 'text',
      includeTimestamp: true,
      includeMetadata: true,
      ...config
    };
    this.context = context;
  }

  child(context: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger({ ...this.config, ...config }, context);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    const errorMeta = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : {};

    this.log(LogLevel.ERROR, message, { ...meta, ...errorMeta });
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    if (level < this.config.level) {
      return;
    }

    const logEntry = {
      level: LogLevel[level],
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      ...(this.config.includeMetadata && meta && { metadata: meta })
    };

    if (this.config.format === 'json') {
      console.log(JSON.stringify(logEntry));
    } else {
      const parts: string[] = [];

      if (this.config.includeTimestamp) {
        parts.push(`[${logEntry.timestamp}]`);
      }

      parts.push(`[${logEntry.level}]`);

      if (this.context) {
        parts.push(`[${this.context}]`);
      }

      parts.push(logEntry.message);

      if (this.config.includeMetadata && meta) {
        parts.push(JSON.stringify(meta));
      }

      console.log(parts.join(' '));
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setFormat(format: 'json' | 'text'): void {
    this.config.format = format;
  }
}