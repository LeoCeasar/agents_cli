import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

// Mock context for TUI
const mockContext = {
  config: {
    name: 'Agent Graph Demo',
    agents: ['code', 'debug', 'test'],
    features: {
      git: true,
      knowledge: true,
      memory: true,
      collaboration: true
    }
  },
  agentRegistry: {
    list: () => [],
    get: () => null
  },
  collaborationManager: {
    orchestrateCollaboration: async () => ({
      success: true,
      results: [],
      totalDuration: 0,
      summary: {
        subtasksCompleted: 0,
        subtasksFailed: 0,
        agentsInvolved: [],
        averageAgentTime: 0
      }
    })
  },
  knowledgeGraph: null,
  memoryManager: null,
  gitIntegration: null
};

// Start the TUI application
render(<App context={mockContext} />);