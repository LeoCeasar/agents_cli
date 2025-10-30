export async function createProjectConfig(options: {
  name: string;
  agents: string[];
  git: boolean;
  knowledge: boolean;
}): Promise<any> {
  const defaultConfig = {
    name: options.name,
    version: '1.0.0',
    agents: options.agents,
    features: {
      git: options.git,
      knowledge: options.knowledge,
      memory: true,
      collaboration: true
    },
    settings: {
      maxConcurrentTasks: 3,
      timeoutMs: 300000,
      retryAttempts: 2,
      logLevel: 'info'
    },
    agents_config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Add default configurations for each agent
  for (const agent of options.agents) {
    defaultConfig.agents_config[agent] = getAgentDefaultConfig(agent);
  }

  return defaultConfig;
}

function getAgentDefaultConfig(agent: string): any {
  const configs: Record<string, any> = {
    code: {
      enabled: true,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.3,
        maxTokens: 4000
      },
      capabilities: ['code_generation', 'refactoring', 'optimization'],
      permissions: {
        read: true,
        write: true,
        execute: false
      }
    },
    debug: {
      enabled: true,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.1,
        maxTokens: 3000
      },
      capabilities: ['debugging', 'error_analysis', 'stack_trace_analysis'],
      permissions: {
        read: true,
        write: false,
        execute: false
      }
    },
    test: {
      enabled: true,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.2,
        maxTokens: 3500
      },
      capabilities: ['test_generation', 'coverage_analysis', 'quality_assurance'],
      permissions: {
        read: true,
        write: true,
        execute: true
      }
    },
    doc: {
      enabled: true,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.4,
        maxTokens: 3000
      },
      capabilities: ['documentation_generation', 'api_docs', 'readme_creation'],
      permissions: {
        read: true,
        write: true,
        execute: false
      }
    },
    architect: {
      enabled: true,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.5,
        maxTokens: 4000
      },
      capabilities: ['system_design', 'architecture_planning', 'pattern_selection'],
      permissions: {
        read: true,
        write: false,
        execute: false
      }
    },
    security: {
      enabled: true,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.1,
        maxTokens: 3000
      },
      capabilities: ['security_analysis', 'vulnerability_detection', 'code_hardening'],
      permissions: {
        read: true,
        write: false,
        execute: false
      }
    }
  };

  return configs[agent] || {
    enabled: true,
    model: {
      provider: 'anthropic',
      model: 'claude-3.5-sonnet',
      temperature: 0.3,
      maxTokens: 3000
    },
    capabilities: [],
    permissions: {
      read: true,
      write: false,
      execute: false
    }
  };
}

export function validateProjectConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!config.name) errors.push('Project name is required');
  if (!config.agents || !Array.isArray(config.agents)) errors.push('Agents list is required');
  if (!config.features) errors.push('Features configuration is required');

  // Validate agents
  const validAgents = ['code', 'debug', 'test', 'doc', 'architect', 'security'];
  if (config.agents) {
    for (const agent of config.agents) {
      if (!validAgents.includes(agent)) {
        errors.push(`Invalid agent: ${agent}`);
      }
    }
  }

  // Validate features
  if (config.features && typeof config.features === 'object') {
    const features = ['git', 'knowledge', 'memory', 'collaboration'];
    for (const feature of features) {
      if (typeof config.features[feature] !== 'boolean') {
        errors.push(`Feature ${feature} must be a boolean`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}