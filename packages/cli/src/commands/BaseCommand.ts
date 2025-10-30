import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';

export interface CLIContext {
  config: any;
  agentRegistry: any;
  collaborationManager: any;
  knowledgeGraph: any;
  memoryManager: any;
  gitIntegration: any;
}

export interface CommandOptions {
  [key: string]: any;
}

export abstract class BaseCommand implements CommandModule {
  abstract command: string;
  abstract describe: string;
  abstract builder(yargs: any): any;
  abstract handler(argv: any): Promise<void>;

  protected context: CLIContext;

  constructor(context: CLIContext) {
    this.context = context;
  }

  // Utility methods for CLI commands
  protected log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();

    switch (type) {
      case 'success':
        console.log(chalk.green(`✓ [${timestamp}] ${message}`));
        break;
      case 'warning':
        console.log(chalk.yellow(`⚠ [${timestamp}] ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`✗ [${timestamp}] ${message}`));
        break;
      default:
        console.log(chalk.blue(`ℹ [${timestamp}] ${message}`));
    }
  }

  protected showBanner(title: string): void {
    const banner = figlet.textSync(title, {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 120,
      whitespaceBreak: true
    });

    console.log(chalk.cyan(banner));
    console.log('');
  }

  protected showBox(content: string, title?: string, color: 'green' | 'blue' | 'yellow' | 'red' = 'blue'): void {
    const boxOptions = {
      title: title ? chalk[color](title) : undefined,
      titleAlignment: 'center',
      padding: 1,
      margin: 1,
      borderStyle: 'round' as const,
      borderColor: color
    };

    console.log(boxen(content, boxOptions));
  }

  protected async confirmAction(message: string): Promise<boolean> {
    const { confirm } = await import('@clack/prompts');
    const result = await confirm({
      message: chalk.yellow(message)
    });
    return result as boolean;
  }

  protected async selectOption(message: string, options: Array<{ value: string; label: string; description?: string }>): Promise<string> {
    const { select } = await import('@clack/prompts');
    const result = await select({
      message: chalk.blue(message),
      options: options.map(opt => ({
        value: opt.value,
        label: opt.label,
        hint: opt.description
      }))
    });
    return result as string;
  }

  protected async multiSelect(message: string, options: Array<{ value: string; label: string; description?: string }>): Promise<string[]> {
    const { multiselect } = await import('@clack/prompts');
    const result = await multiselect({
      message: chalk.blue(message),
      options: options.map(opt => ({
        value: opt.value,
        label: opt.label,
        hint: opt.description
      }))
    });
    return result as string[];
  }

  protected async textInput(message: string, placeholder?: string, validate?: (value: string) => string | undefined): Promise<string> {
    const { text } = await import('@clack/prompts');
    const result = await text({
      message: chalk.blue(message),
      placeholder,
      validate
    });
    return result as string;
  }

  protected showSpinner(message: string): Promise<{ start: () => void; stop: (message?: string) => void; succeed: (message?: string) => void; fail: (message?: string) => void }> {
    return import('ora').then(({ default: ora }) => {
      const spinner = ora({
        text: message,
        color: 'cyan'
      });

      return {
        start: () => spinner.start(),
        stop: (msg?: string) => spinner.succeed(msg),
        succeed: (msg?: string) => spinner.succeed(msg),
        fail: (msg?: string) => spinner.fail(msg)
      };
    });
  }

  protected formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  protected formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  protected truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  protected handleError(error: any, context?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    this.log(`Error${context ? ` in ${context}` : ''}: ${message}`, 'error');

    if (error instanceof Error && error.stack) {
      this.log(`Stack trace: ${error.stack}`, 'error');
    }
  }

  protected async checkProjectInitialized(): Promise<boolean> {
    const { existsSync } = await import('fs');
    const { join } = await import('path');

    const projectConfigPath = join(process.cwd(), '.agent-graph', 'config.json');

    if (!existsSync(projectConfigPath)) {
      this.log('Agent Graph not initialized in this project. Run "agent-graph init" first.', 'warning');
      return false;
    }

    return true;
  }

  protected async loadProjectConfig(): Promise<any> {
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');

    try {
      const configPath = join(process.cwd(), '.agent-graph', 'config.json');
      const configData = await readFile(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      this.log('Failed to load project configuration', 'error');
      throw error;
    }
  }

  protected async saveProjectConfig(config: any): Promise<void> {
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');

    try {
      const configDir = join(process.cwd(), '.agent-graph');
      const configPath = join(configDir, 'config.json');

      await mkdir(configDir, { recursive: true });
      await writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      this.log('Failed to save project configuration', 'error');
      throw error;
    }
  }
}