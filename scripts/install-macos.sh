#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
ROOT_DIR="$(cd -- "$(dirname -- "$SCRIPT_PATH")/.." && pwd)"
APP_DIR="$HOME/Library/Application Support/My Home Desktop"
ENTRYPOINT="$APP_DIR/my-home-desktop"
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
LAUNCH_AGENT="$LAUNCH_AGENT_DIR/com.myhomedesktop.launchd.plist"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "这个安装脚本只支持 macOS。" >&2
  exit 1
fi
if [[ ! -f "$ROOT_DIR/server.mjs" ]]; then
  echo "请从项目根目录运行：yarn autostart" >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "找不到 Node.js，请先安装 Node.js 20.19 或更高版本。" >&2
  exit 1
fi

NODE_VERSION="$(node -p 'process.versions.node')"
NODE_MAJOR="${NODE_VERSION%%.*}"
NODE_MINOR="${NODE_VERSION#*.}"
NODE_MINOR="${NODE_MINOR%%.*}"
if (( NODE_MAJOR < 20 || (NODE_MAJOR == 20 && NODE_MINOR < 19) )); then
  echo "当前 Node.js 是 $NODE_VERSION，需要 20.19 或更高版本。" >&2
  exit 1
fi

mkdir -p "$APP_DIR" "$LAUNCH_AGENT_DIR"
cp "$ROOT_DIR/bin/my-home-desktop" "$ENTRYPOINT"
printf '%s\n' "$ROOT_DIR" >"$APP_DIR/.project-root"
chmod 755 "$ENTRYPOINT"

sed "s|__MY_HOME_DESKTOP_ENTRYPOINT__|$ENTRYPOINT|g" \
  "$ROOT_DIR/launchd/com.myhomedesktop.launchd.plist.template" >"$LAUNCH_AGENT"
plutil -lint "$LAUNCH_AGENT" >/dev/null
launchctl bootout "gui/$(id -u)/com.myhomedesktop.launchd" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$LAUNCH_AGENT"

echo "已安装 My Home Desktop 开机启动。"
echo "项目目录：$ROOT_DIR"
