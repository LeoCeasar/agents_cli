import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';
import { CLIContext } from './commands/BaseCommand.js';
import { InitCommand } from './commands/InitCommand.js';
import { ChatCommand } from './commands/ChatCommand.js';
import { AgentCommand } from './commands/AgentCommand.js';
import { EventBus } from '@agent-graph/core';
import { Logger, LogLevel } from '@agent-graph/core';

// Check for updates
const pkg = require('../package.json');
updateNotifier({ pkg }).notify();

async function createCLIContext(): Promise<CLIContext> {
  // This would initialize the actual services
  // For now, create a mock context
  const eventBus = new EventBus();
  const logger = new Logger({ level: LogLevel.INFO }, 'CLI');

  return {
    config: {},
    agentRegistry: {
      list: () => [],
      get: () => null
    },
    collaborationManager: {
      orchestrateCollaboration: async () => ({ success: false, results: [], totalDuration: 0, summary: { subtasksCompleted: 0, subtasksFailed: 0, agentsInvolved: [], averageAgentTime: 0 } })
    },
    knowledgeGraph: null,
    memoryManager: null,
    gitIntegration: null
  };
}

async function main() {
  try {
    // Create CLI context
    const context = await createCLIContext();

    // Build CLI
    const cli = yargs(hideBin(process.argv))
      .scriptName('agent-graph')
      .usage('Usage: $0 <command> [options]')
      .version(pkg.version)
      .help('help')
      .alias('h', 'help')
      .alias('v', 'version')
      .wrap(Math.min(120, process.stdout.columns))
      .strict()
      .recommendCommands()
      .fail((msg, err) => {
        console.error(chalk.red(`Error: ${msg}`));
        if (err) console.error(chalk.red(err.stack));
        process.exit(1);
      });

    // Add commands
    const initCommand = new InitCommand(context);
    const chatCommand = new ChatCommand(context);
    const agentCommand = new AgentCommand(context);

    cli.command(initCommand as any);
    cli.command(chatCommand as any);
    cli.command(agentCommand as any);

    // Add additional commands
    cli.command('analyze', 'Analyze project and build knowledge graph', {}, async (argv) => {
      console.log(chalk.blue('🔍 Analyzing project and building knowledge graph...'));
      // Implementation would go here
    });

    cli.command('run', 'Execute a specific task with agents', (yargs) => {
      return yargs
        .option('task', {
          alias: 't',
          describe: 'Task description',
          type: 'string',
          demandOption: true
        })
        .option('agent', {
          alias: 'a',
          describe: 'Agent to use',
          type: 'string'
        })
        .option('type', {
          alias: 'T',
          describe: 'Task type',
          choices: ['code_generation', 'debugging', 'testing', 'documentation'],
          type: 'string'
        });
    }, async (argv) => {
      console.log(chalk.blue(`🚀 Running task: ${argv.task}`));
      if (argv.agent) {
        console.log(chalk.gray(`Using agent: ${argv.agent}`));
      }
      // Implementation would go here
    });

    // Git commands
    cli.command('git', 'Git integration commands', (yargs) => {
      return yargs
        .command('commit', 'Smart commit with AI assistance', (yargs) => {
          return yargs
            .option('message', {
              alias: 'm',
              describe: 'Commit message',
              type: 'string'
            })
            .option('auto', {
              alias: 'a',
              describe: 'Auto-generate commit message',
              type: 'boolean',
              default: true
            });
        }, async (argv) => {
          console.log(chalk.blue('📝 Smart commit...'));
          // Implementation would go here
        })
        .command('review', 'Code review assistance', {}, async () => {
          console.log(chalk.blue('🔍 Starting code review...'));
          // Implementation would go here
        });
    });

    // Knowledge commands
    cli.command('knowledge', 'Knowledge graph management', (yargs) => {
      return yargs
        .command('graph', 'Manage knowledge graphs', {}, async () => {
          console.log(chalk.blue('🕸️ Knowledge graph management...'));
          // Implementation would go here
        })
        .command('query', 'Query knowledge base', (yargs) => {
          return yargs
            .option('query', {
              alias: 'q',
              describe: 'Search query',
              type: 'string',
              demandOption: true
            });
        }, async (argv) => {
          console.log(chalk.blue(`🔍 Querying knowledge base: ${argv.query}`));
          // Implementation would go here
        });
    });

    // Memory commands
    cli.command('memory', 'Memory management', (yargs) => {
      return yargs
        .command('status', 'Show memory usage', {}, async () => {
          console.log(chalk.blue('🧠 Memory status...'));
          // Implementation would go here
        })
        .command('clear', 'Clear memory caches', {}, async () => {
          console.log(chalk.blue('🗑️ Clearing memory caches...'));
          // Implementation would go here
        });
    });

    // Parse and execute
    cli.parse();

  } catch (error) {
    console.error(chalk.red('Failed to initialize CLI:'), error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
main().catch(error => {
  console.error(chalk.red('CLI failed to start:'), error);
  process.exit(1);
});