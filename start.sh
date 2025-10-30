#!/bin/bash

# Agent Graph 本地启动脚本
# 用于快速启动 Agent Graph CLI 和 TUI

echo "🚀 Agent Graph 本地启动器"
echo "========================="
echo ""

PROJECT_DIR="/Users/rrong/Documents/perf/projects/web_agents/agent-graph"
CLI_PATH="$PROJECT_DIR/packages/cli/dist/cli-simple.js"
TUI_PATH="$PROJECT_DIR/packages/tui/dist/tui.js"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 检查文件是否存在
if [ ! -f "$CLI_PATH" ]; then
    echo "❌ 错误: CLI 文件不存在: $CLI_PATH"
    echo "   请先运行 npm run build 构建 CLI"
    exit 1
fi

if [ ! -f "$TUI_PATH" ]; then
    echo "❌ 错误: TUI 文件不存在: $TUI_PATH"
    echo "   请先运行 npm run build 构建 TUI"
    exit 1
fi

echo "✅ 项目文件检查完成"
echo ""

# 显示选项
echo "请选择启动模式:"
echo "1) CLI 模式 (命令行界面)"
echo "2) TUI 模式 (终端用户界面)"
echo "3) 同时启动 CLI 和 TUI"
echo "4) 显示帮助信息"
echo "5) 退出"
echo ""

read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo "🚀 启动 Agent Graph CLI..."
        echo "================================"
        node "$CLI_PATH" "$@"
        ;;
    2)
        echo "🎨 启动 Agent Graph TUI..."
        echo "================================"
        node "$TUI_PATH" "$@"
        ;;
    3)
        echo "🚀 启动 Agent Graph CLI..."
        echo "================================"
        node "$CLI_PATH" "$@"
        echo ""
        echo "🎨 启动 Agent Graph TUI..."
        echo "================================"
        node "$TUI_PATH" "$@"
        ;;
    4)
        echo "📚 Agent Graph 帮助信息"
        echo "================================"
        node "$CLI_PATH"
        ;;
    5)
        echo "👋 退出"
        exit 0
        ;;
    *)
        echo "❌ 无效选项，请选择 1-5"
        exit 1
        ;;
esac