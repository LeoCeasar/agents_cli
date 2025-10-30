import type { KnowledgeNode } from '@agent-graph/core';

interface ParseResult {
  nodes: KnowledgeNode[];
  relationships: Array<{ from: string; to: string; type: string; properties?: any }>;
}

export class PythonParser {
  async parse(content: string, fileId: string): Promise<ParseResult> {
    const nodes: KnowledgeNode[] = [];
    const relationships: Array<{ from: string; to: string; type: string; properties?: any }> = [];

    try {
      // Simple Python parser using regex (in a real implementation, use ast module)
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        // Handle imports
        if (line.startsWith('import ')) {
          const module = line.substring(7).split(' as ')[0].trim();
          relationships.push({
            from: fileId,
            to: this.generateId(module),
            type: 'IMPORTS',
            properties: { source: module, line: lineNumber }
          });
        } else if (line.startsWith('from ')) {
          const match = line.match(/from\s+(.+)\s+import\s+(.+)/);
          if (match) {
            const module = match[1].trim();
            const imports = match[2].split(',').map(imp => imp.trim());

            for (const imp of imports) {
              relationships.push({
                from: fileId,
                to: this.generateId(`${module}.${imp}`),
                type: 'IMPORTS',
                properties: { source: module, import: imp, line: lineNumber }
              });
            }
          }
        }

        // Handle class definitions
        const classMatch = line.match(/^class\s+(\w+)(?:\s*\(\s*([^)]+)\s*\))?:/);
        if (classMatch) {
          const className = classMatch[1];
          const inheritance = classMatch[2] ? classMatch[2].split(',').map(c => c.trim()) : [];

          const classNode: KnowledgeNode = {
            id: this.generateId(`${fileId}:${className}`),
            type: 'class',
            name: className,
            properties: {
              file: fileId,
              line: lineNumber,
              inheritance,
              language: 'python'
            }
          };

          nodes.push(classNode);
          relationships.push({
            from: fileId,
            to: classNode.id,
            type: 'CONTAINS'
          });

          // Add inheritance relationships
          for (const parent of inheritance) {
            relationships.push({
              from: classNode.id,
              to: this.generateId(parent),
              type: 'EXTENDS'
            });
          }
        }

        // Handle function definitions
        const functionMatch = line.match(/^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/);
        if (functionMatch) {
          const functionName = functionMatch[1];
          const parameters = functionMatch[2] ? functionMatch[2].split(',').map(p => p.trim()).filter(p => p) : [];
          const isAsync = line.startsWith('async');

          const functionNode: KnowledgeNode = {
            id: this.generateId(`${fileId}:${functionName}`),
            type: 'function',
            name: functionName,
            properties: {
              file: fileId,
              line: lineNumber,
              parameters: parameters.length,
              parameterNames: parameters,
              isAsync,
              language: 'python'
            }
          };

          nodes.push(functionNode);
          relationships.push({
            from: fileId,
            to: functionNode.id,
            type: 'CONTAINS'
          });
        }

        // Handle variable assignments
        const varMatch = line.match(/^(\w+)\s*=\s*(.+)/);
        if (varMatch && !line.startsWith('def ') && !line.startsWith('class ')) {
          const varName = varMatch[1];
          const value = varMatch[2].trim();

          const varNode: KnowledgeNode = {
            id: this.generateId(`${fileId}:${varName}`),
            type: 'variable',
            name: varName,
            properties: {
              file: fileId,
              line: lineNumber,
              type: this.inferPythonType(value),
              value: value.length > 100 ? value.substring(0, 100) + '...' : value,
              language: 'python'
            }
          };

          nodes.push(varNode);
          relationships.push({
            from: fileId,
            to: varNode.id,
            type: 'CONTAINS'
          });
        }

        // Handle function calls
        const callMatch = line.match(/(\w+(?:\.\w+)*)\s*\(/);
        if (callMatch && !line.startsWith('def ') && !line.startsWith('class ')) {
          const callTarget = callMatch[1];

          relationships.push({
            from: fileId,
            to: this.generateId(callTarget),
            type: 'CALLS',
            properties: { line: lineNumber }
          });
        }
      }

    } catch (error) {
      throw new Error(`Python parsing failed: ${(error as Error).message}`);
    }

    return { nodes, relationships };
  }

  private inferPythonType(value: string): string {
    value = value.trim();

    if (value.startsWith('"') || value.startsWith("'")) {
      return 'string';
    } else if (value === 'True' || value === 'False') {
      return 'boolean';
    } else if (value === 'None') {
      return 'None';
    } else if (/^\d+$/.test(value)) {
      return 'int';
    } else if (/^\d+\.\d+$/.test(value)) {
      return 'float';
    } else if (value.startsWith('[') && value.endsWith(']')) {
      return 'list';
    } else if (value.startsWith('{') && value.endsWith('}')) {
      return 'dict';
    } else if (value.startsWith('(') && value.endsWith(')')) {
      return 'tuple';
    } else if (value.includes('(') && value.includes(')')) {
      return 'function_call';
    } else {
      return 'unknown';
    }
  }

  private generateId(identifier: string): string {
    return Buffer.from(identifier).toString('base64').replace(/[/+=]/g, '_');
  }
}