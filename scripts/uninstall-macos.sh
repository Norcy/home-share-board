#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/Library/Application Support/My Home Desktop"
LAUNCH_AGENT="$HOME/Library/LaunchAgents/com.norcy.my-home-desktop.plist"
WORKFLOW_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows/user.workflow.9C7E2A14-6D51-4B8C-A3C9-12D4E6F8A0B2"

launchctl bootout "gui/$(id -u)/com.norcy.my-home-desktop" 2>/dev/null || true
rm -f "$LAUNCH_AGENT"
rm -rf "$WORKFLOW_DIR"
rm -f "$APP_DIR/my-home-desktop" "$APP_DIR/.project-root"
rmdir "$APP_DIR" 2>/dev/null || true

echo "已卸载 My Home Desktop 的 macOS 启动任务和 Alfred 工作流。"
