import type { IKnowledgeGraph, KnowledgeNode } from '@agent-graph/core';
import { Logger, LogLevel } from '@agent-graph/core';
import neo4j, { Driver, Session } from 'neo4j-driver';

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

export class Neo4jKnowledgeGraph implements IKnowledgeGraph {
  private driver: Driver;
  private database: string;
  private logger: Logger;

  constructor(config: Neo4jConfig) {
    this.driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
    this.database = config.database || 'neo4j';
    this.logger = new Logger({ level: LogLevel.INFO }, 'Neo4jKnowledgeGraph');
  }

  async connect(): Promise<void> {
    try {
      await this.driver.verifyConnectivity();
      this.logger.info('Connected to Neo4j database');
    } catch (error) {
      this.logger.error('Failed to connect to Neo4j', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.driver.close();
    this.logger.info('Disconnected from Neo4j database');
  }

  async addNode(node: KnowledgeNode): Promise<void> {
    const session = this.driver.session({ database: this.database });

    try {
      const query = `
        MERGE (n:${node.type} {id: $id})
        SET n.name = $name, n.properties = $properties
        RETURN n
      `;

      await session.run(query, {
        id: node.id,
        name: node.name,
        properties: node.properties || {}
      });

      this.logger.debug(`Node added: ${node.id}`);
    } catch (error) {
      this.logger.error(`Failed to add node: ${node.id}`, error as Error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async addEdge(from: string, to: string, type: string, properties?: any): Promise<void> {
    const session = this.driver.session({ database: this.database });

    try {
      const query = `
        MATCH (a), (b)
        WHERE a.id = $from AND b.id = $to
        MERGE (a)-[r:${type}]->(b)
        SET r.properties = $properties
        RETURN r
      `;

      await session.run(query, {
        from,
        to,
        properties: properties || {}
      });

      this.logger.debug(`Edge added: ${from} -> ${to} (${type})`);
    } catch (error) {
      this.logger.error(`Failed to add edge: ${from} -> ${to}`, error as Error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getNode(id: string): Promise<any> {
    const session = this.driver.session({ database: this.database });

    try {
      const query = 'MATCH (n {id: $id}) RETURN n';
      const result = await session.run(query, { id });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      return record.get('n').properties;
    } catch (error) {
      this.logger.error(`Failed to get node: ${id}`, error as Error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getNeighbors(id: string): Promise<any[]> {
    const session = this.driver.session({ database: this.database });

    try {
      const query = `
        MATCH (n {id: $id})-[r]-(neighbor)
        RETURN neighbor, type(r) as relationshipType, r.properties as relationshipProperties
      `;

      const result = await session.run(query, { id });
      return result.records.map(record => ({
        node: record.get('neighbor').properties,
        relationshipType: record.get('relationshipType'),
        relationshipProperties: record.get('relationshipProperties')
      }));
    } catch (error) {
      this.logger.error(`Failed to get neighbors for node: ${id}`, error as Error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async query(query: string, params: any = {}): Promise<any[]> {
    const session = this.driver.session({ database: this.database });

    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } catch (error) {
      this.logger.error(`Failed to execute query: ${query}`, error as Error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async updateNode(id: string, updates: any): Promise<void> {
    const session = this.driver.session({ database: this.database });

    try {
      const query = `
        MATCH (n {id: $id})
        SET n += $updates
        RETURN n
      `;

      await session.run(query, { id, updates });
      this.logger.debug(`Node updated: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to update node: ${id}`, error as Error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async deleteNode(id: string): Promise<void> {
    const session = this.driver.session({ database: this.database });

    try {
      const query = `
        MATCH (n {id: $id})
        DETACH DELETE n
      `;

      await session.run(query, { id });
      this.logger.debug(`Node deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete node: ${id}`, error as Error);
      throw error;
    } finally {
      await session.close();
    }
  }

  // Utility methods for common knowledge graph operations
  async findPath(from: string, to: string, maxLength: number = 5): Promise<any[]> {
    const query = `
      MATCH path = shortestPath((a {id: $from})-[*1..${maxLength}]-(b {id: $to}))
      RETURN path
    `;

    return this.query(query, { from, to });
  }

  async findSimilarNodes(nodeId: string, limit: number = 10): Promise<any[]> {
    const query = `
      MATCH (n {id: $nodeId})
      MATCH (n)-[r1]-(common)-[r2]-(similar)
      WHERE similar <> n AND type(r1) = type(r2)
      WITH similar, count(*) as score
      ORDER BY score DESC
      LIMIT $limit
      RETURN similar, score
    `;

    return this.query(query, { nodeId, limit });
  }

  async getProjectStructure(projectId: string): Promise<any> {
    const query = `
      MATCH (p:Project {id: $projectId})-[:CONTAINS]->(f:File)
      OPTIONAL MATCH (f)-[:CONTAINS]->(c:Class)
      OPTIONAL MATCH (f)-[:CONTAINS]->(fn:Function)
      OPTIONAL MATCH (c)-[:HAS_METHOD]->(m:Method)
      RETURN p, f, collect(DISTINCT c) as classes, collect(DISTINCT fn) as functions, collect(DISTINCT m) as methods
    `;

    return this.query(query, { projectId });
  }

  async analyzeDependencies(fileId: string): Promise<any> {
    const query = `
      MATCH (f:File {id: $fileId})
      OPTIONAL MATCH (f)-[:IMPORTS]->(dep:File)
      OPTIONAL MATCH (f)-[:USES]->(cls:Class)
      OPTIONAL MATCH (f)-[:CALLS]->(fn:Function)
      RETURN f, collect(DISTINCT dep) as dependencies, collect(DISTINCT cls) as usedClasses, collect(DISTINCT fn) as calledFunctions
    `;

    return this.query(query, { fileId });
  }
}