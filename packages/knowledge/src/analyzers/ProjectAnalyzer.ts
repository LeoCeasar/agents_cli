import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import { Logger, LogLevel } from '@agent-graph/core';
import type { KnowledgeNode } from '@agent-graph/core';
import { TypeScriptParser } from '../parsers/TypeScriptParser.js';
import { JavaScriptParser } from '../parsers/JavaScriptParser.js';
import { PythonParser } from '../parsers/PythonParser.js';

interface ProjectAnalysisOptions {
  includePatterns?: string[];
  excludePatterns?: string[];
  maxDepth?: number;
  followSymlinks?: boolean;
}

export class ProjectAnalyzer {
  private logger: Logger;
  private parsers: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger({ level: LogLevel.INFO }, 'ProjectAnalyzer');
    this.initializeParsers();
  }

  private initializeParsers(): void {
    this.parsers.set('.ts', new TypeScriptParser());
    this.parsers.set('.tsx', new TypeScriptParser());
    this.parsers.set('.js', new JavaScriptParser());
    this.parsers.set('.jsx', new JavaScriptParser());
    this.parsers.set('.py', new PythonParser());
  }

  async analyzeProject(projectPath: string, options: ProjectAnalysisOptions = {}): Promise<{
    project: KnowledgeNode;
    files: KnowledgeNode[];
    relationships: Array<{ from: string; to: string; type: string; properties?: any }>;
  }> {
    this.logger.info(`Starting project analysis: ${projectPath}`);

    const {
      includePatterns = ['**/*.{ts,tsx,js,jsx,py,json,md}'],
      excludePatterns = ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      maxDepth = 10,
      followSymlinks = false
    } = options;

    const projectNode: KnowledgeNode = {
      id: this.generateId(projectPath),
      type: 'concept',
      name: this.getProjectName(projectPath),
      properties: {
        path: projectPath,
        analyzedAt: new Date().toISOString(),
        fileCount: 0,
        languageDistribution: {}
      }
    };

    const files: KnowledgeNode[] = [];
    const relationships: Array<{ from: string; to: string; type: string; properties?: any }> = [];

    // Scan files
    const filePaths = await this.scanFiles(projectPath, includePatterns, excludePatterns, maxDepth, followSymlinks);
    projectNode.properties.fileCount = filePaths.length;

    // Analyze each file
    for (const filePath of filePaths) {
      try {
        const fileAnalysis = await this.analyzeFile(filePath, projectPath);

        files.push(...fileAnalysis.nodes);
        relationships.push(...fileAnalysis.relationships);

        // Add CONTAINS relationship from project to file
        relationships.push({
          from: projectNode.id,
          to: fileAnalysis.nodes[0]?.id || this.generateId(filePath),
          type: 'CONTAINS'
        });

        // Update language distribution
        const ext = extname(filePath).toLowerCase();
        const language = this.getLanguageFromExtension(ext);
        projectNode.properties.languageDistribution[language] =
          (projectNode.properties.languageDistribution[language] || 0) + 1;

      } catch (error) {
        this.logger.warn(`Failed to analyze file: ${filePath}`, { error: (error as Error).message });
      }
    }

    this.logger.info(`Project analysis complete: ${files.length} nodes, ${relationships.length} relationships`);

    return { project: projectNode, files, relationships };
  }

  private async scanFiles(
    rootPath: string,
    includePatterns: string[],
    excludePatterns: string[],
    maxDepth: number,
    followSymlinks: boolean
  ): Promise<string[]> {
    const filePaths: string[] = [];

    const scanDirectory = async (dirPath: string, currentDepth: number): Promise<void> => {
      if (currentDepth > maxDepth) {
        return;
      }

      try {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);
          const relativePath = relative(rootPath, fullPath);

          // Skip excluded patterns
          if (this.matchesPatterns(relativePath, excludePatterns)) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDirectory(fullPath, currentDepth + 1);
          } else if (entry.isFile() || (followSymlinks && entry.isSymbolicLink())) {
            // Check if file matches include patterns
            if (this.matchesPatterns(relativePath, includePatterns)) {
              filePaths.push(fullPath);
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to scan directory: ${dirPath}`, { error: (error as Error).message });
      }
    };

    await scanDirectory(rootPath, 0);
    return filePaths;
  }

  private matchesPatterns(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      // Simple glob pattern matching (can be enhanced with a proper glob library)
      const regex = new RegExp(
        pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\?/g, '[^/]')
      );
      return regex.test(path);
    });
  }

  private async analyzeFile(filePath: string, projectRoot: string): Promise<{
    nodes: KnowledgeNode[];
    relationships: Array<{ from: string; to: string; type: string; properties?: any }>;
  }> {
    const content = await readFile(filePath, 'utf-8');
    const ext = extname(filePath).toLowerCase();
    const relativePath = relative(projectRoot, filePath);

    const fileNode: KnowledgeNode = {
      id: this.generateId(filePath),
      type: 'file',
      name: relativePath,
      properties: {
        path: filePath,
        relativePath,
        size: content.length,
        extension: ext,
        language: this.getLanguageFromExtension(ext),
        lastModified: (await stat(filePath)).mtime.toISOString()
      }
    };

    const nodes = [fileNode];
    const relationships: Array<{ from: string; to: string; type: string; properties?: any }> = [];

    // Parse file content based on language
    const parser = this.parsers.get(ext);
    if (parser) {
      try {
        const parseResult = await parser.parse(content, fileNode.id);
        nodes.push(...parseResult.nodes);
        relationships.push(...parseResult.relationships);
      } catch (error) {
        this.logger.warn(`Failed to parse file: ${filePath}`, { error: (error as Error).message });
      }
    }

    return { nodes, relationships };
  }

  private getLanguageFromExtension(ext: string): string {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass'
    };

    return languageMap[ext] || 'unknown';
  }

  private getProjectName(projectPath: string): string {
    const parts = projectPath.split(/[/\\]/);
    return parts[parts.length - 1] || 'unknown';
  }

  private generateId(path: string): string {
    return Buffer.from(path).toString('base64').replace(/[/+=]/g, '_');
  }
}