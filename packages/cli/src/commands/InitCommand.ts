import { BaseCommand, CLIContext } from './BaseCommand.js';
import { confirmAction, selectOption, textInput } from '../utils/prompts.js';
import { createProjectConfig } from '../utils/config.js';

export class InitCommand extends BaseCommand {
  command = 'init';
  describe = 'Initialize Agent Graph for the current project';

  builder(yargs: any) {
    return yargs
      .option('name', {
        alias: 'n',
        describe: 'Project name',
        type: 'string'
      })
      .option('agents', {
        alias: 'a',
        describe: 'Comma-separated list of agents to enable',
        type: 'string'
      })
      .option('git', {
        alias: 'g',
        describe: 'Enable Git integration',
        type: 'boolean',
        default: true
      })
      .option('knowledge', {
        alias: 'k',
        describe: 'Enable knowledge graph',
        type: 'boolean',
        default: true
      })
      .option('force', {
        alias: 'f',
        describe: 'Force overwrite existing configuration',
        type: 'boolean',
        default: false
      });
  }

  async handler(argv: any): Promise<void> {
    try {
      this.showBanner('Agent Graph');
      this.log('Initializing Agent Graph for your project...', 'info');

      // Check if already initialized
      if (!argv.force && await this.isProjectInitialized()) {
        const shouldContinue = await confirmAction(
          'Agent Graph is already initialized in this project. Do you want to reinitialize?'
        );

        if (!shouldContinue) {
          this.log('Initialization cancelled.', 'info');
          return;
        }
      }

      // Get project information
      const projectName = await this.getProjectName(argv.name);
      const selectedAgents = await this.selectAgents(argv.agents);
      const enableGit = argv.git || await this.confirmGitIntegration();
      const enableKnowledge = argv.knowledge;

      // Create configuration
      const config = await createProjectConfig({
        name: projectName,
        agents: selectedAgents,
        git: enableGit,
        knowledge: enableKnowledge
      });

      // Save configuration
      await this.saveProjectConfig(config);

      // Show success message
      this.showSuccessMessage(config);

      // Next steps
      this.showNextSteps();

    } catch (error) {
      this.handleError(error, 'initialization');
    }
  }

  private async isProjectInitialized(): Promise<boolean> {
    const { existsSync } = await import('fs');
    const { join } = await import('path');

    const configPath = join(process.cwd(), '.agent-graph', 'config.json');
    return existsSync(configPath);
  }

  private async getProjectName(providedName?: string): Promise<string> {
    if (providedName) {
      return providedName;
    }

    // Try to get from package.json
    try {
      const { readFile } = await import('fs/promises');
      const packageJsonPath = './package.json';
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
      return packageJson.name || 'my-agent-graph-project';
    } catch {
      // Fallback to user input
      return await textInput(
        'What is your project name?',
        'my-agent-graph-project',
        (value) => value.trim().length > 0 || 'Project name is required'
      );
    }
  }

  private async selectAgents(providedAgents?: string): Promise<string[]> {
    if (providedAgents) {
      return providedAgents.split(',').map(a => a.trim());
    }

    const agentOptions = [
      { value: 'code', label: '🔧 Code Generation & Refactoring', description: 'Generate, refactor, and optimize code' },
      { value: 'debug', label: '🐛 Debugging & Problem Solving', description: 'Debug issues and solve problems' },
      { value: 'test', label: '✅ Test Generation & Coverage', description: 'Generate and run tests' },
      { value: 'doc', label: '📚 Documentation Generation', description: 'Generate documentation' },
      { value: 'architect', label: '🏗️ System Design & Architecture', description: 'Design and architect systems' },
      { value: 'security', label: '🔒 Security Analysis & Hardening', description: 'Analyze security and harden code' }
    ];

    return await this.multiSelect(
      'Which agents would you like to enable?',
      agentOptions
    );
  }

  private async confirmGitIntegration(): Promise<boolean> {
    return await confirmAction(
      'Would you like to enable Git integration? This allows smart commits and code reviews.'
    );
  }

  private showSuccessMessage(config: any): void {
    const content = `
Project: ${config.name}
Agents Enabled: ${config.agents.join(', ')}
Git Integration: ${config.git ? '✅' : '❌'}
Knowledge Graph: ${config.knowledge ? '✅' : '❌'}

Configuration saved to: .agent-graph/config.json
    `.trim();

    this.showBox(content, '✅ Initialization Successful!', 'green');
  }

  private showNextSteps(): void {
    const nextSteps = `
Next steps:
  • Run 'agent-graph chat' to start an interactive session
  • Run 'agent-graph analyze' to build the knowledge graph
  • Run 'agent-graph agent list' to see available agents
  • Run 'agent-graph git commit' for smart commits
    `.trim();

    this.log(nextSteps, 'info');
  }
}