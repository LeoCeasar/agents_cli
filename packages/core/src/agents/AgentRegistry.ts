import type { IAgentRegistry, IAgent, IEventBus, ILogger } from '../interfaces/index.js';

export class AgentRegistry implements IAgentRegistry {
  private agents = new Map<string, IAgent>();
  private eventBus: IEventBus;
  private logger: ILogger;

  constructor(eventBus: IEventBus, logger: ILogger) {
    this.eventBus = eventBus;
    this.logger = logger;
  }

  register(agent: IAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with id ${agent.id} is already registered`);
    }

    this.agents.set(agent.id, agent);
    this.logger.info(`Agent registered: ${agent.id}`);
    this.eventBus.emit('registry:agent-registered', agent.id);
  }

  unregister(agentId: string): void {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent with id ${agentId} is not registered`);
    }

    this.agents.delete(agentId);
    this.logger.info(`Agent unregistered: ${agentId}`);
    this.eventBus.emit('registry:agent-unregistered', agentId);
  }

  get(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }

  list(): IAgent[] {
    return Array.from(this.agents.values());
  }

  findByType(type: string): IAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.config.type === type);
  }

  findByCapability(capability: string): IAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.config.tools?.includes(capability)
    );
  }

  clear(): void {
    const agentIds = Array.from(this.agents.keys());
    this.agents.clear();
    this.logger.info('All agents unregistered', { count: agentIds.length });
    this.eventBus.emit('registry:cleared', agentIds);
  }

  size(): number {
    return this.agents.size;
  }

  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }
}