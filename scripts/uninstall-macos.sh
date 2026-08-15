#!/usr/bin/env bash
set -euo pipefail

LAUNCH_AGENT="$HOME/Library/LaunchAgents/com.myhomedesktop.launchd.plist"
launchctl bootout "gui/$(id -u)/com.myhomedesktop.launchd" 2>/dev/null || true
rm -f "$LAUNCH_AGENT"
echo "已取消 My Home Desktop 的 macOS 开机启动。"
