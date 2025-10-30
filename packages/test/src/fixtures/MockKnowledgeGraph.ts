import type { IKnowledgeGraph, KnowledgeNode } from '@agent-graph/core';

export class MockKnowledgeGraph implements IKnowledgeGraph {
  private nodes = new Map<string, KnowledgeNode>();
  private edges = new Map<string, Array<{ to: string; type: string; properties?: any }>>();

  async addNode(node: KnowledgeNode): Promise<void> {
    this.nodes.set(node.id, node);
  }

  async addEdge(from: string, to: string, type: string, properties?: any): Promise<void> {
    if (!this.edges.has(from)) {
      this.edges.set(from, []);
    }
    this.edges.get(from)!.push({ to, type, properties });
  }

  async getNode(id: string): Promise<any> {
    return this.nodes.get(id) || null;
  }

  async getNeighbors(id: string): Promise<any[]> {
    const neighbors: any[] = [];
    const edges = this.edges.get(id) || [];

    for (const edge of edges) {
      const node = await this.getNode(edge.to);
      if (node) {
        neighbors.push({
          node,
          relationshipType: edge.type,
          relationshipProperties: edge.properties
        });
      }
    }

    return neighbors;
  }

  async query(query: string, params?: any): Promise<any[]> {
    // Simple mock query implementation
    if (query.includes('MATCH')) {
      const results: any[] = [];
      for (const [id, node] of this.nodes.entries()) {
        results.push({
          n: { properties: node },
          relationships: this.edges.get(id) || []
        });
      }
      return results;
    }
    return [];
  }

  async updateNode(id: string, updates: any): Promise<void> {
    const node = this.nodes.get(id);
    if (node) {
      Object.assign(node, updates);
    }
  }

  async deleteNode(id: string): Promise<void> {
    this.nodes.delete(id);
    // Remove edges to/from this node
    for (const [from, edges] of this.edges.entries()) {
      const filtered = edges.filter(edge => edge.to !== id);
      this.edges.set(from, filtered);
    }
    this.edges.delete(id);
  }

  // Utility methods for testing
  getAllNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): Array<{ from: string; to: string; type: string; properties?: any }> {
    const allEdges: Array<{ from: string; to: string; type: string; properties?: any }> = [];
    for (const [from, edges] of this.edges.entries()) {
      for (const edge of edges) {
        allEdges.push({ from, ...edge });
      }
    }
    return allEdges;
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  getEdgeCount(): number {
    let count = 0;
    for (const edges of this.edges.values()) {
      count += edges.length;
    }
    return count;
  }
}