import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';

interface MenuScreenProps {
  onExit: () => void;
  onSelectScreen: (screen: 'chat' | 'dashboard' | 'config') => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onExit, onSelectScreen }) => {
  const { exit } = useApp();
  const [selectedOption, setSelectedOption] = useState<string>('');

  const menuOptions = [
    {
      label: '💬 Chat with Agents',
      value: 'chat',
      description: 'Start an interactive chat session'
    },
    {
      label: '📊 Dashboard',
      value: 'dashboard',
      description: 'View system overview and statistics'
    },
    {
      label: '⚙️ Agent Configuration',
      value: 'config',
      description: 'Configure agent settings and permissions'
    }
  ];

  useEffect(() => {
    if (selectedOption) {
      onSelectScreen(selectedOption as any);
    }
  }, [selectedOption]);

  return (
    <Box flexDirection="column" height="100%" justifyContent="center">
      {/* Title */}
      <Box marginBottom={3}>
        <Text color="blue" bold>
          {'/' * 20}
        </Text>
        <Text color="cyan" bold textAlign="center" display="flex">
          {'    🤖 Agent Graph TUI    '}
        </Text>
        <Text color="blue" bold>
          {'\\' * 20}
        </Text>
        <Newline />
        <Text color="gray" textAlign="center">
          Terminal User Interface for AI Agent Platform
        </Text>
      </Box>

      {/* Menu */}
      <Box flexDirection="column" alignItems="center" marginBottom={3}>
        <Text color="white" bold marginBottom={1}>
          Select an option:
        </Text>

        <SelectInput
          items={menuOptions}
          onSelect={setSelectedOption}
        />
      </Box>

      {/* Instructions */}
      <Box flexDirection="column" alignItems="center">
        <Text color="gray">
          ↑↓ Navigate | Enter Select | Ctrl+C Exit
        </Text>
        <Newline />
        <Text color="gray" dimColor>
          Agent Graph v1.0.0 | Built with React + Ink
        </Text>
      </Box>
    </Box>
  );
};