import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { KnowledgeNode } from '@agent-graph/core';

interface ParseResult {
  nodes: KnowledgeNode[];
  relationships: Array<{ from: string; to: string; type: string; properties?: any }>;
}

export class JavaScriptParser {
  async parse(content: string, fileId: string): Promise<ParseResult> {
    const nodes: KnowledgeNode[] = [];
    const relationships: Array<{ from: string; to: string; type: string; properties?: any }> = [];

    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'objectRestSpread',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining'
        ]
      });

      traverse(ast, {
        // Handle imports
        ImportDeclaration(path) {
          const source = path.node.source.value;
          relationships.push({
            from: fileId,
            to: this.generateId(source),
            type: 'IMPORTS',
            properties: { source, module: source }
          });
        },

        // Handle exports
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            this.handleDeclaration(path.node.declaration, fileId, nodes, relationships);
          }
        },

        ExportDefaultDeclaration(path) {
          if (path.node.declaration) {
            this.handleDeclaration(path.node.declaration, fileId, nodes, relationships);
          }
        },

        // Handle classes
        ClassDeclaration(path) {
          if (path.node.id) {
            const className = path.node.id.name;
            const classNode: KnowledgeNode = {
              id: this.generateId(`${fileId}:${className}`),
              type: 'class',
              name: className,
              properties: {
                file: fileId,
                line: path.node.loc?.start.line,
                isExported: this.isExported(path.parentPath),
                extends: this.getExtends(path.node)
              }
            };

            nodes.push(classNode);
            relationships.push({
              from: fileId,
              to: classNode.id,
              type: 'CONTAINS'
            });

            // Handle inheritance
            if (path.node.superClass) {
              relationships.push({
                from: classNode.id,
                to: this.generateId(String(path.node.superClass)),
                type: 'EXTENDS'
              });
            }
          }
        },

        // Handle functions
        FunctionDeclaration(path) {
          if (path.node.id) {
            const functionName = path.node.id.name;
            const functionNode: KnowledgeNode = {
              id: this.generateId(`${fileId}:${functionName}`),
              type: 'function',
              name: functionName,
              properties: {
                file: fileId,
                line: path.node.loc?.start.line,
                isExported: this.isExported(path.parentPath),
                isAsync: path.node.async,
                isGenerator: path.node.generator,
                parameters: path.node.params.length
              }
            };

            nodes.push(functionNode);
            relationships.push({
              from: fileId,
              to: functionNode.id,
              type: 'CONTAINS'
            });
          }
        },

        // Handle arrow functions
        ArrowFunctionExpression(path) {
          const parent = path.parentPath;
          let name = 'anonymous';

          if (parent.isVariableDeclarator() && parent.node.id.type === 'Identifier') {
            name = (parent.node.id as any).name;
          } else if (parent.isAssignmentExpression() && parent.node.left.type === 'Identifier') {
            name = (parent.node.left as any).name;
          }

          const functionNode: KnowledgeNode = {
            id: this.generateId(`${fileId}:${name}_arrow`),
            type: 'function',
            name: name,
            properties: {
              file: fileId,
              line: path.node.loc?.start.line,
              kind: 'arrow',
              isAsync: path.node.async,
              parameters: path.node.params.length
            }
          };

          nodes.push(functionNode);
          relationships.push({
            from: fileId,
            to: functionNode.id,
            type: 'CONTAINS'
          });
        },

        // Handle variables
        VariableDeclaration(path) {
          path.get('declarations').forEach(declarator => {
            if (declarator.isVariableDeclarator() && declarator.node.id.type === 'Identifier') {
              const varName = (declarator.node.id as any).name;
              const varNode: KnowledgeNode = {
                id: this.generateId(`${fileId}:${varName}`),
                type: 'variable',
                name: varName,
                properties: {
                  file: fileId,
                  line: path.node.loc?.start.line,
                  kind: path.node.kind, // var, let, const
                  isExported: this.isExported(path.parentPath),
                  type: this.getInferredType(declarator.node)
                }
              };

              nodes.push(varNode);
              relationships.push({
                from: fileId,
                to: varNode.id,
                type: 'CONTAINS'
              });
            }
          });
        },

        // Handle method calls
        CallExpression(path) {
          const callee = path.node.callee;
          if (callee.type === 'Identifier') {
            relationships.push({
              from: fileId,
              to: this.generateId(callee.name),
              type: 'CALLS',
              properties: { line: path.node.loc?.start.line }
            });
          } else if (callee.type === 'MemberExpression') {
            const object = (callee.object as any).name;
            const property = (callee.property as any).name;
            if (object && property) {
              relationships.push({
                from: fileId,
                to: this.generateId(`${object}.${property}`),
                type: 'CALLS',
                properties: { line: path.node.loc?.start.line }
              });
            }
          }
        },

        // Handle React components
        JSXElement(path) {
          const openingElement = path.node.openingElement;
          const componentName = (openingElement.name as any).name;

          if (componentName && componentName[0] === componentName[0].toUpperCase()) {
            const componentNode: KnowledgeNode = {
              id: this.generateId(`${fileId}:${componentName}`),
              type: 'class', // React components treated as classes
              name: componentName,
              properties: {
                file: fileId,
                line: path.node.loc?.start.line,
                kind: 'react-component'
              }
            };

            nodes.push(componentNode);
            relationships.push({
              from: fileId,
              to: componentNode.id,
              type: 'RENDERS'
            });
          }
        }
      });

    } catch (error) {
      throw new Error(`JavaScript parsing failed: ${(error as Error).message}`);
    }

    return { nodes, relationships };
  }

  private handleDeclaration(declaration: any, fileId: string, nodes: KnowledgeNode[], relationships: any[]): void {
    // Handle different declaration types
    if (declaration.type === 'ClassDeclaration') {
      // Class handling is done in the visitor
    } else if (declaration.type === 'FunctionDeclaration') {
      // Function handling is done in the visitor
    } else if (declaration.type === 'VariableDeclaration') {
      // Variable handling is done in the visitor
    }
  }

  private isExported(path: any): boolean {
    return path.isExportDeclaration() || path.parentPath?.isExportDeclaration();
  }

  private getExtends(node: any): string | null {
    return node.superClass ? (node.superClass as any).name : null;
  }

  private getInferredType(node: any): string | null {
    if (node.init) {
      if (node.init.type === 'Literal') {
        return typeof node.init.value;
      } else if (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression') {
        return 'function';
      } else if (node.init.type === 'NewExpression') {
        return (node.init.callee as any).name;
      } else if (node.init.type === 'ArrayExpression') {
        return 'array';
      } else if (node.init.type === 'ObjectExpression') {
        return 'object';
      }
    }
    return null;
  }

  private generateId(identifier: string): string {
    return Buffer.from(identifier).toString('base64').replace(/[/+=]/g, '_');
  }
}