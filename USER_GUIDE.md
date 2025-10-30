# Agents CLI User Manual

## Table of Contents

1. [Installation and Setup](#installation-and-setup)
   - [System Requirements](#system-requirements)
   - [Installation Methods](#installation-methods)
   - [Initial Configuration](#initial-configuration)
   - [Verification](#verification)

2. [Getting Started](#getting-started)
   - [Quick Start Tutorial](#quick-start-tutorial)
   - [Your First Agent](#your-first-agent)
   - [Basic Workflow](#basic-workflow)
   - [Project Initialization](#project-initialization)

3. [CLI Interface](#cli-interface)
   - [Command Overview](#command-overview)
   - [Core Commands](#core-commands)
   - [Agent Management](#agent-management)
   - [Project Management](#project-management)
   - [Advanced CLI Options](#advanced-cli-options)

4. [TUI Interface](#tui-interface)
   - [Launching the TUI](#launching-the-tui)
   - [Navigation and Controls](#navigation-and-controls)
   - [Interface Layout](#interface-layout)
   - [Interactive Features](#interactive-features)

5. [Memory Management](#memory-management)
   - [Understanding Memory Layers](#understanding-memory-layers)
   - [Short-term Memory](#short-term-memory)
   - [Long-term Memory](#long-term-memory)
   - [Memory Configuration](#memory-configuration)
   - [Best Practices](#memory-best-practices)

6. [Knowledge Graphs](#knowledge-graphs)
   - [Knowledge Graph Overview](#knowledge-graph-overview)
   - [Node Types and Relationships](#node-types-and-relationships)
   - [Querying the Graph](#querying-the-graph)
   - [Visualization Options](#visualization-options)

7. [Agent System](#agent-system)
   - [Agent Types](#agent-types)
   - [Agent Configuration](#agent-configuration)
   - [Custom Agents](#custom-agents)
   - [Agent Collaboration](#agent-collaboration)

8. [Git Integration](#git-integration)
   - [Smart Commits](#smart-commits)
   - [Code Review](#code-review)
   - [Git Configuration](#git-configuration)
   - [Workflow Integration](#workflow-integration)

9. [Configuration Reference](#configuration-reference)
   - [Project Configuration](#project-configuration)
   - [Agent Configuration](#agent-configuration-detailed)
   - [Memory Configuration](#memory-configuration-detailed)
   - [Knowledge Graph Configuration](#knowledge-graph-configuration)
   - [Git Configuration](#git-configuration-detailed)

10. [API Documentation](#api-documentation)
    - [Core API](#core-api)
    - [Memory API](#memory-api)
    - [Knowledge Graph API](#knowledge-graph-api)
    - [Agent API](#agent-api)
    - [Event System API](#event-system-api)

11. [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Error Messages](#error-messages)
    - [Performance Issues](#performance-issues)
    - [Debug Mode](#debug-mode)

12. [Advanced Usage](#advanced-usage)
    - [Custom Agent Development](#custom-agent-development)
    - [Plugin System](#plugin-system)
    - [Workflow Automation](#workflow-automation)
    - [Integration Examples](#integration-examples)

13. [Tips and Best Practices](#tips-and-best-practices)
    - [Performance Optimization](#performance-optimization)
    - [Security Considerations](#security-considerations)
    - [Team Collaboration](#team-collaboration)
    - [Maintenance Tips](#maintenance-tips)

---

## Installation and Setup

### System Requirements

Before installing Agent Graph, ensure your system meets the following requirements:

**Operating Systems:**
- macOS 10.15+ (Catalina or later)
- Linux (Ubuntu 18.04+, CentOS 7+, Debian 9+)
- Windows 10+ (with WSL2 recommended)

**Runtime Requirements:**
- Node.js 18.0+ or 20.0+
- npm 9.0+ or yarn 1.22+ or pnpm 8.0+
- Git 2.25.0+

**Optional Dependencies:**
- Neo4j 4.0+ (for knowledge graph persistence)
- Docker 20.0+ (for Neo4j container if desired)
- 4GB+ RAM recommended
- 2GB+ available disk space

### Installation Methods

#### Method 1: Global Installation (Recommended)

Install Agent Graph globally using npm:

```bash
npm install -g agents-cli
```

Or using yarn:

```bash
yarn global add agents-cli
```

Or using pnpm:

```bash
pnpm add -g agents-cli
```

#### Method 2: Local Installation

For project-specific installation:

```bash
npm install --save-dev agents-cli
```

Then use with npx:

```bash
npx agents-cli
```

#### Method 3: Development Installation

Clone the repository and install from source:

```bash
git clone https://github.com/agents-cli/agents-cli.git
cd agents-cli
npm install
npm run build
npm link
```

### Initial Configuration

After installation, run the initialization wizard:

```bash
agents-cli init
```

This will:
1. Create a default configuration file (`agents-cli.config.json`)
2. Set up the project structure
3. Initialize the knowledge graph database
4. Configure default agents

**Interactive Setup Questions:**

```
? Project name: my-awesome-project
? Project type: TypeScript
? Enable knowledge graph? Yes
? Knowledge graph provider: Neo4j
? Neo4j URI: bolt://localhost:7687
? Enable Git integration? Yes
? Auto-commit enabled? Yes
? Default agent set: Basic (CodeAnalyzer, Debugger, TestGenerator)
? Memory system: Both short-term and long-term
```

### Verification

Verify your installation:

```bash
# Check version
agents-cli --version

# List available commands
agents-cli --help

# Test system
agents-cli doctor
```

Expected output for `agents-cli doctor`:

```
✅ Agent Graph CLI: v0.1.0
✅ Node.js: v20.5.0
✅ Memory system: Operational
✅ Knowledge graph: Connected
✅ Git integration: Available
✅ Configuration: Valid
```

---

## Getting Started

### Quick Start Tutorial

Follow this 5-minute tutorial to get up and running with Agent Graph:

#### Step 1: Initialize a New Project

```bash
mkdir my-first-agent-project
cd my-first-agent-project
agents-cli init --template basic
```

#### Step 2: Create a Simple Code File

Create a sample file to analyze:

```bash
echo 'function greet(name) { return `Hello, ${name}!`; }' > app.js
```

#### Step 3: Analyze the Code

```bash
agents-cli analyze --file app.js
```

**Expected Output:**
```
📊 Code Analysis Results
━━━━━━━━━━━━━━━━━━━━━━━━━
📁 File: app.js
🔍 Functions: 1 (greet)
📝 Variables: 0
🔗 Dependencies: None
⚡ Complexity: Low
💾 Memory: Stored to knowledge graph
```

#### Step 4: Chat with an Agent

```bash
agents-cli chat --agent code-analyzer
```

```
> Analyze the greet function in app.js
🤖 CodeAnalyzer: The greet function is a simple string interpolation function...
> Can you optimize it?
🤖 CodeAnalyzer: The function is already optimal for its purpose...
> Generate tests for it
🤖 CodeAnalyzer: Generating unit tests...
[Creates test.js with comprehensive tests]
```

### Your First Agent

Agent Graph provides several specialized agents. Here's how to use them:

#### Code Analyzer Agent

```bash
agents-cli run --agent code-analyzer --task "analyze src/ directory"
```

#### Debugger Agent

```bash
agents-cli run --agent debugger --task "find bugs in app.js"
```

#### Test Generator Agent

```bash
agents-cli run --agent test-generator --task "create tests for utils.js"
```

### Basic Workflow

The typical workflow with Agent Graph involves:

1. **Initialize** your project
2. **Analyze** existing code
3. **Execute tasks** with specific agents
4. **Review results** in the knowledge graph
5. **Commit changes** with smart commits

```bash
# Complete workflow example
agents-cli init my-project
cd my-project
agents-cli analyze --src ./src
agents-cli run --agent refactor --task "improve performance"
agents-cli commit --message "Refactored for performance"
```

### Project Initialization

Detailed project initialization options:

```bash
# Interactive mode (default)
agents-cli init

# Quick initialization with template
agents-cli init --template typescript

# Advanced initialization with custom config
agents-cli init --config ./my-config.json

# Initialize specific features only
agents-cli init --no-git --no-knowledge-graph
```

Available templates:
- `basic` - Minimal setup
- `typescript` - TypeScript project setup
- `javascript` - JavaScript project setup
- `full-stack` - Full-stack application setup
- `microservice` - Microservice architecture setup

---

## CLI Interface

### Command Overview

The Agent Graph CLI provides a comprehensive set of commands for managing agents, projects, and workflows. All commands follow the pattern:

```bash
agents-cli [command] [subcommand] [options]
```

**Global Options:**
```bash
--help, -h          Show help information
--version, -v       Show version number
--config, -c        Specify config file path
--verbose, -V       Enable verbose output
--quiet, -q         Suppress non-error output
--no-color          Disable colored output
```

### Core Commands

#### `agents-cli init`
Initialize a new Agent Graph project.

```bash
agents-cli init [project-name] [options]

# Examples:
agents-cli init my-app
agents-cli init --template typescript --no-git
agents-cli init --config ./custom-config.json
```

**Options:**
- `--template, -t` : Project template (basic, typescript, javascript, full-stack, microservice)
- `--config, -c` : Path to configuration file
- `--no-git` : Skip Git initialization
- `--no-knowledge-graph` : Skip knowledge graph setup
- `--force, -f` : Override existing configuration

#### `agents-cli analyze`
Analyze code and build knowledge graph.

```bash
agents-cli analyze [path] [options]

# Examples:
agents-cli analyze ./src
agents-cli analyze --file app.js --detailed
agents-cli analyze --pattern "**/*.ts" --output report.json
```

**Options:**
- `--file, -f` : Analyze specific file
- `--pattern, -p` : File pattern to match
- `--detailed, -d` : Include detailed analysis
- `--output, -o` : Output file for results
- `--update-graph, -u` : Update knowledge graph

#### `agents-cli run`
Execute tasks with specific agents.

```bash
agents-cli run --agent [agent-name] --task [task-description] [options]

# Examples:
agents-cli run --agent code-analyzer --task "find security issues"
agents-cli run --agent debugger --task "fix bug in user.js"
agents-cli run --agent test-generator --task "create unit tests"
```

**Options:**
- `--agent, -a` : Agent to use (required)
- `--task, -t` : Task description (required)
- `--input, -i` : Input file or JSON data
- `--output, -o` : Output file for results
- `--format` : Output format (json, markdown, text)

#### `agents-cli chat`
Interactive chat interface with agents.

```bash
agents-cli chat [options]

# Examples:
agents-cli chat                        # Default agent
agents-cli chat --agent code-analyzer  # Specific agent
agents-cli chat --model gpt-4          # Specific model
```

**Options:**
- `--agent, -a` : Agent to chat with
- `--model, -m` : AI model to use
- `--history, -h` : Chat history file
- `--continuous, -c` : Continue previous session

#### `agents-cli status`
Show project and system status.

```bash
agents-cli status [options]

# Examples:
agents-cli status
agents-cli status --detailed
agents-cli status --agents
```

**Options:**
- `--detailed, -d` : Show detailed information
- `--agents, -a` : Show agent status only
- `--memory, -m` : Show memory system status
- `--graph, -g` : Show knowledge graph status

#### `agents-cli commit`
Smart commit with analysis.

```bash
agents-cli commit [options]
agents-cli commit [message] [options]

# Examples:
agents-cli commit                           # Interactive commit
agents-cli commit "Fix critical bug"        # With message
agents-cli commit --auto                    # Auto-generate message
```

**Options:**
- `--auto, -a` : Auto-generate commit message
- `--analyze, -l` : Analyze changes before commit
- `--no-verify` : Skip pre-commit hooks
- `--dry-run` : Show what would be committed

### Agent Management

#### `agents-cli agent list`
List all available agents.

```bash
agents-cli agent list [options]

# Examples:
agents-cli agent list
agents-cli agent list --detailed
agents-cli agent list --type primary
```

**Options:**
- `--detailed, -d` : Show detailed agent information
- `--type, -t` : Filter by agent type (primary, subagent, meta)
- `--status, -s` : Filter by status (enabled, disabled)

#### `agents-cli agent info`
Show detailed information about an agent.

```bash
agents-cli agent info <agent-name> [options]

# Examples:
agents-cli agent info code-analyzer
agents-cli agent info debugger --config
```

#### `agents-cli agent enable/disable`
Enable or disable agents.

```bash
agents-cli agent enable <agent-name>
agents-cli agent disable <agent-name>

# Examples:
agents-cli agent enable code-analyzer
agents-cli agent disable debugger
```

### Project Management

#### `agents-cli project config`
Manage project configuration.

```bash
agents-cli project config [action] [options]

# Examples:
agents-cli project config show
agents-cli project config set memory.maxSize 2000
agents-cli project config get agents.enabled
```

#### `agents-cli project reset`
Reset project to initial state.

```bash
agents-cli project reset [options]

# Examples:
agents-cli project reset --confirm
agents-cli project reset --memory-only
```

**Options:**
- `--confirm, -y` : Skip confirmation prompt
- `--memory-only` : Reset only memory system
- `--graph-only` : Reset only knowledge graph

### Advanced CLI Options

#### Environment Variables

Configure Agent Graph behavior using environment variables:

```bash
# Configuration file location
export AGENT_GRAPH_CONFIG=/path/to/config.json

# Knowledge graph connection
export AGENT_GRAPH_NEO4J_URI=bolt://localhost:7687
export AGENT_GRAPH_NEO4J_USER=neo4j
export AGENT_GRAPH_NEO4J_PASSWORD=password

# Logging
export AGENT_GRAPH_LOG_LEVEL=debug
export AGENT_GRAPH_LOG_FILE=/var/log/agents-cli.log

# AI Model settings
export AGENT_GRAPH_DEFAULT_MODEL=gpt-4
export AGENT_GRAPH_API_KEY=your-api-key
```

#### Configuration File Override

Specify configuration file location:

```bash
agents-cli --config ./custom-config.json analyze ./src
```

#### Batch Processing

Process multiple files or directories:

```bash
agents-cli analyze --batch ./src ./lib ./tests
agents-cli run --agent test-generator --batch "test*.js"
```

#### Output Redirection

Save command output to files:

```bash
agents-cli analyze ./src --output analysis.json --format json
agents-cli status --detailed > status-report.txt
```

---

## TUI Interface

### Launching the TUI

The Terminal User Interface (TUI) provides an interactive, visual way to work with Agent Graph agents and features.

```bash
# Launch the TUI
agents-cli-tui

# Or via the CLI
agents-cli tui

# With specific configuration
agents-cli-tui --config ./config.json
```

**System Requirements for TUI:**
- Terminal with Unicode support
- Minimum 80x24 terminal size (recommended: 120x40)
- 256-color terminal support recommended

### Navigation and Controls

The TUI uses keyboard navigation for efficient interaction:

#### Global Controls
- `Ctrl+C` : Exit TUI
- `Ctrl+H` : Show help overlay
- `Ctrl+R` : Refresh current view
- `Tab` : Switch between panels
- `Shift+Tab` : Reverse panel switching
- `F1` : Contextual help
- `F5` : Refresh data
- `F10` : Open main menu

#### Arrow Navigation
- `↑/↓` : Navigate up/down
- `←/→` : Navigate left/right
- `PageUp/PageDown` : Navigate by pages
- `Home/End` : Jump to start/end

#### Selection and Actions
- `Enter` : Select/confirm
- `Space` : Toggle selection
- `Escape` : Cancel/go back
- `Delete` : Remove selected item
- `Insert` : Add new item

#### Search and Filter
- `/` : Start search
- `n` : Next search result
- `N` : Previous search result
- `Ctrl+F` : Find in current context
- `Ctrl+G` : Go to line/item

### Interface Layout

The TUI is organized into several main panels:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Agent Graph v0.1.0                                    [Help: F1] [Menu: F10] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Agents] [Projects] [Chat] [Memory] [Graph] [Git] [Settings]                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────────────────────────────────────────┐ │
│ │   Agent List    │ │                Agent Details                       │ │
│ │                 │ │                                                     │ │
│ │ □ code-analyzer │ │ Agent: CodeAnalyzer                                 │ │
│ │ □ debugger      │ │ Status: ● Running                                   │ │
│ │ □ test-gen      │ │ Model: gpt-4                                        │ │
│ │ □ refactor      │ │ Tasks: 15 completed, 2 pending                      │ │
│ │ □ doc-gen       │ │                                                     │ │
│ │ □ security      │ │ Recent Activity:                                    │ │
│ │                 │ │ • Analyzed src/utils.js (2m ago)                    │ │
│ │                 │ │ • Fixed bug in app.js (15m ago)                     │ │
│ │                 │ │ • Generated tests for API (1h ago)                  │ │
│ └─────────────────┘ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                               Chat Interface                            │ │
│ │ > Analyze the performance issues in the authentication module          │ │
│ │                                                                         │ │
│ │ 🤖 CodeAnalyzer: I'll analyze the authentication module for performance │ │
│ │ issues. Let me examine the code...                                      │ │
│ │                                                                         │ │
│ │ [分析中...] ████████████████████████████████████ 75%                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: Connected | Memory: 45% | Graph: 847 nodes | Last sync: 2m ago    │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Main Sections

1. **Header Bar**: Shows version, quick help, and menu access
2. **Navigation Tabs**: Switch between different functional areas
3. **Main Content Area**: Two-panel layout with lists and details
4. **Chat Interface**: Interactive communication with agents
5. **Status Bar**: System status and metrics

### Interactive Features

#### Agent Management Panel

The Agents panel provides comprehensive agent control:

```bash
# Navigate to Agents panel (Tab or click)
# Use arrow keys to select agents
# Press Enter to view details
# Press Space to enable/disable agents
# Press 'c' to configure selected agent
# Press 'r' to restart agent
```

**Agent Status Indicators:**
- ● Green : Running and healthy
- ● Yellow : Busy/processing
- ● Red : Error/failed
- ○ Gray : Stopped/disabled

#### Project Browser

Browse and manage your projects:

```bash
# Navigate to Projects panel
# Arrow keys to select project
# Enter to open project details
# 'n' to create new project
# 'd' to delete project
# 'o' to open in editor
```

#### Chat Interface

Interactive chat with visual feedback:

```bash
# Type your message and press Enter
# Use ↑/↓ to browse chat history
# Ctrl+C to cancel current operation
# Ctrl+L to clear chat
# Ctrl+S to save conversation
```

**Chat Features:**
- **Real-time typing indicators**
- **Progress bars for long operations**
- **Syntax highlighting for code**
- **File attachment support**
- **Conversation history**

#### Memory Explorer

Visual memory management:

```bash
# Navigate to Memory panel
- Short-term Memory: Shows current session data
- Long-term Memory: Browse persistent storage
- Search functionality with filters
- Export/import memory snapshots
```

#### Knowledge Graph Viewer

Interactive graph visualization:

```bash
# Navigate to Graph panel
- Node exploration with details
- Relationship tracing
- Query builder interface
- Export graph data
```

#### Git Integration

Git operations with visual feedback:

```bash
# Navigate to Git panel
- Commit history viewer
- Branch management
- Merge conflict resolution
- Staging area interface
```

#### Settings and Configuration

Comprehensive settings management:

```bash
# Navigate to Settings panel
- Agent configuration
- Memory settings
- Graph database settings
- Theme and appearance
- Keyboard shortcuts customization
```

### TUI Workflows

#### Workflow 1: Code Analysis and Refactoring

```bash
1. Launch TUI: agents-cli-tui
2. Navigate to Projects tab
3. Select your project (Enter)
4. Navigate to Agents tab
5. Select code-analyzer (Space to enable)
6. Open Chat interface
7. Type: "Analyze performance issues in src/"
8. Review results in Details panel
9. Enable refactor agent
10. Type: "Apply performance optimizations"
```

#### Workflow 2: Test Generation

```bash
1. Navigate to Agents tab
2. Enable test-generator agent
3. Go to Projects tab
4. Select files to test
5. Right-click (or press 't') for "Generate Tests"
6. Configure test options in dialog
7. Monitor progress in chat panel
8. Review generated tests
```

#### Workflow 3: Memory Management

```bash
1. Navigate to Memory tab
2. Browse short-term memory
3. Select important items to promote
4. Press 'p' to promote to long-term memory
5. Use search to find specific memories
6. Export memory data if needed
```

### Customization

#### Themes

Change the TUI appearance:

```bash
# In Settings panel → Appearance
Available themes:
- Default (Dark)
- Light
- High Contrast
- Custom (import theme file)
```

#### Keyboard Shortcuts

Customize keyboard shortcuts:

```bash
# In Settings panel → Keyboard Shortcuts
- View current shortcuts
- Add custom shortcuts
- Reset to defaults
- Export/import shortcut profiles
```

#### Layout Customization

Adjust panel layouts:

```bash
# In Settings panel → Layout
- Panel sizes
- Panel ordering
- Show/hide panels
- Multiple layout profiles
```

### Performance Tips

1. **Large Projects**: Use filters to reduce displayed data
2. **Memory Usage**: Regular memory cleanup in background
3. **Responsive Interface**: Enable lazy loading for large datasets
4. **Network**: Optimize graph queries for better performance

---

## Memory Management

### Understanding Memory Layers

Agent Graph implements a dual-layer memory system designed for optimal performance and persistence:

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Graph Memory System               │
├─────────────────────────────────────────────────────────────┤
│  Short-term Memory (Session-based)                         │
│  ├─ Fast in-memory storage                                 │
│  ├─ Automatic TTL (Time To Live)                           │
│  ├─ Real-time access                                       │
│  └─ Limited capacity (configurable)                        │
├─────────────────────────────────────────────────────────────┤
│  Long-term Memory (Persistent)                             │
│  ├─ Database storage (SQLite/Neo4j)                        │
│  ├─ Full-text search capabilities                          │
│  ├─ Semantic relationships                                 │
│  └─ Scalable storage                                       │
├─────────────────────────────────────────────────────────────┤
│  Memory Consolidation (Automatic)                          │
│  ├─ Importance scoring                                     │
│  ├─ Pattern recognition                                    │
│  ├─ Automatic promotion                                    │
│  └─ Scheduled cleanup                                      │
└─────────────────────────────────────────────────────────────┘
```

### Short-term Memory

Short-term memory provides fast, temporary storage for active sessions and recent interactions.

#### Features

- **In-Memory Storage**: Redis-like performance with automatic serialization
- **TTL Management**: Configurable time-to-live for automatic cleanup
- **Capacity Limits**: Size-based eviction policies (LRU, LFU)
- **Real-time Access**: Sub-millisecond read/write operations
- **Session Isolation**: Separate memory spaces per user/project

#### Configuration

```json
{
  "memory": {
    "shortTerm": {
      "maxSize": 1000,           // Maximum number of items
      "ttl": 3600000,           // Time to live in ms (1 hour)
      "evictionPolicy": "lru",  // lru, lfu, random
      "compression": true,       // Enable compression
      "persistence": false      // Persist to disk on shutdown
    }
  }
}
```

#### Usage Examples

```bash
# Store data in short-term memory
agents-cli memory set --type short-term --key "user:context" --value '{"project": "my-app", "user": "alice"}'

# Retrieve from short-term memory
agents-cli memory get --type short-term --key "user:context"

# Set with TTL
agents-cli memory set --type short-term --key "temp:analysis" --value "results" --ttl 300000

# List all short-term memory items
agents-cli memory list --type short-term

# Clear short-term memory
agents-cli memory clear --type short-term
```

#### API Usage

```javascript
import { MemoryManager } from '@agents-cli/memory';

const memory = new MemoryManager({
  shortTerm: {
    maxSize: 1000,
    ttl: 3600000
  }
});

// Store data
await memory.set('context', { user: 'alice', project: 'my-app' }, {
  type: 'short-term',
  ttl: 1800000  // 30 minutes
});

// Retrieve data
const context = await memory.get('context', { type: 'short-term' });

// Check if exists
const exists = await memory.has('context', { type: 'short-term' });

// Delete specific item
await memory.delete('context', { type: 'short-term' });
```

### Long-term Memory

Long-term memory provides persistent storage with advanced search and relationship capabilities.

#### Features

- **Persistent Storage**: SQLite or Neo4j backend
- **Full-Text Search**: Advanced search with ranking and filtering
- **Semantic Relationships**: Automatic relationship detection and storage
- **Scalable Architecture**: Handles millions of memory items efficiently
- **Backup and Recovery**: Built-in backup and restore capabilities

#### Configuration

```json
{
  "memory": {
    "longTerm": {
      "provider": "sqlite",        // sqlite, neo4j, postgresql
      "dbPath": "./agents-cli.db",
      "searchIndexing": true,
      "compression": true,
      "encryption": {
        "enabled": false,
        "algorithm": "aes-256-gcm"
      },
      "backup": {
        "enabled": true,
        "interval": 86400000,      // 24 hours
        "retention": 7             // Keep 7 backups
      }
    }
  }
}
```

#### Usage Examples

```bash
# Store in long-term memory
agents-cli memory set --type long-term --key "project:architecture" --file ./architecture.md

# Search long-term memory
agents-cli memory search --type long-term --query "authentication system" --limit 10

# Advanced search with filters
agents-cli memory search --type long-term --query "performance" --filter "type:analysis,date:>2024-01-01"

# Get memory statistics
agents-cli memory stats --type long-term

# Export memory data
agents-cli memory export --type long-term --format json --output memory-backup.json
```

#### Advanced Search Features

```bash
# Text search with ranking
agents-cli memory search --query "security vulnerabilities" --rank

# Semantic search
agents-cli memory search --query "authentication flow" --semantic

# Filter by date range
agents-cli memory search --query "bug fixes" --filter "date:2024-01-01..2024-12-31"

# Filter by type
agents-cli memory search --query "test cases" --filter "type:test,framework:jest"

# Compound search
agents-cli memory search --query "performance optimization" --filter "type:analysis,priority:high" --limit 5
```

### Memory Configuration

#### Complete Memory Configuration

```json
{
  "memory": {
    "shortTerm": {
      "maxSize": 1000,
      "ttl": 3600000,
      "evictionPolicy": "lru",
      "compression": true,
      "persistence": false,
      "monitoring": {
        "enabled": true,
        "metricsInterval": 60000
      }
    },
    "longTerm": {
      "provider": "sqlite",
      "dbPath": "./agents-cli.db",
      "searchIndexing": true,
      "compression": true,
      "encryption": {
        "enabled": false,
        "algorithm": "aes-256-gcm",
        "keyPath": "./encryption.key"
      },
      "backup": {
        "enabled": true,
        "interval": 86400000,
        "retention": 7,
        "path": "./backups"
      },
      "performance": {
        "cacheSize": 100000000,      // 100MB
        "connectionPool": 10,
        "bulkInsertSize": 1000
      }
    },
    "consolidation": {
      "enabled": true,
      "interval": 3600000,           // 1 hour
      "importanceThreshold": 0.7,
      "patterns": ["frequently_accessed", "high_priority", "semantic_clusters"]
    }
  }
}
```

#### Environment Variables

```bash
# Memory configuration
export AGENT_GRAPH_MEMORY_DB_PATH=/data/agents-cli.db
export AGENT_GRAPH_MEMORY_PROVIDER=sqlite
export AGENT_GRAPH_MEMORY_CACHE_SIZE=100000000

# Search configuration
export AGENT_GRAPH_MEMORY_SEARCH_INDEXING=true
export AGENT_GRAPH_MEMORY_FULL_TEXT_SEARCH=true

# Backup configuration
export AGENT_GRAPH_MEMORY_BACKUP_ENABLED=true
export AGENT_GRAPH_MEMORY_BACKUP_PATH=/backups
export AGENT_GRAPH_MEMORY_BACKUP_INTERVAL=86400000
```

### Memory Best Practices

#### Performance Optimization

1. **Configure Appropriate TTL**
   ```bash
   # Session data: 30 minutes
   # Analysis results: 24 hours
   # Context data: 2 hours
   # Temporary results: 15 minutes
   ```

2. **Use Memory Layers Appropriately**
   - **Short-term**: Session context, temporary results, active conversations
   - **Long-term**: Project knowledge, historical data, important conclusions

3. **Implement Memory Cleanup**
   ```bash
   # Regular cleanup script
   agents-cli memory cleanup --type short-term --older-than 24h
   agents-cli memory cleanup --type long-term --filter "priority:low"
   ```

#### Data Organization

1. **Use Structured Keys**
   ```bash
   # Good key patterns
   user:alice:context
   project:my-app:architecture
   analysis:2024-01-15:security

   # Avoid
   random123
   temp_data
   user_info
   ```

2. **Add Metadata**
   ```json
   {
     "key": "analysis:security",
     "value": "analysis results",
     "metadata": {
       "type": "analysis",
       "priority": "high",
       "tags": ["security", "authentication"],
       "created": "2024-01-15T10:30:00Z",
       "project": "my-app"
     }
   }
   ```

#### Memory Monitoring

```bash
# Monitor memory usage
agents-cli memory monitor --real-time

# Get detailed statistics
agents-cli memory stats --detailed

# Memory usage report
agents-cli memory report --format markdown --output memory-report.md
```

#### Backup and Recovery

```bash
# Create manual backup
agents-cli memory backup --create --name "before-refactor"

# List backups
agents-cli memory backup --list

# Restore from backup
agents-cli memory backup --restore "before-refactor"

# Schedule automatic backups
agents-cli memory backup --schedule --interval 24h
```

### Memory API Reference

#### Core Methods

```javascript
// Store data
await memory.set(key, value, options);

// Retrieve data
const value = await memory.get(key, options);

// Check existence
const exists = await memory.has(key, options);

// Delete data
await memory.delete(key, options);

// Search data
const results = await memory.search(query, options);

// List keys
const keys = await memory.list(options);

// Clear memory
await memory.clear(options);
```

#### Advanced Operations

```javascript
// Bulk operations
await memory.setMany([
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2' }
]);

// Atomic transactions
await memory.transaction(async (tx) => {
  await tx.set('key1', 'value1');
  await tx.set('key2', 'value2');
});

// Memory consolidation
await memory.consolidate({
  importanceThreshold: 0.8,
  patterns: ['frequently_accessed']
});

// Memory analytics
const analytics = await memory.getAnalytics({
  period: '7d',
  metrics: ['access_frequency', 'storage_usage', 'search_patterns']
});
```

---

## Git Integration

### Smart Commits

Agent Graph provides intelligent Git integration that enhances your development workflow with smart commit messages, automated code reviews, and seamless collaboration.

#### Automatic Commit Message Generation

The system analyzes your changes and generates meaningful commit messages:

```bash
# Enable smart commits
agents-cli commit --auto --analyze

# Example output
git commit -m "feat(auth): Add JWT token validation with refresh mechanism

- Implement JWT access token validation
- Add automatic token refresh functionality
- Update authentication middleware
- Include error handling for expired tokens

Reviewed by: AgentGraph SecurityAgent
Tests: ✅ Passing
Coverage: +15%"
```

#### Commit Message Templates

Configure custom commit message templates:

```json
{
  "git": {
    "smartCommits": {
      "enabled": true,
      "templates": {
        "feature": "feat({scope}): {description}\n\n{changes}\n\n{metadata}",
        "bugfix": "fix({scope}): {description}\n\n{changes}\n\nFixes: #{issue}",
        "docs": "docs({scope}): {description}\n\n{changes}",
        "refactor": "refactor({scope}): {description}\n\n{changes}\n\nPerformance: {metrics}",
        "test": "test({scope}): {description}\n\n{changes}\n\nCoverage: {coverage}"
      },
      "includeMetrics": true,
      "includeCoverage": true,
      "includeReviewer": true
    }
  }
}
```

#### Pre-commit Analysis

Automatic code analysis before commits:

```bash
# Enable pre-commit hooks
agents-cli git install-hooks

# Run manual pre-commit analysis
agents-cli git pre-commit

# Example analysis results
🔍 Pre-commit Analysis Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Files changed: 5
🐛 Issues found: 2
⚡ Performance impact: Low
🧪 Tests affected: 3
📊 Coverage change: +2.1%

⚠️  Issues to address:
  - src/auth.js:45 - Unused variable 'token'
  - tests/auth.test.js:12 - Missing error handling

Continue with commit? [y/N]
```

### Code Review

#### Automated Code Reviews

Agent Graph performs comprehensive code reviews automatically:

```bash
# Generate code review
agents-cli git review --branch feature/new-auth
agents-cli git review --commit HEAD~3..HEAD
agents-cli git review --file src/auth.js
```

#### Review Categories

**1. Code Quality Analysis**
```javascript
// Review feedback example
{
  "quality": {
    "score": 8.5,
    "issues": [
      {
        "type": "complexity",
        "severity": "medium",
        "file": "src/auth.js",
        "line": 23,
        "message": "Function complexity too high (12). Consider breaking into smaller functions.",
        "suggestion": "Extract validation logic into separate function"
      }
    ],
    "suggestions": [
      "Add JSDoc comments for public functions",
      "Consider using async/await instead of Promise chains"
    ]
  }
}
```

**2. Security Review**
```javascript
{
  "security": {
    "score": 9.2,
    "vulnerabilities": [],
    "recommendations": [
      "Input validation implemented correctly",
      "SQL injection protection verified",
      "Authentication logic follows OWASP guidelines"
    ],
    "compliance": {
      "owasp": "✅ Compliant",
      "gdpr": "✅ Compliant",
      "pci": "N/A"
    }
  }
}
```

**3. Performance Review**
```javascript
{
  "performance": {
    "score": 7.8,
    "impact": "low",
    "bottlenecks": [
      {
        "file": "src/database.js",
        "function": "queryUsers",
        "issue": "N+1 query pattern detected",
        "impact": "Medium",
        "suggestion": "Implement batch loading"
      }
    ],
    "improvements": [
      "Consider caching authentication tokens",
      "Database queries can be optimized with proper indexing"
    ]
  }
}
```

#### Review Configuration

```json
{
  "git": {
    "codeReview": {
      "enabled": true,
      "autoReview": true,
      "categories": ["quality", "security", "performance", "documentation"],
      "thresholds": {
        "quality": 7.0,
        "security": 8.5,
        "performance": 7.0
      },
      "rules": {
        "maxComplexity": 10,
        "maxFunctionLength": 50,
        "requireTests": true,
        "requireDocumentation": true
      },
      "integrations": {
        "github": true,
        "gitlab": false,
        "bitbucket": false
      }
    }
  }
}
```

### Git Configuration

#### Basic Git Integration Setup

```json
{
  "git": {
    "enabled": true,
    "repositoryPath": ".",
    "autoCommit": false,
    "smartCommits": true,
    "codeReview": {
      "enabled": true,
      "autoReview": true
    },
    "excludedPaths": [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "*.log"
    ]
  }
}
```

#### Advanced Git Configuration

```json
{
  "git": {
    "repositoryPath": ".",
    "autoCommit": {
      "enabled": true,
      "trigger": "on-analysis-complete",
      "requireReview": true,
      "maxChangesPerCommit": 50
    },
    "branches": {
      "main": "main",
      "develop": "develop",
      "feature": "feature/",
      "hotfix": "hotfix/"
    },
    "mergeStrategy": "squash",
    "requireLinearHistory": true,
    "protectedBranches": ["main", "develop"],
    "codeOwners": {
      "enabled": true,
      "file": "CODEOWNERS",
      "autoReview": true
    },
    "integrations": {
      "github": {
        "enabled": true,
        "autoCreatePR": true,
        "requireApproval": 2,
        "autoMerge": false
      }
    }
  }
}
```

#### Environment Variables

```bash
# Git configuration
export AGENT_GRAPH_GIT_AUTO_COMMIT=true
export AGENT_GRAPH_GIT_SMART_COMMITS=true
export AGENT_GRAPH_GIT_CODE_REVIEW=true

# GitHub integration
export AGENT_GRAPH_GITHUB_TOKEN=your-github-token
export AGENT_GRAPH_GITHUB_AUTO_PR=true

# Git hooks
export AGENT_GRAPH_GIT_INSTALL_HOOKS=true
export AGENT_GRAPH_GIT_PRE_COMMIT_ANALYSIS=true
```

### Workflow Integration

#### Git Workflow Commands

```bash
# Initialize Git integration
agents-cli git init

# Install Git hooks
agents-cli git install-hooks

# Analyze current changes
agents-cli git analyze

# Review changes
agents-cli git review

# Smart commit
agents-cli git commit --auto

# Create pull request with analysis
agents-cli git pr --create --auto-review

# Merge with confidence
agents-cli git merge --verify-quality
```

#### Branch Management

```bash
# Create feature branch with analysis
agents-cli git branch create feature/user-auth --analyze-base

# Switch branches with context
agents-cli git branch checkout feature/api-refactor --load-context

# Merge with quality gates
agents-cli git merge feature/user-auth into main --quality-gate

# Delete branch after merge
agents-cli git branch cleanup feature/user-auth --merged
```

#### Pull Request Integration

```bash
# Create PR with automatic description
agents-cli git pr create --title "Add user authentication" --auto-description

# Update PR with latest analysis
agents-cli git pr update --refresh-analysis

# Request review from specific agents
agents-cli git pr review --agents security-agent,performance-agent

# Auto-merge if quality gates pass
agents-cli git pr merge --auto-if-quality-passes
```

#### Release Management

```bash
# Prepare release with changelog
agents-cli git release prepare v1.2.0 --auto-changelog

# Verify release quality
agents-cli git release verify --quality-gate

# Tag release with analysis
agents-cli git tag v1.2.0 --attach-analysis

# Generate release notes
agents-cli git release notes v1.1.0..v1.2.0 --format markdown
```

### Advanced Git Features

#### Commit Analysis

```bash
# Analyze commit history
agents-cli git analyze commits --since "2024-01-01"

# Commit quality metrics
agents-cli git analyze quality --period "30d"

# Contributor analysis
agents-cli git analyze contributors --by-commits --by-changes

# Hotspot identification
agents-cli git analyze hotspots --files --authors
```

#### Branch Health

```bash
# Check branch health
agents-cli git health feature/authentication

# Identify merge conflicts early
agents-cli git conflicts check feature/auth develop

# Suggest merge strategy
agents-cli git merge-strategy suggest feature/api-refactor

# Branch dependency analysis
agents-cli git dependencies analyze feature/user-auth
```

#### Integration with CI/CD

```bash
# GitHub Actions integration
agents-cli ci github setup

# Generate CI configuration
agents-cli ci generate --platform github-actions

# Quality gate for CI
agents-cli ci quality-gate --threshold 8.0

# Update status checks
agents-cli ci status update --context "agents-cli-review"
```

#### Git Metrics and Analytics

```bash
# Repository metrics dashboard
agents-cli git metrics dashboard

# Code churn analysis
agents-cli git analyze churn --period "90d"

# Bug prediction
agents-cli git predict bugs --files src/auth/

# Technical debt assessment
agents-cli git debt analyze --format report
```

### Git Best Practices

#### Commit Best Practices

1. **Atomic Commits**
   ```bash
   # Agent Graph helps create atomic commits
   agents-cli commit --atomic --analyze
   ```

2. **Conventional Commits**
   ```json
   {
     "git": {
       "conventionalCommits": {
         "enabled": true,
         "types": ["feat", "fix", "docs", "style", "refactor", "test", "chore"],
         "scopes": ["auth", "api", "ui", "db", "config"],
         "enforce": true
       }
     }
   }
   ```

3. **Quality Gates**
   ```bash
   # Prevent low-quality commits
   agents-cli commit --quality-gate --threshold 7.0
   ```

#### Branch Strategy

1. **Feature Branch Workflow**
   ```bash
   agents-cli workflow feature-branch --base develop --require-review
   ```

2. **GitFlow Integration**
   ```bash
   agents-cli workflow gitflow --main main --develop develop
   ```

3. **Trunk-based Development**
   ```bash
   agents-cli workflow trunk-based --main main --require-pr-quality 8.0
   ```

#### Collaboration Features

1. **Code Assignment**
   ```bash
   # Assign code review to specific agents
   agents-cli assign review --agents security-agent --files src/auth/*
   ```

2. **Knowledge Sharing**
   ```bash
   # Share analysis results with team
   agents-cli git share-analysis --format markdown --output shared-review.md
   ```

3. **Automated Documentation**
   ```bash
   # Generate changelog from commits
   agents-cli git changelog --since "v1.1.0" --format markdown
   ```

## Knowledge Graphs

### Knowledge Graph Overview

Agent Graph's knowledge graph system provides a powerful way to visualize, analyze, and understand the relationships within your codebase. It automatically builds a graph representation of your code, functions, classes, and their interconnections.

```
┌─────────────────────────────────────────────────────────────┐
│                Knowledge Graph Architecture                │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├─ Neo4j Database (Primary)                              │
│  ├─ SQLite Fallback                                        │
│  └─ Memory Cache (L1)                                     │
├─────────────────────────────────────────────────────────────┤
│  Processing Layer                                          │
│  ├─ Static Analysis Engine                                 │
│  ├─ Dynamic Analysis Tracer                                │
│  ├─ Relationship Extractor                                 │
│  └─ Semantic Analyzer                                      │
├─────────────────────────────────────────────────────────────┤
│  Query Layer                                               │
│  ├─ Cypher Query Engine                                    │
│  ├─ Natural Language Query                                 │
│  ├─ Pattern Matching                                       │
│  └─ Graph Traversal Algorithms                             │
├─────────────────────────────────────────────────────────────┤
│  Visualization Layer                                       │
│  ├─ Interactive Graph Viewer                               │
│  ├─ 2D/3D Layouts                                          │
│  ├─ Filtering and Clustering                               │
│  └─ Export Capabilities                                    │
└─────────────────────────────────────────────────────────────┘
```

### Node Types and Relationships

#### Node Types

The knowledge graph represents various code elements as nodes:

```javascript
// Core node types
const nodeTypes = {
  // Code structure nodes
  'file': {
    properties: ['path', 'size', 'language', 'modified', 'hash'],
    icon: '📄'
  },
  'function': {
    properties: ['name', 'signature', 'complexity', 'lines', 'access'],
    icon: '🔧'
  },
  'class': {
    properties: ['name', 'inheritance', 'methods', 'properties', 'interfaces'],
    icon: '🏗️'
  },
  'variable': {
    properties: ['name', 'type', 'scope', 'mutability', 'initialValue'],
    icon: '📦'
  },
  'interface': {
    properties: ['name', 'methods', 'properties', 'generics'],
    icon: '🔌'
  },
  'module': {
    properties: ['name', 'exports', 'imports', 'dependencies'],
    icon: '📦'
  },

  // Conceptual nodes
  'concept': {
    properties: ['name', 'description', 'category', 'confidence'],
    icon: '💡'
  },
  'pattern': {
    properties: ['name', 'type', 'implementation', 'frequency'],
    icon: '🔍'
  },
  'issue': {
    properties: ['type', 'severity', 'location', 'description'],
    icon: '⚠️'
  },
  'test': {
    properties: ['name', 'type', 'coverage', 'status'],
    icon: '🧪'
  }
};
```

#### Relationship Types

Nodes are connected through various relationship types:

```javascript
const relationshipTypes = {
  // Code relationships
  'CALLS': {
    description: 'Function calls another function',
    properties: ['frequency', 'async', 'conditional']
  },
  'IMPLEMENTS': {
    description: 'Class implements interface',
    properties: ['completeness', 'overrides']
  },
  'EXTENDS': {
    description: 'Class inheritance',
    properties: ['depth', 'method_override_count']
  },
  'IMPORTS': {
    description: 'Module imports',
    properties: ['type', 'named', 'default']
  },
  'USES': {
    description: 'Variable usage',
    properties: ['frequency', 'scope', 'mutation']
  },
  'DEFINES': {
    description: 'Function/class definition',
    properties: ['location', 'signature']
  },

  // Conceptual relationships
  'RELATED_TO': {
    description: 'Semantic relationship',
    properties: ['similarity', 'confidence']
  },
  'SIMILAR_TO': {
    description: 'Code similarity',
    properties: ['similarity_score', 'algorithm']
  },
  'DEPENDS_ON': {
    description: 'Dependency relationship',
    properties: ['strength', 'type', 'criticality']
  },
  'CONTAINS': {
    description: 'Containment hierarchy',
    properties: ['nesting_level', 'access_level']
  }
};
```

### Querying the Graph

#### Cypher Query Examples

```bash
# Find all functions in a specific file
agents-cli graph query "
  MATCH (f:Function)-[:DEFINED_IN]->(file:File {path: 'src/utils.js'})
  RETURN f.name, f.complexity, f.lines
"

# Find circular dependencies
agents-cli graph query "
  MATCH (a:Module)-[:IMPORTS]->(b:Module)-[:IMPORTS*]->(a)
  WHERE a <> b
  RETURN DISTINCT a.name, b.name
"

# Find unused functions
agents-cli graph query "
  MATCH (f:Function)
  WHERE NOT (f)<-[:CALLS]-()
  RETURN f.name, f.file
"

# Find high-complexity functions
agents-cli graph query "
  MATCH (f:Function)
  WHERE f.complexity > 10
  RETURN f.name, f.complexity, f.file
  ORDER BY f.complexity DESC
"

# Get dependency graph for a module
agents-cli graph query "
  MATCH (m:Module {name: 'auth'})-[:IMPORTS*1..3]->(dep:Module)
  RETURN DISTINCT dep.name, dep.path
"
```

#### Natural Language Queries

```bash
# Search using natural language
agents-cli graph search "find all security-related functions"
agents-cli graph search "show me unused variables in the authentication module"
agents-cli graph search "what are the dependencies of the user service"
agents-cli graph search "find circular imports in the codebase"
agents-cli graph search "show me test coverage for API endpoints"
```

#### Advanced Query Patterns

```bash
# Pattern-based queries
agents-cli graph pattern "singleton pattern"
agents-cli graph pattern "factory pattern"
agents-cli graph pattern "observer pattern"

# Impact analysis
agents-cli graph impact --node "UserService.updateProfile"
agents-cli graph impact --file "src/auth/jwt.js"

# Relationship analysis
agents-cli graph analyze --type "CALLS" --threshold 5
agents-cli graph analyze --type "DEPENDS_ON" --depth 3
```

### Visualization Options

#### Graph Viewer Features

The built-in graph viewer provides multiple visualization modes:

```bash
# Launch interactive graph viewer
agents-cli graph view

# View specific subgraph
agents-cli graph view --center "UserService" --radius 2

# Filter by node type
agents-cli graph view --filter "type:Function"

# Custom layout
agents-cli graph view --layout force-directed
agents-cli graph view --layout hierarchical
agents-cli graph view --layout circular
```

#### Layout Options

1. **Force-Directed Layout**
   - Good for exploring relationships
   - Automatic node positioning
   - Configurable physics parameters

2. **Hierarchical Layout**
   - Shows inheritance hierarchies
   - Top-down or bottom-up
   - Clear dependency chains

3. **Circular Layout**
   - Good for module relationships
   - Compact representation
   - Symmetric arrangements

4. **Cluster Layout**
   - Groups related nodes
   - Community detection
   - High-level overview

#### Export Options

```bash
# Export to various formats
agents-cli graph export --format svg --output graph.svg
agents-cli graph export --format png --output graph.png
agents-cli graph export --format json --output graph-data.json
agents-cli graph export --format graphml --output graph.graphml
agents-cli graph export --format cytoscape --output graph.json

# Export subgraph
agents-cli graph export --node "UserService" --radius 2 --format svg
```

#### Custom Visualizations

```javascript
// Create custom visualization
import { GraphVisualizer } from '@agents-cli/knowledge';

const viz = new GraphVisualizer({
  layout: 'force-directed',
  nodeColors: {
    'function': '#4CAF50',
    'class': '#2196F3',
    'interface': '#FF9800',
    'variable': '#9C27B0'
  },
  edgeColors: {
    'CALLS': '#666',
    'IMPLEMENTS': '#2196F3',
    'EXTENDS': '#4CAF50'
  }
});

// Apply custom styling
viz.addNodeStyle('high-complexity', {
  color: '#F44336',
  size: 'large',
  border: 'thick'
});
```

### Knowledge Graph Management

#### Building the Graph

```bash
# Build from scratch
agents-cli graph build --source ./src

# Incremental update
agents-cli graph update --changed-files ./src/auth.js

# Full rebuild
agents-cli graph rebuild --force

# Build with specific analyzers
agents-cli graph build --analyzers "static,dynamic,semantic"
```

#### Graph Maintenance

```bash
# Check graph health
agents-cli graph health

# Clean orphaned nodes
agents-cli graph cleanup --orphans

# Optimize graph performance
agents-cli graph optimize

# Validate relationships
agents-cli graph validate --strict
```

#### Graph Statistics

```bash
# Get graph overview
agents-cli graph stats

# Detailed metrics
agents-cli graph metrics --detailed

# Node type distribution
agents-cli graph distribution --by-type

# Relationship analysis
agents-cli graph analysis --relationships
```

### Integration with Agents

#### Code Analysis Integration

```bash
# Agent can query the graph
agents-cli run --agent code-analyzer --task "analyze complexity using knowledge graph"

# Results are stored back to graph
agents-cli run --agent refactor --task "update graph with new architecture"
```

#### Memory Integration

```bash
# Store graph queries in memory
agents-cli memory set --key "complexity_analysis" --value "$(agents-cli graph query 'MATCH...')"

# Retrieve cached results
agents-cli memory get --key "complexity_analysis"
```

### Performance Optimization

#### Indexing Strategy

```json
{
  "knowledge": {
    "indexes": {
      "automatic": true,
      "custom": [
        "CREATE INDEX ON :Function(name)",
        "CREATE INDEX ON :File(path)",
        "CREATE INDEX ON :Module(name)",
        "CREATE COMPOSITE INDEX ON :Function(name, file)"
      ]
    },
    "performance": {
      "queryCache": true,
      "resultCache": true,
      "connectionPool": 10
    }
  }
}
```

#### Query Optimization

```bash
# Use query hints
agents-cli graph query "
  MATCH (f:Function)
  USING INDEX f:Function(name)
  WHERE f.name STARTS WITH 'get'
  RETURN f
"

# Profile queries
agents-cli graph profile "
  MATCH (f:Function)-[:CALLS]->(g:Function)
  RETURN f.name, g.name
"
```

---

## Agent System

### Agent Types

Agent Graph provides a sophisticated multi-agent system with specialized agents for different tasks. Each agent is designed to handle specific aspects of software development and analysis.

#### Primary Agents

**1. CodeAnalyzer Agent**
- **Purpose**: Analyze code structure, patterns, and quality
- **Capabilities**:
  - Static code analysis
  - Complexity metrics
  - Code smell detection
  - Performance analysis
  - Security vulnerability scanning

```bash
# Use CodeAnalyzer
agents-cli run --agent code-analyzer --task "analyze complexity in src/"
agents-cli run --agent code-analyzer --task "find security issues in auth module"
agents-cli run --agent code-analyzer --task "review code quality"
```

**2. Debugger Agent**
- **Purpose**: Identify, analyze, and fix bugs
- **Capabilities**:
  - Error pattern recognition
  - Stack trace analysis
  - Root cause identification
  - Automated fixes
  - Test reproduction

```bash
# Use Debugger
agents-cli run --agent debugger --task "fix bug in user authentication"
agents-cli run --agent debugger --task "analyze error logs"
agents-cli run --agent debugger --task "debug failing tests"
```

**3. TestGenerator Agent**
- **Purpose**: Generate comprehensive tests
- **Capabilities**:
  - Unit test generation
  - Integration test creation
  - Edge case coverage
  - Test data generation
  - Coverage analysis

```bash
# Use TestGenerator
agents-cli run --agent test-generator --task "create tests for utils.js"
agents-cli run --agent test-generator --task "generate integration tests for API"
agents-cli run --agent test-generator --task "improve test coverage"
```

**4. RefactorAgent**
- **Purpose**: Improve code structure and performance
- **Capabilities**:
  - Code refactoring
  - Performance optimization
  - Design pattern implementation
  - Code cleanup
  - Modernization

```bash
# Use RefactorAgent
agents-cli run --agent refactor --task "optimize database queries"
agents-cli run --agent refactor --task "implement factory pattern"
agents-cli run --agent refactor --task "modernize legacy code"
```

**5. DocumentationAgent**
- **Purpose**: Generate and maintain documentation
- **Capabilities**:
  - API documentation
  - Code comments
  - README generation
  - Architecture docs
  - User guides

```bash
# Use DocumentationAgent
agents-cli run --agent doc-generator --task "generate API docs"
agents-cli run --agent doc-generator --task "create README for project"
agents-cli run --agent doc-generator --task "document authentication flow"
```

#### Specialized Agents

**6. SecurityAgent**
- **Purpose**: Security analysis and vulnerability assessment
- **Capabilities**:
  - Security scanning
  - Vulnerability detection
  - Security best practices
  - Compliance checking

**7. PerformanceAgent**
- **Purpose**: Performance optimization and profiling
- **Capabilities**:
  - Performance profiling
  - Bottleneck identification
  - Optimization suggestions
  - Benchmarking

**8. ArchitectureAgent**
- **Purpose**: System architecture analysis and design
- **Capabilities**:
  - Architecture review
  - Design pattern analysis
  - System optimization
  - Scalability assessment

### Agent Configuration

#### Basic Configuration

Each agent can be configured independently in your `agents-cli.config.json`:

```json
{
  "agents": {
    "codeAnalyzer": {
      "enabled": true,
      "model": "gpt-4",
      "maxTokens": 2000,
      "temperature": 0.1,
      "permissions": {
        "read": true,
        "write": false,
        "execute": false
      },
      "tools": ["static-analyzer", "complexity-calculator"],
      "specialization": "javascript",
      "timeout": 30000
    },
    "debugger": {
      "enabled": true,
      "model": "gpt-4",
      "maxTokens": 3000,
      "temperature": 0.2,
      "permissions": {
        "read": true,
        "write": true,
        "execute": false
      },
      "tools": ["error-analyzer", "stack-trace-parser"],
      "autoFix": true,
      "maxRetries": 3
    },
    "testGenerator": {
      "enabled": true,
      "model": "gpt-3.5-turbo",
      "maxTokens": 2500,
      "temperature": 0.3,
      "permissions": {
        "read": true,
        "write": true,
        "execute": false
      },
      "tools": ["test-framework", "coverage-analyzer"],
      "framework": "jest",
      "coverageThreshold": 80
    }
  }
}
```

#### Advanced Configuration

```json
{
  "agents": {
    "codeAnalyzer": {
      "enabled": true,
      "model": {
        "provider": "openai",
        "model": "gpt-4",
        "parameters": {
          "temperature": 0.1,
          "max_tokens": 2000,
          "top_p": 0.9,
          "frequency_penalty": 0.1
        }
      },
      "capabilities": {
        "staticAnalysis": true,
        "dynamicAnalysis": false,
        "securityScan": true,
        "performanceAnalysis": true,
        "complexityMetrics": true
      },
      "rules": {
        "maxComplexity": 10,
        "maxFunctionLength": 50,
        "maxFileLength": 500,
        "enforceNaming": true
      },
      "integrations": {
        "eslint": true,
        "sonarqube": false,
        "github": true
      }
    }
  }
}
```

### Custom Agents

#### Creating a Custom Agent

You can create custom agents by extending the BaseAgent class:

```javascript
import { BaseAgent } from '@agents-cli/core';

class CustomSecurityAgent extends BaseAgent {
  constructor(config) {
    super({
      name: 'security-agent',
      description: 'Specialized security analysis agent',
      type: 'primary',
      ...config
    });
  }

  async execute(task) {
    switch (task.type) {
      case 'security-scan':
        return await this.performSecurityScan(task.input);
      case 'vulnerability-check':
        return await this.checkVulnerabilities(task.input);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  async performSecurityScan(input) {
    // Custom security scanning logic
    const results = await this.analyzeSecurity(input);
    return {
      vulnerabilities: results.vulnerabilities,
      recommendations: results.recommendations,
      score: results.securityScore
    };
  }
}

// Register the custom agent
import { AgentRegistry } from '@agents-cli/core';
AgentRegistry.register('security-agent', CustomSecurityAgent);
```

#### Agent Plugin System

Create agent plugins for extended functionality:

```javascript
// plugin-security-analyzer.js
export default class SecurityAnalyzerPlugin {
  constructor(agent) {
    this.agent = agent;
  }

  async analyze(input) {
    // Plugin-specific analysis
    return {
      type: 'security-analysis',
      results: await this.performSecurityAnalysis(input)
    };
  }

  async performSecurityAnalysis(input) {
    // Implementation details
  }
}

// Use plugin in agent
const agent = new CodeAnalyzer({
  plugins: ['security-analyzer', 'performance-profiler']
});
```

#### Agent Templates

Use predefined templates for common agent types:

```bash
# Create agent from template
agents-cli agent create --template security --name my-security-agent
agents-cli agent create --template performance --name perf-analyzer
agents-cli agent create --template custom --template-file ./my-template.json
```

Available templates:
- `security` - Security-focused agent
- `performance` - Performance analysis agent
- `documentation` - Documentation generation agent
- `testing` - Test-focused agent
- `custom` - Custom agent template

### Agent Collaboration

#### Event-Driven Communication

Agents communicate through an event-driven system:

```javascript
import { EventBus } from '@agents-cli/core';

// Agent A publishes an event
EventBus.emit('analysis:completed', {
  agent: 'code-analyzer',
  results: analysisResults,
  timestamp: new Date()
});

// Agent B listens for events
EventBus.on('analysis:completed', async (event) => {
  if (event.agent === 'code-analyzer') {
    await this.processAnalysisResults(event.results);
  }
});
```

#### Agent Workflows

Create complex workflows with multiple agents:

```bash
# Define a workflow
agents-cli workflow create --name "code-review" \
  --agents "code-analyzer,debugger,test-generator" \
  --steps "analyze,debug,test"

# Execute workflow
agents-cli workflow run --name "code-review" --input "./src/"

# Workflow with conditional steps
agents-cli workflow create --name "smart-refactor" \
  --steps "analyze:code-analyzer,if:complexity>10:refactor:refactor-agent,test:test-generator"
```

#### Agent Orchestration

```json
{
  "workflows": {
    "comprehensive-analysis": {
      "agents": ["code-analyzer", "debugger", "security-agent"],
      "steps": [
        {
          "name": "static-analysis",
          "agent": "code-analyzer",
          "input": "${projectPath}",
          "condition": null
        },
        {
          "name": "security-check",
          "agent": "security-agent",
          "input": "${static-analysis.results}",
          "condition": "security.enabled === true"
        },
        {
          "name": "debug-analysis",
          "agent": "debugger",
          "input": "${static-analysis.results}",
          "condition": "static-analysis.issues.length > 0"
        }
      ]
    }
  }
}
```

#### Agent Collaboration Patterns

**1. Sequential Pattern**
```bash
agents-cli run --agent code-analyzer --task "analyze code" \
  && agents-cli run --agent debugger --task "fix issues" \
  && agents-cli run --agent test-generator --task "create tests"
```

**2. Parallel Pattern**
```bash
agents-cli run --parallel \
  --agent1 code-analyzer --task1 "analyze frontend" \
  --agent2 debugger --task2 "debug backend" \
  --agent3 test-generator --task3 "test API"
```

**3. Pipeline Pattern**
```bash
agents-cli pipeline create --name "quality-gate" \
  --steps "analyze:code-analyzer,test:test-generator,deploy:deploy-agent"
```

### Agent Management

#### Lifecycle Management

```bash
# Start agents
agents-cli agent start code-analyzer
agents-cli agent start --all

# Stop agents
agents-cli agent stop debugger
agents-cli agent stop --all

# Restart agents
agents-cli agent restart test-generator

# Agent status
agents-cli agent status
agents-cli agent status --detailed
```

#### Performance Monitoring

```bash
# Monitor agent performance
agents-cli agent monitor --agent code-analyzer
agents-cli agent monitor --all

# Performance metrics
agents-cli agent metrics --agent debugger --period 1h

# Resource usage
agents-cli agent resources --agent test-generator
```

#### Agent Updates

```bash
# Update agent configuration
agents-cli agent update --name code-analyzer --config ./new-config.json

# Update agent model
agents-cli agent update --name debugger --model gpt-4-turbo

# Reload agent
agents-cli agent reload --name test-generator
```

### Best Practices

#### Agent Configuration Best Practices

1. **Specific Model Selection**
   ```json
   {
     "codeAnalyzer": {
       "model": "gpt-4",  // Better for analysis
       "temperature": 0.1  // Lower for consistency
     },
     "testGenerator": {
       "model": "gpt-3.5-turbo",  // Good for generation
       "temperature": 0.3  // Higher for creativity
     }
   }
   ```

2. **Permission Management**
   ```json
   {
     "permissions": {
       "read": true,
       "write": true,  // Only for agents that modify code
       "execute": false,  // Never enable unless necessary
       "network": false  // Disable for security
     }
   }
   ```

3. **Resource Limits**
   ```json
   {
     "maxTokens": 2000,
     "timeout": 30000,
     "maxRetries": 3,
     "rateLimit": 10  // Requests per minute
   }
   ```

#### Agent Collaboration Best Practices

1. **Event Naming Conventions**
   ```javascript
   // Good
   'agent:code-analyzer:analysis:completed'
   'agent:debugger:error:found'

   // Avoid
   'done'
   'error'
   'complete'
   ```

2. **Error Handling**
   ```javascript
   try {
     const result = await agent.execute(task);
     EventBus.emit('task:completed', { result });
   } catch (error) {
     EventBus.emit('task:failed', { error, task });
     // Implement retry logic or fallback
   }
   ```

3. **Resource Management**
   ```javascript
   // Clean up resources
   agent.on('shutdown', async () => {
     await this.cleanup();
     await this.disconnect();
   });
   ```

---

## Configuration Reference

### Project Configuration

The primary configuration file `agents-cli.config.json` controls all aspects of Agent Graph behavior. Here's a comprehensive reference:

#### Complete Configuration Schema

```json
{
  "$schema": "https://agents-cli.dev/schema/v1",
  "version": "0.1.0",
  "project": {
    "id": "my-project",
    "name": "My Application",
    "path": "/path/to/project",
    "type": "typescript",
    "description": "A TypeScript web application"
  },
  "agents": {
    "enabled": ["code-analyzer", "debugger", "test-generator"],
    "default": "code-analyzer",
    "codeAnalyzer": {
      "enabled": true,
      "model": {
        "provider": "openai",
        "model": "gpt-4",
        "parameters": {
          "temperature": 0.1,
          "max_tokens": 2000,
          "top_p": 0.9,
          "frequency_penalty": 0.1
        }
      },
      "permissions": {
        "read": true,
        "write": false,
        "execute": false,
        "network": false
      },
      "tools": ["static-analyzer", "complexity-calculator", "security-scanner"],
      "specialization": "typescript",
      "timeout": 30000,
      "maxRetries": 3,
      "rateLimit": 10
    }
  },
  "memory": {
    "shortTerm": {
      "maxSize": 1000,
      "ttl": 3600000,
      "evictionPolicy": "lru",
      "compression": true,
      "persistence": false,
      "monitoring": {
        "enabled": true,
        "metricsInterval": 60000
      }
    },
    "longTerm": {
      "provider": "sqlite",
      "dbPath": "./agents-cli.db",
      "searchIndexing": true,
      "compression": true,
      "encryption": {
        "enabled": false,
        "algorithm": "aes-256-gcm",
        "keyPath": "./encryption.key"
      },
      "backup": {
        "enabled": true,
        "interval": 86400000,
        "retention": 7,
        "path": "./backups"
      }
    },
    "consolidation": {
      "enabled": true,
      "interval": 3600000,
      "importanceThreshold": 0.7,
      "patterns": ["frequently_accessed", "high_priority"]
    }
  },
  "knowledge": {
    "enabled": true,
    "autoUpdate": true,
    "provider": "neo4j",
    "neo4j": {
      "uri": "bolt://localhost:7687",
      "user": "neo4j",
      "password": "password",
      "database": "agentgraph",
      "connectionPool": {
        "min": 1,
        "max": 10,
        "acquireTimeoutMillis": 30000
      }
    },
    "indexes": {
      "automatic": true,
      "custom": [
        "CREATE INDEX ON :Function(name)",
        "CREATE INDEX ON :File(path)",
        "CREATE COMPOSITE INDEX ON :Function(name, file)"
      ]
    },
    "performance": {
      "queryCache": true,
      "resultCache": true,
      "batchSize": 1000
    }
  },
  "git": {
    "enabled": true,
    "repositoryPath": ".",
    "autoCommit": false,
    "smartCommits": {
      "enabled": true,
      "templates": {
        "feature": "feat({scope}): {description}\n\n{changes}\n\n{metadata}",
        "bugfix": "fix({scope}): {description}\n\n{changes}\n\nFixes: #{issue}"
      },
      "includeMetrics": true,
      "includeCoverage": true,
      "includeReviewer": true
    },
    "codeReview": {
      "enabled": true,
      "autoReview": true,
      "categories": ["quality", "security", "performance"],
      "thresholds": {
        "quality": 7.0,
        "security": 8.5,
        "performance": 7.0
      }
    },
    "excludedPaths": [
      "node_modules/**",
      "dist/**",
      "coverage/**"
    ]
  },
  "logging": {
    "level": "info",
    "format": "json",
    "file": "./logs/agents-cli.log",
    "console": true,
    "rotation": {
      "enabled": true,
      "maxSize": "100MB",
      "maxFiles": 10
    }
  },
  "ui": {
    "cli": {
      "colors": true,
      "progressBars": true,
      "asciiArt": true
    },
    "tui": {
      "theme": "default",
      "layout": "default",
      "keyboardShortcuts": "default"
    }
  }
}
```

### Configuration Management Commands

```bash
# Show current configuration
agents-cli config show
agents-cli config show --section agents
agents-cli config show --format json

# Set configuration values
agents-cli config set agents.codeAnalyzer.temperature 0.2
agents-cli config set git.autoCommit.enabled true
agents-cli config set memory.shortTerm.maxSize 2000

# Get configuration values
agents-cli config get agents.codeAnalyzer.model
agents-cli config get git.smartCommits.enabled
agents-cli config get memory.longTerm.provider

# Import/Export configuration
agents-cli config export --output my-config.json
agents-cli config import --file my-config.json

# Validate configuration
agents-cli config validate
agents-cli config validate --section memory
```

---

## API Documentation

### Core API

The Agent Graph core API provides the fundamental building blocks for creating and managing agents, tasks, and events.

#### Basic Setup

```javascript
import { AgentFactory, EventBus, TaskManager, MemoryManager } from '@agents-cli/core';

// Initialize the core system
const eventBus = new EventBus();
const taskManager = new TaskManager(eventBus);
const memoryManager = new MemoryManager();
```

#### Agent Creation and Management

```javascript
import { AgentFactory, AgentRegistry } from '@agents-cli/core';

// Create an agent
const agent = AgentFactory.create({
  type: 'code-analyzer',
  config: {
    model: 'gpt-4',
    temperature: 0.1,
    permissions: {
      read: true,
      write: false,
      execute: false
    }
  }
});

// Register custom agent
AgentRegistry.register('custom-analyzer', CustomAnalyzer);

// Get agent instance
const agentInstance = AgentRegistry.get('code-analyzer');

// List all available agents
const agents = AgentRegistry.list();
```

#### Task Execution

```javascript
// Create a task
const task = {
  id: 'task-001',
  type: 'analysis',
  description: 'Analyze code quality',
  input: {
    files: ['./src'],
    options: { complexity: true, security: true }
  },
  priority: 'high'
};

// Execute a task
const result = await agent.execute(task);

// Execute with timeout
const result = await agent.execute(task, { timeout: 30000 });

// Batch execution
const tasks = [task1, task2, task3];
const results = await agent.executeBatch(tasks);
```

#### Event System

```javascript
import { EventBus } from '@agents-cli/core';

// Listen to events
eventBus.on('task:completed', (event) => {
  console.log('Task completed:', event.data);
});

eventBus.on('agent:error', (event) => {
  console.error('Agent error:', event.data);
});

// Emit events
eventBus.emit('task:started', { taskId: 'task-001' });

// Wildcard event listening
eventBus.on('*', (event) => {
  console.log('All events:', event);
});

// Event filtering
eventBus.on('task:*', (event) => {
  if (event.type === 'task:completed') {
    // Handle task completion
  }
});
```

### Memory API

#### Basic Memory Operations

```javascript
import { MemoryManager } from '@agents-cli/memory';

const memory = new MemoryManager({
  shortTerm: { maxSize: 1000, ttl: 3600000 },
  longTerm: { provider: 'sqlite', dbPath: './memory.db' }
});

// Store data
await memory.set('user:context', {
  user: 'alice',
  project: 'my-app',
  timestamp: new Date()
});

// Retrieve data
const context = await memory.get('user:context');

// Check existence
const exists = await memory.has('user:context');

// Delete data
await memory.delete('user:context');

// Clear all data
await memory.clear();
```

#### Advanced Memory Operations

```javascript
// Bulk operations
await memory.setMany([
  { key: 'context:1', value: data1 },
  { key: 'context:2', value: data2 },
  { key: 'context:3', value: data3 }
]);

// Bulk retrieval
const values = await memory.getMany(['context:1', 'context:2', 'context:3']);

// Search operations
const results = await memory.search('user', {
  type: 'long-term',
  limit: 10,
  filter: { priority: 'high' }
});

// Memory analytics
const analytics = await memory.getAnalytics({
  period: '7d',
  metrics: ['access_frequency', 'storage_usage']
});

// Memory consolidation
await memory.consolidate({
  importanceThreshold: 0.8,
  patterns: ['frequently_accessed']
});
```

#### Memory Types and Options

```javascript
// Short-term memory with TTL
await memory.set('temp:analysis', results, {
  type: 'short-term',
  ttl: 1800000 // 30 minutes
});

// Long-term memory with metadata
await memory.set('project:architecture', architecture, {
  type: 'long-term',
  metadata: {
    tags: ['architecture', 'design'],
    priority: 'high',
    project: 'my-app'
  }
});

// Transactional operations
await memory.transaction(async (tx) => {
  await tx.set('key1', 'value1');
  await tx.set('key2', 'value2');
  await tx.set('key3', 'value3');
});
```

### Knowledge Graph API

#### Graph Operations

```javascript
import { KnowledgeGraph } from '@agents-cli/knowledge';

const kg = new KnowledgeGraph({
  provider: 'neo4j',
  uri: 'bolt://localhost:7687',
  user: 'neo4j',
  password: 'password'
});

// Add nodes
await kg.addNode({
  id: 'fn:auth:login',
  type: 'function',
  name: 'login',
  properties: {
    file: 'src/auth.js',
    lines: [10, 25],
    complexity: 5
  }
});

// Add relationships
await kg.addEdge('fn:auth:login', 'fn:auth:validate', 'CALLS', {
  frequency: 10,
  async: false
});

// Query the graph
const results = await kg.query(`
  MATCH (f:Function)-[:CALLS]->(g:Function)
  WHERE f.name STARTS WITH 'get'
  RETURN f.name, g.name, f.complexity
`);

// Natural language query
const nlResults = await kg.search('functions that call database operations');
```

#### Advanced Graph Features

```javascript
// Graph traversal
const path = await kg.findPath('fn:auth:login', 'db:users');

// Neighborhood queries
const neighbors = await kg.getNeighbors('fn:auth:login', {
  direction: 'both',
  depth: 2,
  types: ['CALLS', 'USES']
});

// Pattern matching
const patterns = await kg.findPattern({
  node: { type: 'Function' },
  relationship: { type: 'CALLS' },
  target: { type: 'Function', complexity: { $gt: 10 } }
});

// Graph analytics
const metrics = await kg.getMetrics({
  nodes: { type: 'Function' },
  relationships: { type: 'CALLS' },
  includeCentralities: true
});
```

### Agent API

#### Agent Lifecycle

```javascript
import { BaseAgent } from '@agents-cli/core';

class CustomAgent extends BaseAgent {
  constructor(config) {
    super({
      name: 'custom-agent',
      type: 'primary',
      ...config
    });
  }

  // Initialize agent
  async initialize() {
    await super.initialize();
    // Custom initialization logic
    this.tools = await this.loadTools();
  }

  // Execute task
  async execute(task) {
    this.emit('task:started', { taskId: task.id });

    try {
      const result = await this.processTask(task);
      this.emit('task:completed', { taskId: task.id, result });
      return result;
    } catch (error) {
      this.emit('task:failed', { taskId: task.id, error });
      throw error;
    }
  }

  // Shutdown agent
  async shutdown() {
    await this.cleanup();
    await super.shutdown();
  }
}
```

#### Agent Communication

```javascript
// Agent-to-agent communication
class AnalyzerAgent extends BaseAgent {
  async execute(task) {
    const results = await this.analyze(task.input);

    // Send results to debugger agent
    this.emit('analysis:completed', {
      agent: 'analyzer',
      results: results,
      target: 'debugger'
    });

    return results;
  }
}

class DebuggerAgent extends BaseAgent {
  async initialize() {
    super.initialize();

    // Listen for analysis results
    this.on('analysis:completed', async (event) => {
      if (event.target === 'debugger') {
        await this.debugIssues(event.results);
      }
    });
  }
}
```

#### Agent Tools and Plugins

```javascript
// Tool system
class AnalysisTool {
  constructor(config) {
    this.name = 'static-analyzer';
    this.config = config;
  }

  async execute(input) {
    // Tool implementation
    return {
      issues: [],
      metrics: {},
      suggestions: []
    };
  }
}

// Register tools
const agent = new CodeAnalyzer({
  tools: [
    new AnalysisTool({ complexity: true }),
    new SecurityTool({ level: 'high' })
  ]
});

// Plugin system
class AgentPlugin {
  constructor(agent) {
    this.agent = agent;
  }

  async beforeTask(task) {
    // Pre-task processing
  }

  async afterTask(task, result) {
    // Post-task processing
  }
}

// Use plugins
const plugin = new LoggingPlugin(agent);
agent.addPlugin(plugin);
```

### Event System API

#### Advanced Event Handling

```javascript
import { EventBus } from '@agents-cli/core';

const eventBus = new EventBus({
  maxListeners: 100,
  captureRejections: true
});

// Event middleware
eventBus.use((event, next) => {
  console.log('Processing event:', event.type);
  event.timestamp = new Date();
  next();
});

// Event filtering
eventBus.on('task:*', (event) => {
  if (event.priority === 'high') {
    // Handle high-priority tasks
  }
}, { filter: { priority: 'high' } });

// Event aggregation
const aggregator = eventBus.createAggregator({
  window: 60000, // 1 minute
  groupBy: 'type'
});

aggregator.on('data', (aggregated) => {
  console.log('Aggregated events:', aggregated);
});

// Event replay
const history = await eventBus.getHistory({
  from: new Date(Date.now() - 3600000), // Last hour
  types: ['task:completed', 'task:failed']
});
```

### Error Handling and Monitoring

#### Error Handling

```javascript
// Global error handling
eventBus.on('error', (event) => {
  console.error('System error:', event.error);

  // Send to monitoring service
  monitoring.reportError(event.error, {
    agent: event.agent,
    task: event.taskId
  });
});

// Agent-specific error handling
class RobustAgent extends BaseAgent {
  async execute(task) {
    try {
      return await this.withRetry(task, 3);
    } catch (error) {
      await this.handleError(error, task);
      throw error;
    }
  }

  async withRetry(task, maxRetries) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.processTask(task);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.delay(1000 * (i + 1));
      }
    }
  }
}
```

#### Monitoring and Metrics

```javascript
import { MetricsCollector } from '@agents-cli/core';

const metrics = new MetricsCollector();

// Collect agent metrics
metrics.collectAgentMetrics(agent, {
  interval: 60000,
  includePerformance: true,
  includeResourceUsage: true
});

// Custom metrics
metrics.gauge('agent.queue.size', () => agent.getQueueSize());
metrics.counter('agent.tasks.completed', () => agent.getCompletedTasks());
metrics.histogram('agent.task.duration', (duration) => {
  // Record task duration
});

// Health checks
const healthCheck = await agent.healthCheck();
console.log('Agent health:', healthCheck);

// Performance profiling
const profile = await agent.getProfile({
  includeMemory: true,
  includeCPU: true,
  includeNetwork: true
});
```

### Integration Examples

#### Express.js Integration

```javascript
import express from 'express';
import { AgentFactory } from '@agents-cli/core';

const app = express();
const agent = AgentFactory.create({ type: 'code-analyzer' });

// API endpoint for code analysis
app.post('/analyze', async (req, res) => {
  try {
    const result = await agent.execute({
      type: 'analysis',
      input: req.body
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket integration
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  agent.on('task:progress', (event) => {
    ws.send(JSON.stringify(event));
  });
});
```

#### CLI Tool Integration

```javascript
#!/usr/bin/env node
import { Command } from 'commander';
import { AgentFactory } from '@agents-cli/core';

const program = new Command();

program
  .name('my-agent-tool')
  .description('Custom agent CLI tool')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze code')
  .argument('<path>', 'Path to analyze')
  .option('-t, --type <type>', 'Analysis type', 'quality')
  .action(async (path, options) => {
    const agent = AgentFactory.create({ type: 'code-analyzer' });
    const result = await agent.execute({
      type: 'analysis',
      input: { path, analysisType: options.type }
    });
    console.log(JSON.stringify(result, null, 2));
  });

program.parse();
```

---

## Troubleshooting

### Common Issues

#### Installation Problems

**Issue: Permission denied during global installation**
```bash
# Error
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules/agents-cli

# Solutions
# Option 1: Use npx (recommended)
npx agents-cli

# Option 2: Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Option 3: Use Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
npm install -g agents-cli
```

**Issue: Node.js version incompatibility**
```bash
# Error
Error: Agent Graph requires Node.js 18.0 or higher

# Solution
# Check current version
node --version

# Update Node.js using nvm
nvm install 20
nvm use 20
nvm alias default 20
```

**Issue: Network connectivity during installation**
```bash
# Error
npm ERR! network timeout

# Solutions
# Option 1: Increase timeout
npm config set timeout 60000

# Option 2: Use different registry
npm install -g agents-cli --registry https://registry.npmjs.org/

# Option 3: Use VPN or check network settings
```

#### Configuration Issues

**Issue: Invalid configuration file**
```bash
# Error
Configuration validation failed: Invalid agent configuration

# Debug steps
# Validate configuration
agents-cli config validate

# Show detailed errors
agents-cli config check --verbose

# Reset to defaults
agents-cli config reset --all
agents-cli config init --template typescript
```

**Issue: Missing environment variables**
```bash
# Error
API key not configured

# Solutions
# Set environment variable
export AGENT_GRAPH_API_KEY=your-api-key-here

# Or add to shell profile
echo 'export AGENT_GRAPH_API_KEY=your-api-key-here' >> ~/.bashrc
source ~/.bashrc

# Or use .env file
echo 'AGENT_GRAPH_API_KEY=your-api-key-here' >> .env
```

#### Agent Connection Issues

**Issue: Agent fails to start**
```bash
# Error
Failed to initialize agent: Connection timeout

# Troubleshooting steps
# Check agent status
agents-cli agent status

# Check system status
agents-cli doctor

# Restart agents
agents-cli agent restart --all

# Check logs
agents-cli logs --agent code-analyzer --follow
```

**Issue: AI model connection problems**
```bash
# Error
Failed to connect to AI model provider

# Solutions
# Check API key
agents-cli config get agents.codeAnalyzer.model.apiKey

# Test connection
agents-cli test --connection

# Try different model
agents-cli config set agents.codeAnalyzer.model.provider openai
agents-cli config set agents.codeAnalyzer.model.model gpt-3.5-turbo
```

#### Memory System Issues

**Issue: Memory database corruption**
```bash
# Error
SQLite database is corrupted

# Solutions
# Check memory health
agents-cli memory health

# Rebuild memory database
agents-cli memory rebuild --force

# Clear corrupted data
agents-cli memory clear --type long-term
```

**Issue: Out of memory errors**
```bash
# Error
JavaScript heap out of memory

# Solutions
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Reduce memory usage
agents-cli config set memory.shortTerm.maxSize 500
agents-cli config set memory.longTerm.compression true

# Monitor memory usage
agents-cli memory monitor --real-time
```

#### Knowledge Graph Issues

**Issue: Neo4j connection failed**
```bash
# Error
Failed to connect to Neo4j database

# Troubleshooting
# Check Neo4j status
agents-cli graph health

# Test connection
agents-cli graph test-connection

# Fallback to SQLite
agents-cli config set knowledge.provider sqlite
agents-cli config set knowledge.sqlite.path ./agents-cli.db
```

**Issue: Graph query timeouts**
```bash
# Error
Graph query timeout exceeded

# Solutions
# Increase timeout
agents-cli config set knowledge.performance.queryTimeout 60000

# Optimize queries
agents-cli graph profile "MATCH (n) RETURN n LIMIT 100"

# Rebuild indexes
agents-cli graph optimize --indexes
```

#### Git Integration Issues

**Issue: Git repository not found**
```bash
# Error
Not a git repository

# Solutions
# Initialize git repository
git init
agents-cli git init

# Or disable git integration
agents-cli config set git.enabled false
```

**Issue: Pre-commit hooks failing**
```bash
# Error
Pre-commit hook failed

# Debugging
# Run pre-commit manually
agents-cli git pre-commit

# Check hook logs
agents-cli logs --section git --follow

# Temporarily disable hooks
agents-cli git hooks disable pre-commit
```

### Error Messages

#### Agent Errors

**`AGENT_INITIALIZATION_FAILED`**
```bash
# Cause: Agent failed to initialize
# Solutions:
1. Check agent configuration: agents-cli config show --section agents
2. Verify model credentials: agents-cli config get agents.*.model
3. Check system resources: agents-cli doctor
4. Restart agent: agents-cli agent restart <agent-name>
```

**`TASK_EXECUTION_TIMEOUT`**
```bash
# Cause: Task took too long to complete
# Solutions:
1. Increase timeout: agents-cli config set agents.*.timeout 60000
2. Check task complexity: agents-cli task list --status timeout
3. Monitor system resources: agents-cli monitor
4. Break large tasks into smaller ones
```

**`MODEL_QUOTA_EXCEEDED`**
```bash
# Cause: API quota exceeded
# Solutions:
1. Check usage: agents-cli usage --period 24h
2. Upgrade API plan
3. Use different model: agents-cli config set agents.*.model.model gpt-3.5-turbo
4. Implement rate limiting: agents-cli config set agents.*.rateLimit 5
```

#### Memory Errors

**`MEMORY_CORRUPTION_DETECTED`**
```bash
# Cause: Memory database corruption
# Solutions:
1. Backup current data: agents-cli memory backup
2. Rebuild memory: agents-cli memory rebuild --force
3. Restore from backup if needed: agents-cli memory restore <backup>
```

**`SHORT_TERM_MEMORY_FULL`**
```bash
# Cause: Short-term memory capacity exceeded
# Solutions:
1. Increase size: agents-cli config set memory.shortTerm.maxSize 2000
2. Reduce TTL: agents-cli config set memory.shortTerm.ttl 1800000
3. Enable compression: agents-cli config set memory.shortTerm.compression true
4. Clear old data: agents-cli memory cleanup --type short-term
```

#### Graph Errors

**`GRAPH_CONNECTION_FAILED`**
```bash
# Cause: Cannot connect to graph database
# Solutions:
1. Check database status: agents-cli graph health
2. Verify connection settings: agents-cli config get knowledge.neo4j
3. Test network connectivity: telnet localhost 7687
4. Fallback to SQLite: agents-cli config set knowledge.provider sqlite
```

**`GRAPH_QUERY_SYNTAX_ERROR`**
```bash
# Cause: Invalid Cypher query syntax
# Solutions:
1. Validate query: agents-cli graph validate "MATCH (n) RETURN n"
2. Use query builder: agents-cli graph build-query
3. Check graph schema: agents-cli graph schema
4. Use natural language: agents-cli graph search "find all functions"
```

### Debug Mode

#### Enable Debug Logging

```bash
# Global debug mode
export DEBUG=agents-cli:*
agents-cli --verbose analyze ./src

# Specific component debugging
export DEBUG=agents-cli:agent,agents-cli:memory
agents-cli run --agent code-analyzer --task "analyze code"

# Debug configuration file
agents-cli --debug config show
```

#### Debug Individual Components

```bash
# Debug agents
agents-cli agent debug code-analyzer
agents-cli agent logs --follow --level debug

# Debug memory system
agents-cli memory debug --show-operations
agents-cli memory trace --key "user:*"

# Debug knowledge graph
agents-cli graph debug --show-queries
agents-cli graph profile "MATCH (n) RETURN n LIMIT 10"

# Debug git integration
agents-cli git debug --show-operations
agents-cli git logs --follow
```

#### Performance Debugging

```bash
# Profile agent performance
agents-cli profile --agent code-analyzer --duration 60

# Memory usage analysis
agents-cli memory profile --detailed

# Query performance
agents-cli graph profile-query "MATCH (f:Function) RETURN f.name"

# System resources
agents-cli monitor --resources --interval 5
```

### Recovery Procedures

#### Database Recovery

```bash
# Memory database recovery
agents-cli memory backup --name "emergency-backup"
agents-cli memory rebuild --force
agents-cli memory restore "emergency-backup"

# Graph database recovery
agents-cli graph backup --name "graph-backup"
agents-cli graph rebuild --force
agents-cli graph restore "graph-backup"
```

#### Configuration Recovery

```bash
# Reset to working configuration
agents-cli config reset --all
agents-cli config init --template typescript

# Import known good configuration
agents-cli config import --file backup-config.json

# Validate and fix configuration
agents-cli config validate --fix
```

#### Agent Recovery

```bash
# Restart all agents
agents-cli agent stop --all
agents-cli agent start --all

# Reinitialize problematic agent
agents-cli agent reinitialize code-analyzer

# Reset agent state
agents-cli agent reset --state code-analyzer
```

### Getting Help

#### Built-in Help

```bash
# General help
agents-cli --help
agents-cli help

# Command-specific help
agents-cli analyze --help
agents-cli agent --help

# Troubleshooting help
agents-cli help troubleshoot
agents-cli doctor
```

#### Community Support

```bash
# Generate support bundle
agents-cli support-bundle --output support-info.zip

# Report issue with context
agents-cli report-issue --title "Agent startup failure" --include-logs

# Check system compatibility
agents-cli check-compatibility
```

#### Diagnostic Commands

```bash
# Full system diagnostic
agents-cli diagnostic --full

# Component-specific diagnostics
agents-cli diagnostic --agents
agents-cli diagnostic --memory
agents-cli diagnostic --graph
agents-cli diagnostic --git

# Export diagnostic report
agents-cli diagnostic --export --format json --output diagnostic.json
```

---