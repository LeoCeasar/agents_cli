import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Newline } from 'ink';

interface DashboardScreenProps {
  onExit: () => void;
  context: any;
}

interface SystemStats {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  memoryUsage: {
    shortTerm: number;
    longTerm: number;
  };
  knowledgeNodes: number;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onExit, context }) => {
  const [stats, setStats] = useState<SystemStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalTasks: 0,
    completedTasks: 0,
    memoryUsage: {
      shortTerm: 0,
      longTerm: 0
    },
    knowledgeNodes: 0
  });

  const [selectedTab, setSelectedTab] = useState<'overview' | 'agents' | 'tasks' | 'knowledge'>('overview');

  useEffect(() => {
    // Fetch initial stats
    fetchStats();

    // Set up interval for real-time updates
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    // Mock implementation - would fetch real stats
    setStats({
      totalAgents: 6,
      activeAgents: 4,
      totalTasks: 23,
      completedTasks: 19,
      memoryUsage: {
        shortTerm: 45,
        longTerm: 127
      },
      knowledgeNodes: 234
    });
  };

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      onExit();
    } else if (input === '1') {
      setSelectedTab('overview');
    } else if (input === '2') {
      setSelectedTab('agents');
    } else if (input === '3') {
      setSelectedTab('tasks');
    } else if (input === '4') {
      setSelectedTab('knowledge');
    } else if (input === 'q') {
      onExit();
    }
  });

  const renderOverview = () => (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="round" padding={1}>
        <Text color="cyan" bold>📊 System Overview</Text>
        <Newline />
        <Text>Total Agents: {stats.totalAgents}</Text>
        <Text>Active Agents: <Text color="green">{stats.activeAgents}</Text></Text>
        <Text>Task Completion: <Text color="green">{stats.completedTasks}/{stats.totalTasks}</Text></Text>
        <Text>Knowledge Nodes: <Text color="blue">{stats.knowledgeNodes}</Text></Text>
      </Box>

      <Box borderStyle="round" padding={1}>
        <Text color="cyan" bold>🧠 Memory Usage</Text>
        <Newline />
        <Text>Short-term: {stats.memoryUsage.shortTerm}%</Text>
        <Text>Long-term: {stats.memoryUsage.longTerm} MB</Text>
      </Box>

      <Box borderStyle="round" padding={1}>
        <Text color="cyan" bold>⚡ Activity</Text>
        <Newline />
        <Text>Recent Tasks: 5 completed, 2 in progress</Text>
        <Text>Agent Performance: 94% success rate</Text>
        <Text>System Health: <Text color="green">Optimal</Text></Text>
      </Box>
    </Box>
  );

  const renderAgents = () => {
    const agents = [
      { id: 'code', name: 'Code Agent', status: 'active', tasks: 3, success: 98 },
      { id: 'debug', name: 'Debug Agent', status: 'idle', tasks: 0, success: 95 },
      { id: 'test', name: 'Test Agent', status: 'active', tasks: 2, success: 97 },
      { id: 'doc', name: 'Documentation Agent', status: 'idle', tasks: 0, success: 99 },
      { id: 'architect', name: 'Architecture Agent', status: 'active', tasks: 1, success: 93 },
      { id: 'security', name: 'Security Agent', status: 'idle', tasks: 0, success: 96 }
    ];

    return (
      <Box flexDirection="column" gap={1}>
        <Text color="cyan" bold>🤖 Agent Status</Text>
        <Newline />
        {agents.map((agent) => (
          <Box key={agent.id} borderStyle="single" padding={1}>
            <Box justifyContent="space-between">
              <Text bold>{agent.name}</Text>
              <Text color={agent.status === 'active' ? 'green' : 'gray'}>
                {agent.status === 'active' ? '🟢 Active' : '⚪ Idle'}
              </Text>
            </Box>
            <Text>Queue: {agent.tasks} tasks</Text>
            <Text>Success Rate: {agent.success}%</Text>
          </Box>
        ))}
      </Box>
    );
  };

  const renderTasks = () => {
    const tasks = [
      { id: '1', description: 'Generate authentication module', agent: 'code', status: 'in-progress', priority: 'high' },
      { id: '2', description: 'Fix memory leak in data processor', agent: 'debug', status: 'pending', priority: 'critical' },
      { id: '3', description: 'Create unit tests for API endpoints', agent: 'test', status: 'completed', priority: 'medium' },
      { id: '4', description: 'Update API documentation', agent: 'doc', status: 'in-progress', priority: 'low' },
      { id: '5', description: 'Design microservice architecture', agent: 'architect', status: 'pending', priority: 'high' }
    ];

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'green';
        case 'in-progress': return 'yellow';
        case 'pending': return 'gray';
        default: return 'red';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'critical': return 'red';
        case 'high': return 'yellow';
        case 'medium': return 'blue';
        default: return 'gray';
      }
    };

    return (
      <Box flexDirection="column" gap={1}>
        <Text color="cyan" bold>📋 Task Queue</Text>
        <Newline />
        {tasks.map((task) => (
          <Box key={task.id} borderStyle="single" padding={1}>
            <Box justifyContent="space-between">
              <Text bold>{task.description}</Text>
              <Text color={getStatusColor(task.status)}>{task.status}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>Agent: {task.agent}</Text>
              <Text color={getPriorityColor(task.priority)}>Priority: {task.priority}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const renderKnowledge = () => {
    const graphStats = {
      nodes: 234,
      relationships: 567,
      files: 89,
      classes: 34,
      functions: 123
    };

    return (
      <Box flexDirection="column" gap={1}>
        <Box borderStyle="round" padding={1}>
          <Text color="cyan" bold>🕸️ Knowledge Graph</Text>
          <Newline />
          <Text>Total Nodes: <Text color="blue">{graphStats.nodes}</Text></Text>
          <Text>Relationships: <Text color="blue">{graphStats.relationships}</Text></Text>
          <Text>Last Updated: 2 minutes ago</Text>
        </Box>

        <Box borderStyle="round" padding={1}>
          <Text color="cyan" bold>📊 Breakdown</Text>
          <Newline />
          <Text>Files: {graphStats.files}</Text>
          <Text>Classes: {graphStats.classes}</Text>
          <Text>Functions: {graphStats.functions}</Text>
          <Text>Variables: {graphStats.nodes - graphStats.files - graphStats.classes - graphStats.functions}</Text>
        </Box>

        <Box borderStyle="round" padding={1}>
          <Text color="cyan" bold>🔍 Recent Activity</Text>
          <Newline />
          <Text>• Added 12 new nodes from src/utils.ts</Text>
          <Text>• Updated relationships in authentication module</Text>
          <Text>• Detected 3 circular dependencies</Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="single" padding={1}>
        <Text color="blue" bold>🎛️ Agent Graph Dashboard</Text>
      </Box>

      {/* Navigation */}
      <Box borderStyle="single" padding={1}>
        <Box justifyContent="space-between">
          <Text>
            Tabs: <Text color={selectedTab === 'overview' ? 'green' : 'dim'}>1:Overview</Text>{' '}
            <Text color={selectedTab === 'agents' ? 'green' : 'dim'}>2:Agents</Text>{' '}
            <Text color={selectedTab === 'tasks' ? 'green' : 'dim'}>3:Tasks</Text>{' '}
            <Text color={selectedTab === 'knowledge' ? 'green' : 'dim'}>4:Knowledge</Text>
          </Text>
          <Text color="gray">Press number to switch tab | Q to exit</Text>
        </Box>
      </Box>

      {/* Content */}
      <Box flexGrow={1} padding={1}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'agents' && renderAgents()}
        {selectedTab === 'tasks' && renderTasks()}
        {selectedTab === 'knowledge' && renderKnowledge()}
      </Box>

      {/* Footer */}
      <Box borderStyle="single" padding={1}>
        <Text color="gray">
          Last updated: {new Date().toLocaleTimeString()} | Press Ctrl+C to exit
        </Text>
      </Box>
    </Box>
  );
};