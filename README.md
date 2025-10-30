# Agents CLI

An AI programming agent platform with knowledge graphs, memory management, and multi-agent collaboration.

## 🚀 Features

- **🧠 Knowledge Graphs**: Automatic code analysis and relationship mapping
- **💾 Memory Management**: Dual-layer short-term and long-term memory
- **🤖 Multi-Agent System**: Configurable specialized agents
- **🔧 Git Integration**: Smart commits and code review
- **💻 CLI Interface**: Modern command-line interface
- **🎨 TUI Interface**: Interactive terminal user interface
- **⚡ Event-Driven**: Real-time agent collaboration

## 📦 Installation

### From GitHub Repository

```bash
# Clone the repository
git clone https://github.com/LeoCeasar/agents_cli.git
cd agents_cli

# Install dependencies
npm install

# Build the project
npm run build

# Install globally (optional)
npm install -g .
```

### From npm (when published)

```bash
npm install -g agents-cli
```

## 🛠️ Project Structure

```
agents_cli/
├── packages/
│   ├── core/           # Core agent system and types
│   ├── memory/         # Memory management
│   ├── knowledge/      # Knowledge graph management
│   ├── git/           # Git integration
│   ├── agents/        # Specialized agents
│   ├── cli/           # Command line interface
│   ├── tui/           # Terminal user interface
│   └── test/          # Testing framework
├── apps/
│   ├── cli-app/       # CLI application
│   ├── web-ui/        # Web interface
│   ├── vscode-extension/  # VS Code extension
│   └── desktop/       # Desktop application
├── platforms/
│   ├── desktop/       # Desktop platform
│   └── cloud/         # Cloud platform
└── docs/              # Documentation
```

## 🚀 Quick Start

### CLI Usage

```bash
# Initialize a new project
agents-cli init my-project

# Start interactive chat
agents-cli chat --agent code-analyzer

# Execute a task
agents-cli run --task "refactor this code"

# Show project status
agents-cli status

# List available agents
agents-cli agent list
```

### TUI Usage

```bash
# Launch terminal interface
agents-cli-tui
```

## 🏗️ Architecture

### Core Components

- **BaseAgent**: Abstract base class for all agents
- **EventBus**: Event-driven communication system
- **TaskManager**: Task lifecycle management
- **MemoryManager**: Dual-layer memory system
- **KnowledgeGraph**: Code relationship mapping

### Agent Types

- **CodeAnalyzer**: Analyzes code structure and patterns
- **Debugger**: Identifies and fixes bugs
- **TestGenerator**: Creates unit and integration tests
- **RefactorAgent**: Improves code quality
- **DocumentationAgent**: Generates documentation

### Memory System

- **Short-term Memory**: In-memory storage with TTL
- **Long-term Memory**: Persistent storage with search
- **Memory Consolidation**: Automatic promotion of important data

## 🔧 Configuration

Create an `agent-graph.config.json` in your project root:

```json
{
  "agents": {
    "codeAnalyzer": {
      "enabled": true,
      "model": "gpt-4",
      "maxTokens": 2000
    },
    "debugger": {
      "enabled": true,
      "strict": true
    }
  },
  "memory": {
    "shortTerm": {
      "maxSize": 1000,
      "ttl": 3600000
    },
    "longTerm": {
      "dbPath": "./agents-cli.db"
    }
  },
  "knowledge": {
    "neo4j": {
      "uri": "bolt://localhost:7687",
      "user": "neo4j",
      "password": "password"
    }
  },
  "git": {
    "autoCommit": true,
    "smartCommits": true
  }
}
```

## 🧪 Development

### Setup

```bash
# Clone repository
git clone https://github.com/LeoCeasar/agents_cli.git
cd agents_cli

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### Package Scripts

```bash
# Development
npm run dev          # Start development mode
npm run build        # Build all packages
npm run test         # Run tests
npm run typecheck    # Type checking
npm run lint         # Lint code
npm run format       # Format code
npm run clean        # Clean build artifacts

# Individual packages
npm run build:core   # Build core package
npm run build:cli    # Build CLI package
npm run build:tui    # Build TUI package
```

## 📚 API Documentation

### Core API

```typescript
import { AgentFactory, EventBus, TaskManager } from '@agents-cli/core';

// Create an agent
const agent = AgentFactory.create({
  type: 'code-analyzer',
  config: { model: 'gpt-4' }
});

// Execute a task
const result = await agent.execute({
  type: 'analysis',
  input: { code: 'function hello() { return "world"; }' }
});

// Listen to events
const eventBus = new EventBus();
eventBus.on('task:completed', (result) => {
  console.log('Task completed:', result);
});
```

### Memory API

```typescript
import { MemoryManager } from '@agents-cli/memory';

const memory = new MemoryManager({
  shortTerm: { maxSize: 1000 },
  longTerm: { dbPath: './memory.db' }
});

// Store data
await memory.set('context', { user: 'alice', project: 'my-app' });

// Retrieve data
const context = await memory.get('context');

// Search memory
const results = await memory.search('alice');
```

### Knowledge Graph API

```typescript
import { KnowledgeGraph } from '@agents-cli/knowledge';

const kg = new KnowledgeGraph({
  neo4j: { uri: 'bolt://localhost:7687' }
});

// Add nodes
await kg.addNode({
  id: 'fn1',
  type: 'function',
  name: 'hello',
  file: 'app.js'
});

// Add relationships
await kg.addEdge('fn1', 'fn2', 'calls');

// Query the graph
const results = await kg.query(`
  MATCH (f:Function)-[:CALLS]->(g:Function)
  RETURN f.name, g.name
`);
```

## 🎯 Current Status

The Agent Graph project is currently under active development. The following components have been implemented and tested:

### ✅ Completed Features

- **Core Agent System**: Base agent architecture with event-driven communication
- **Memory Management**: Dual-layer memory system with TTL and search capabilities
- **Knowledge Graph**: Basic structure for code relationship mapping
- **Git Integration**: Smart commit generation and code review functionality
- **Specialized Agents**: Framework for different agent types (Code, Debug, Test, etc.)
- **CLI Interface**: Basic command-line interface with help system
- **TUI Interface**: Terminal user interface demonstration
- **Testing Framework**: Unit tests and integration tests

### 🧪 Testing Results

- **Unit Tests**: 5 passing tests for core functionality
- **Integration Tests**: Agent workflow and collaboration tests
- **Build System**: All packages compile successfully
- **CLI/TUI**: Both interfaces functional and tested

### 🚧 In Development

- Advanced AI model integration
- Enhanced knowledge graph algorithms
- Production-ready deployment configurations
- Extended agent capabilities
- Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Claude Code and OpenCode
- Built with TypeScript, Node.js, and modern web technologies
- Thanks to all contributors and the open-source community

## 📞 Support

- 📧 Email: support@agents-cli.dev
- 💬 Discord: [Agents CLI Discord](https://discord.gg/agents-cli)
- 📖 Documentation: [docs.agents-cli.dev](https://docs.agents-cli.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/LeoCeasar/agents_cli/issues)

---

**Agents CLI** - Empowering developers with AI-powered programming assistants. 🚀