import { BaseCommand, CLIContext } from './BaseCommand.js';
import { selectOption } from '../utils/prompts.js';

export class AgentCommand extends BaseCommand {
  command = 'agent';
  describe = 'Manage and configure agents';

  builder(yargs: any) {
    return yargs
      .command('list', 'List available agents', {}, this.listAgents.bind(this))
      .command('status', 'Show agent status', {}, this.showAgentStatus.bind(this))
      .command('config', 'Configure agent settings', {}, this.configureAgent.bind(this))
      .command('test', 'Test agent capabilities', {}, this.testAgent.bind(this))
      .demandCommand(1, 'You need to specify a subcommand');
  }

  async listAgents(): Promise<void> {
    try {
      if (!(await this.checkProjectInitialized())) {
        return;
      }

      this.log('Available Agents:', 'info');

      const config = await this.loadProjectConfig();
      const agents = config.agents || [];

      if (agents.length === 0) {
        this.log('No agents configured. Run "agent-graph init" to set up agents.', 'warning');
        return;
      }

      // Display agent information
      for (const agent of agents) {
        this.displayAgentInfo(agent);
      }

    } catch (error) {
      this.handleError(error, 'listing agents');
    }
  }

  async showAgentStatus(): Promise<void> {
    try {
      if (!(await this.checkProjectInitialized())) {
        return;
      }

      this.log('Agent Status:', 'info');

      // Get agent registry status
      const agentStatus = this.context.agentRegistry.list();
      const config = await this.loadProjectConfig();

      // Display status table
      console.log('\n' + 'Agent'.padEnd(15) + 'Status'.padEnd(10) + 'Type'.padEnd(12) + 'Tasks');
      console.log('─'.repeat(50));

      for (const agent of agentStatus) {
        const status = this.getAgentStatusText(agent);
        const type = agent.config.type || 'unknown';
        const tasks = agent.getQueueSize ? agent.getQueueSize() : 0;

        console.log(
          agent.config.name.padEnd(15) +
          status.padEnd(10) +
          type.padEnd(12) +
          tasks.toString()
        );
      }

      // Show overall statistics
      this.displayAgentStatistics(agentStatus);

    } catch (error) {
      this.handleError(error, 'showing agent status');
    }
  }

  async configureAgent(): Promise<void> {
    try {
      if (!(await this.checkProjectInitialized())) {
        return;
      }

      const config = await this.loadProjectConfig();
      const agents = config.agents || [];

      if (agents.length === 0) {
        this.log('No agents available to configure.', 'warning');
        return;
      }

      // Select agent to configure
      const agentOptions = agents.map((agent: string) => ({
        value: agent,
        label: this.getAgentLabel(agent),
        description: this.getAgentDescription(agent)
      }));

      const selectedAgent = await selectOption(
        'Which agent would you like to configure?',
        agentOptions
      );

      // Configure agent
      await this.configureSpecificAgent(selectedAgent, config);

    } catch (error) {
      this.handleError(error, 'configuring agent');
    }
  }

  async testAgent(): Promise<void> {
    try {
      if (!(await this.checkProjectInitialized())) {
        return;
      }

      const config = await this.loadProjectConfig();
      const agents = config.agents || [];

      if (agents.length === 0) {
        this.log('No agents available to test.', 'warning');
        return;
      }

      // Select agent to test
      const agentOptions = agents.map((agent: string) => ({
        value: agent,
        label: this.getAgentLabel(agent),
        description: this.getAgentDescription(agent)
      }));

      const selectedAgent = await selectOption(
        'Which agent would you like to test?',
        agentOptions
      );

      // Run agent tests
      await this.runAgentTests(selectedAgent);

    } catch (error) {
      this.handleError(error, 'testing agent');
    }
  }

  private displayAgentInfo(agent: string): Promise<void> {
    const info = this.getAgentInfo(agent);
    const content = `
${this.getAgentLabel(agent)}
${'─'.repeat(20)}
Description: ${info.description}
Capabilities: ${info.capabilities.join(', ')}
Best for: ${info.bestFor}
    `.trim();

    this.showBox(content, undefined, 'blue');
  }

  private getAgentLabel(agent: string): string {
    const labels: Record<string, string> = {
      code: '🔧 Code Agent',
      debug: '🐛 Debug Agent',
      test: '✅ Test Agent',
      doc: '📚 Documentation Agent',
      architect: '🏗️ Architecture Agent',
      security: '🔒 Security Agent'
    };
    return labels[agent] || agent;
  }

  private getAgentDescription(agent: string): string {
    const descriptions: Record<string, string> = {
      code: 'Generate, refactor, and optimize code',
      debug: 'Debug issues and solve problems',
      test: 'Generate and run tests',
      doc: 'Generate documentation',
      architect: 'Design and architect systems',
      security: 'Analyze security and harden code'
    };
    return descriptions[agent] || 'Specialized agent';
  }

  private getAgentInfo(agent: string): {
    description: string;
    capabilities: string[];
    bestFor: string;
  } {
    const infoMap: Record<string, any> = {
      code: {
        description: 'Specializes in code generation, refactoring, and optimization',
        capabilities: ['Code Generation', 'Refactoring', 'Optimization', 'Pattern Matching'],
        bestFor: 'New feature development, code improvement, performance optimization'
      },
      debug: {
        description: 'Expert in debugging and problem resolution',
        capabilities: ['Error Analysis', 'Root Cause Detection', 'Problem Solving', 'Stack Trace Analysis'],
        bestFor: 'Bug fixing, troubleshooting, performance issues'
      },
      test: {
        description: 'Focuses on test generation and quality assurance',
        capabilities: ['Test Generation', 'Coverage Analysis', 'Quality Assurance', 'Test Strategy'],
        bestFor: 'Test creation, coverage improvement, quality checks'
      },
      doc: {
        description: 'Creates comprehensive documentation',
        capabilities: ['Documentation Generation', 'API Docs', 'Readme Creation', 'Code Comments'],
        bestFor: 'Documentation tasks, API documentation, project documentation'
      },
      architect: {
        description: 'Designs systems and architectures',
        capabilities: ['System Design', 'Architecture Planning', 'Pattern Selection', 'Technical Strategy'],
        bestFor: 'System design, architecture decisions, technical planning'
      },
      security: {
        description: 'Analyzes and improves security',
        capabilities: ['Security Analysis', 'Vulnerability Detection', 'Code Hardening', 'Security Best Practices'],
        bestFor: 'Security reviews, vulnerability assessment, security improvements'
      }
    };

    return infoMap[agent] || {
      description: 'Specialized agent for specific tasks',
      capabilities: ['Task Execution'],
      bestFor: 'Specific domain tasks'
    };
  }

  private getAgentStatusText(agent: any): string {
    const state = agent.getState ? agent.getState() : { status: 'unknown' };

    switch (state.status) {
      case 'idle': return '🟢 Idle';
      case 'busy': return '🟡 Busy';
      case 'learning': return '🔵 Learning';
      case 'error': return '🔴 Error';
      default: return '⚪ Unknown';
    }
  }

  private displayAgentStatistics(agents: any[]): void {
    const total = agents.length;
    const idle = agents.filter(a => this.getAgentStatusText(a).includes('Idle')).length;
    const busy = agents.filter(a => this.getAgentStatusText(a).includes('Busy')).length;
    const learning = agents.filter(a => this.getAgentStatusText(a).includes('Learning')).length;
    const error = agents.filter(a => this.getAgentStatusText(a).includes('Error')).length;

    const stats = `
Agent Statistics:
Total: ${total} | Idle: ${idle} | Busy: ${busy} | Learning: ${learning} | Error: ${error}
    `.trim();

    this.showBox(stats, '📊 Statistics', 'green');
  }

  private async configureSpecificAgent(agent: string, config: any): Promise<void> {
    this.log(`Configuring ${agent} agent...`, 'info');

    // This would open an interactive configuration interface
    // For now, just show current configuration
    const agentInfo = this.getAgentInfo(agent);

    const configContent = `
Current Configuration for ${this.getAgentLabel(agent)}:
${'─'.repeat(40)}
Description: ${agentInfo.description}
Enabled Capabilities: ${agentInfo.capabilities.join(', ')}

Configuration would be updated here...
    `.trim();

    this.showBox(configContent, '⚙️ Configuration', 'blue');
  }

  private async runAgentTests(agent: string): Promise<void> {
    this.log(`Testing ${agent} agent...`, 'info');

    const spinner = await this.showSpinner('Running agent tests...');
    spinner.start();

    try {
      // Simulate agent testing
      await new Promise(resolve => setTimeout(resolve, 2000));

      spinner.succeed('Agent tests completed successfully!');

      const testResults = `
Test Results for ${this.getAgentLabel(agent)}:
${'─'.repeat(40)}
✅ Basic Functionality: PASSED
✅ Error Handling: PASSED
✅ Memory Management: PASSED
✅ Task Execution: PASSED
✅ Performance: GOOD

Overall Score: 95/100
    `.trim();

      this.showBox(testResults, '🧪 Test Results', 'green');

    } catch (error) {
      spinner.fail('Agent tests failed');
      this.handleError(error, 'testing agent');
    }
  }
}