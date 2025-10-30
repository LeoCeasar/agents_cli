import type { CLIContext } from '../commands/BaseCommand.js';
import { textInput, confirmAction } from './prompts.js';
import chalk from 'chalk';
import { EventEmitter } from 'eventemitter3';

export interface ChatSessionOptions {
  context: CLIContext;
  mode: 'single' | 'multi';
  selectedAgent?: string;
  includeContext: boolean;
  availableAgents: string[];
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  metadata?: any;
}

export class ChatInterface {
  private context: CLIContext;
  private options: ChatSessionOptions;
  private messages: ChatMessage[] = [];
  private eventBus: EventEmitter;
  private isActive = false;

  constructor(options: ChatSessionOptions) {
    this.options = options;
    this.context = options.context;
    this.eventBus = new EventEmitter();
  }

  async start(): Promise<void> {
    this.isActive = true;
    this.showWelcomeMessage();

    // Main chat loop
    while (this.isActive) {
      try {
        const userInput = await this.getUserInput();
        if (!userInput) continue;

        // Handle special commands
        if (this.handleSpecialCommands(userInput)) {
          continue;
        }

        // Add user message
        this.addMessage({
          type: 'user',
          content: userInput
        });

        // Process message and get response
        await this.processMessage(userInput);

      } catch (error) {
        console.log(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      }
    }

    this.showGoodbyeMessage();
  }

  private showWelcomeMessage(): void {
    console.log(chalk.cyan('\n🤖 Welcome to Agent Graph Chat!'));
    console.log(chalk.gray(`Mode: ${this.options.mode === 'single' ? 'Single Agent' : 'Multi-Agent'}`));

    if (this.options.selectedAgent) {
      console.log(chalk.gray(`Selected Agent: ${this.options.selectedAgent}`));
    }

    console.log(chalk.gray('Type "/help" for available commands or "/exit" to quit.\n'));
  }

  private async getUserInput(): Promise<string | null> {
    const { text } = await import('@clack/prompts');

    try {
      const input = await text({
        message: chalk.blue('You:'),
        placeholder: 'Type your message or command...'
      });

      return input as string;
    } catch (error) {
      return null; // User cancelled
    }
  }

  private handleSpecialCommands(input: string): boolean {
    const command = input.trim().toLowerCase();

    switch (command) {
      case '/exit':
      case '/quit':
        this.isActive = false;
        return true;

      case '/help':
        this.showHelp();
        return true;

      case '/clear':
        this.clearScreen();
        return true;

      case '/history':
        this.showHistory();
        return true;

      case '/agents':
        this.showAvailableAgents();
        return true;

      case '/status':
        this.showStatus();
        return true;

      case '/context':
        this.toggleContext();
        return true;

      case '/agent':
        this.switchAgent();
        return true;

      default:
        if (command.startsWith('/')) {
          console.log(chalk.yellow(`Unknown command: ${command}. Type "/help" for available commands.`));
          return true;
        }
        return false;
    }
  }

  private showHelp(): void {
    const helpContent = `
Available Commands:
/help          - Show this help message
/exit, /quit   - Exit the chat session
/clear         - Clear the screen
/history       - Show chat history
/agents        - List available agents
/status        - Show current session status
/context       - Toggle context inclusion
/agent         - Switch active agent (single mode)
    `.trim();

    console.log(chalk.blue(helpContent));
  }

  private clearScreen(): void {
    console.clear();
    this.showWelcomeMessage();
  }

  private showHistory(): void {
    if (this.messages.length === 0) {
      console.log(chalk.gray('No messages in history.'));
      return;
    }

    console.log(chalk.blue('\n📜 Chat History:'));
    console.log('─'.repeat(50));

    for (const message of this.messages.slice(-10)) { // Show last 10 messages
      const timestamp = message.timestamp.toLocaleTimeString();
      const prefix = message.type === 'user' ? '👤' : '🤖';
      const agent = message.agentId ? ` (${message.agentId})` : '';

      console.log(`${prefix} [${timestamp}]${agent}: ${message.content}`);
    }

    console.log('');
  }

  private showAvailableAgents(): void {
    console.log(chalk.blue('\n🤖 Available Agents:'));
    console.log('─'.repeat(30));

    for (const agent of this.options.availableAgents) {
      const label = this.getAgentLabel(agent);
      const description = this.getAgentDescription(agent);
      const current = this.options.selectedAgent === agent ? ' (active)' : '';

      console.log(`${label}${current}`);
      console.log(chalk.gray(`  ${description}`));
    }

    console.log('');
  }

  private showStatus(): void {
    const status = `
Session Status:
${'─'.repeat(20)}
Mode: ${this.options.mode === 'single' ? 'Single Agent' : 'Multi-Agent'}
Active Agent: ${this.options.selectedAgent || 'Auto-selected'}
Context: ${this.options.includeContext ? 'Enabled' : 'Disabled'}
Messages: ${this.messages.length}
Available Agents: ${this.options.availableAgents.length}
    `.trim();

    console.log(chalk.blue(status));
  }

  private async toggleContext(): Promise<void> {
    const newState = !this.options.includeContext;
    this.options.includeContext = newState;

    const message = `Context inclusion ${newState ? 'enabled' : 'disabled'}.`;
    console.log(chalk.green(message));
  }

  private async switchAgent(): Promise<void> {
    if (this.options.mode !== 'single') {
      console.log(chalk.yellow('Agent switching only available in single-agent mode.'));
      return;
    }

    const { select } = await import('@clack/prompts');
    const agentOptions = this.options.availableAgents.map(agent => ({
      value: agent,
      label: this.getAgentLabel(agent),
      description: this.getAgentDescription(agent)
    }));

    try {
      const newAgent = await select({
        message: 'Select an agent:',
        options: agentOptions
      }) as string;

      this.options.selectedAgent = newAgent;
      console.log(chalk.green(`Switched to ${this.getAgentLabel(newAgent)}`));

    } catch (error) {
      // User cancelled
    }
  }

  private async processMessage(userInput: string): Promise<void> {
    const spinner = await this.createSpinner();
    spinner.start();

    try {
      let response: string;
      let agentId: string | undefined;

      if (this.options.mode === 'single' && this.options.selectedAgent) {
        // Single agent mode
        agentId = this.options.selectedAgent;
        response = await this.processWithSingleAgent(userInput, agentId);
      } else {
        // Multi-agent mode - use collaboration manager
        const result = await this.processWithMultiAgent(userInput);
        response = result.response;
        agentId = result.primaryAgent;
      }

      spinner.stop();

      // Add assistant response
      this.addMessage({
        type: 'assistant',
        content: response,
        agentId
      });

      // Display response
      const agentLabel = agentId ? `${this.getAgentLabel(agentId)}: ` : '';
      console.log(chalk.green(`\n🤖 ${agentLabel}${response}\n`));

    } catch (error) {
      spinner.fail();
      console.log(chalk.red(`Failed to process message: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  private async processWithSingleAgent(message: string, agentId: string): Promise<string> {
    const agent = this.context.agentRegistry.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const messageObj = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    const response = await agent.chat(messageObj);
    return response.content;
  }

  private async processWithMultiAgent(message: string): Promise<{
    response: string;
    primaryAgent: string;
  }> {
    // Create a task from the user message
    const task = {
      id: Date.now().toString(),
      type: 'chat',
      description: message,
      status: 'pending' as const,
      priority: 'medium' as const,
      input: { message },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Use collaboration manager to process
    const result = await this.context.collaborationManager.orchestrateCollaboration(task);

    if (!result.success) {
      throw new Error('Collaboration failed');
    }

    // Extract response from results
    const primaryResult = result.results.find(r => r.success);
    if (!primaryResult) {
      throw new Error('No successful results from collaboration');
    }

    // Generate response summary
    const response = this.generateCollaborationResponse(result);

    return {
      response,
      primaryAgent: primaryResult.agentId
    };
  }

  private generateCollaborationResponse(result: any): string {
    const successfulResults = result.results.filter((r: any) => r.success);
    const agentsInvolved = [...new Set(successfulResults.map((r: any) => r.agentId))];

    let response = `I've processed your request using ${agentsInvolved.length} agent${agentsInvolved.length > 1 ? 's' : ''}.\n\n`;

    for (const agentResult of successfulResults) {
      const agentLabel = this.getAgentLabel(agentResult.agentId);
      response += `**${agentLabel}**: ${this.summarizeAgentResult(agentResult.result)}\n\n`;
    }

    if (result.results.some((r: any) => !r.success)) {
      response += `⚠️ Some agents encountered issues, but I was able to provide a partial response.`;
    }

    return response;
  }

  private summarizeAgentResult(result: any): string {
    if (typeof result === 'string') {
      return result.length > 100 ? result.substring(0, 100) + '...' : result;
    }
    return JSON.stringify(result, null, 2);
  }

  private addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    const chatMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    this.messages.push(chatMessage);

    // Keep only last 100 messages
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
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
      code: 'Code generation and refactoring',
      debug: 'Debugging and problem solving',
      test: 'Test generation and QA',
      doc: 'Documentation creation',
      architect: 'System design and architecture',
      security: 'Security analysis and hardening'
    };
    return descriptions[agent] || 'Specialized agent';
  }

  private async createSpinner(): Promise<any> {
    const { default: ora } = await import('ora');
    return ora({
      text: 'Processing...',
      color: 'cyan'
    });
  }

  private showGoodbyeMessage(): void {
    console.log(chalk.cyan('\n👋 Thanks for using Agent Graph Chat!'));
    console.log(chalk.gray('Your conversation history has been saved.\n'));
  }
}

export async function startInteractiveChat(options: ChatSessionOptions): Promise<void> {
  const chatInterface = new ChatInterface(options);
  await chatInterface.start();
}