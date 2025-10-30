import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

interface AgentConfigScreenProps {
  onExit: () => void;
  context: any;
}

interface AgentConfig {
  id: string;
  name: string;
  enabled: boolean;
  model: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
}

export const AgentConfigScreen: React.FC<AgentConfigScreenProps> = ({ onExit, context }) => {
  const [agents, setAgents] = useState<AgentConfig[]>([
    {
      id: 'code',
      name: 'Code Agent',
      enabled: true,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.3,
        maxTokens: 4000
      },
      permissions: {
        read: true,
        write: true,
        execute: false
      }
    },
    {
      id: 'debug',
      name: 'Debug Agent',
      enabled: true,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.1,
        maxTokens: 3000
      },
      permissions: {
        read: true,
        write: false,
        execute: false
      }
    },
    {
      id: 'test',
      name: 'Test Agent',
      enabled: false,
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.2,
        maxTokens: 3500
      },
      permissions: {
        read: true,
        write: true,
        execute: true
      }
    }
  ]);

  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [editingField, setEditingField] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      onExit();
    } else if (input === 'e') {
      // Edit agent
      if (selectedAgent) {
        setEditingField('menu');
      }
    } else if (input === 't') {
      // Toggle enabled
      if (selectedAgent) {
        toggleAgentEnabled(selectedAgent);
      }
    } else if (input === 's') {
      // Save configuration
      saveConfiguration();
    } else if (input === 'q') {
      onExit();
    }
  });

  const toggleAgentEnabled = (agentId: string) => {
    setAgents(prev => prev.map(agent =>
      agent.id === agentId ? { ...agent, enabled: !agent.enabled } : agent
    ));
  };

  const saveConfiguration = () => {
    // Mock save implementation
    console.log('Configuration saved successfully!');
  };

  const renderAgentList = () => (
    <Box flexDirection="column" gap={1}>
      <Text color="cyan" bold>🤖 Agent Configuration</Text>
      <Newline />

      {agents.map((agent) => (
        <Box
          key={agent.id}
          borderStyle={selectedAgent === agent.id ? 'double' : 'single'}
          padding={1}
        >
          <Box justifyContent="space-between">
            <Text bold={selectedAgent === agent.id}>
              {agent.name}
            </Text>
            <Text color={agent.enabled ? 'green' : 'gray'}>
              {agent.enabled ? '✅ Enabled' : '❌ Disabled'}
            </Text>
          </Box>

          <Newline />
          <Text dimColor>Model: {agent.model.provider}/{agent.model.model}</Text>
          <Text dimColor>Temperature: {agent.model.temperature}</Text>
          <Text dimColor>Permissions: {Object.entries(agent.permissions)
            .filter(([_, enabled]) => enabled)
            .map(([perm]) => perm)
            .join(', ')}</Text>
          <Newline />

          {selectedAgent === agent.id && (
            <Text color="gray">
              Commands: [E]dit [T]oggle [S]ave | Arrow keys to navigate
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );

  const renderEditMenu = () => {
    if (!selectedAgent || !editingField) return null;

    const agent = agents.find(a => a.id === selectedAgent);
    if (!agent) return null;

    return (
      <Box borderStyle="round" padding={1} marginTop={1}>
        <Text color="cyan" bold>⚙️ Edit {agent.name}</Text>
        <Newline />

        <SelectInput
          items={[
            { label: 'Model Configuration', value: 'model' },
            { label: 'Permissions', value: 'permissions' },
            { label: 'Advanced Settings', value: 'advanced' }
          ]}
          onSelect={(value) => {
            setEditingField(value);
          }}
        />
      </Box>
    );
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="single" padding={1}>
        <Text color="blue" bold>⚙️ Agent Configuration</Text>
      </Box>

      {/* Instructions */}
      <Box borderStyle="single" padding={1}>
        <Text color="gray">
          Navigate: ↑↓ | Select: Enter | Edit: E | Toggle: T | Save: S | Exit: Q
        </Text>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} flexDirection="column" padding={1}>
        {renderAgentList()}
        {renderEditMenu()}
      </Box>

      {/* Status Bar */}
      <Box borderStyle="single" padding={1}>
        <Box justifyContent="space-between">
          <Text>
            Selected: <Text color="green">{selectedAgent || 'None'}</Text>
          </Text>
          <Text>
            Enabled: <Text color="green">{agents.filter(a => a.enabled).length}/{agents.length}</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};