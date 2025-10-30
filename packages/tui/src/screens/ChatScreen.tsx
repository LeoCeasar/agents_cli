import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
}

interface ChatScreenProps {
  onExit: () => void;
  context: any;
  mode: 'single' | 'multi';
  selectedAgent?: string;
  availableAgents: string[];
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onExit,
  context,
  mode,
  selectedAgent,
  availableAgents
}) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(selectedAgent);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  useEffect(() => {
    // Welcome message
    setMessages([{
      id: '1',
      type: 'system',
      content: `Welcome to Agent Graph TUI! Mode: ${mode === 'single' ? 'Single Agent' : 'Multi-Agent'}`,
      timestamp: new Date(),
    }]);
  }, [mode]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Process message with agents
      const response = await processMessage(input, currentAgent);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        agentId: response.agentId
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const processMessage = async (message: string, agentId?: string): Promise<{ content: string; agentId?: string }> => {
    // Mock implementation - would integrate with actual agent system
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (mode === 'single' && agentId) {
      return {
        content: `[${agentId}] I received your message: "${message}". This is a mock response from the single agent.`,
        agentId
      };
    } else {
      return {
        content: `[Multi-Agent] I processed your message: "${message}" using multiple agents. This is a mock collaborative response.`,
        agentId: 'collaboration'
      };
    }
  };

  const handleAgentSelect = (value: string) => {
    setCurrentAgent(value);
    setShowAgentSelector(false);
  };

  const getMessagePrefix = (message: ChatMessage): string => {
    switch (message.type) {
      case 'user':
        return '👤';
      case 'assistant':
        return message.agentId ? `🤖 [${message.agentId}]` : '🤖';
      case 'system':
        return 'ℹ️';
      default:
        return '';
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Text color="blue" bold>
          🤖 Agent Graph TUI - {mode === 'single' ? 'Single Agent' : 'Multi-Agent'} Chat
        </Text>
        {mode === 'single' && currentAgent && (
          <Text color="gray">Current Agent: {currentAgent}</Text>
        )}
      </Box>

      {/* Messages */}
      <Box flexGrow={1} flexDirection="column" padding={1} overflow="hidden">
        {messages.map((message) => (
          <Box key={message.id} marginBottom={1}>
            <Text color="gray">
              {getMessagePrefix(message)} [{formatTime(message.timestamp)}]
            </Text>
            <Text>{message.content}</Text>
          </Box>
        ))}
        {isLoading && (
          <Box>
            <Text color="cyan">
              <Spinner type="dots" /> Processing...
            </Text>
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box borderStyle="single" padding={1}>
        {showAgentSelector && mode === 'single' ? (
          <Box flexDirection="column">
            <Text color="blue">Select Agent:</Text>
            <SelectInput
              items={availableAgents.map(agent => ({
                label: agent,
                value: agent
              }))}
              onSelect={handleAgentSelect}
            />
          </Box>
        ) : (
          <Box flexDirection="column">
            <TextInput
              placeholder="Type your message... (Tab to switch agent, Ctrl+C to exit)"
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
            />
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                Shortcuts: Tab=Switch Agent | Ctrl+C=Exit | Enter=Send
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};