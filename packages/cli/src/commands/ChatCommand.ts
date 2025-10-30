import { BaseCommand, CLIContext } from './BaseCommand.js';
import { selectOption, textInput } from '../utils/prompts.js';

export class ChatCommand extends BaseCommand {
  command = 'chat';
  describe = 'Start an interactive chat session with agents';

  builder(yargs: any) {
    return yargs
      .option('agent', {
        alias: 'a',
        describe: 'Specific agent to chat with',
        type: 'string'
      })
      .option('mode', {
        alias: 'm',
        describe: 'Chat mode (single, multi)',
        choices: ['single', 'multi'],
        default: 'multi'
      })
      .option('context', {
        alias: 'c',
        describe: 'Include project context',
        type: 'boolean',
        default: true
      });
  }

  async handler(argv: any): Promise<void> {
    try {
      // Check if project is initialized
      if (!(await this.checkProjectInitialized())) {
        return;
      }

      this.log('Starting Agent Graph chat session...', 'info');

      // Load project configuration
      const config = await this.loadProjectConfig();

      // Select agent if not specified
      let selectedAgent = argv.agent;
      if (!selectedAgent && argv.mode === 'single') {
        selectedAgent = await this.selectChatAgent(config);
      }

      // Initialize chat session
      await this.startChatSession({
        mode: argv.mode,
        selectedAgent,
        includeContext: argv.context,
        config
      });

    } catch (error) {
      this.handleError(error, 'chat session');
    }
  }

  private async selectChatAgent(config: any): Promise<string> {
    const agentOptions = config.agents.map((agent: string) => ({
      value: agent,
      label: this.getAgentLabel(agent),
      description: this.getAgentDescription(agent)
    }));

    return await selectOption(
      'Which agent would you like to chat with?',
      agentOptions
    );
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

  private async startChatSession(options: {
    mode: string;
    selectedAgent?: string;
    includeContext: boolean;
    config: any;
  }): Promise<void> {
    const { startInteractiveChat } = await import('../ui/ChatInterface.js');

    await startInteractiveChat({
      context: this.context,
      mode: options.mode,
      selectedAgent: options.selectedAgent,
      includeContext: options.includeContext,
      availableAgents: options.config.agents
    });
  }
}