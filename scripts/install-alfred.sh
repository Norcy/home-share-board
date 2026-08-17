#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
ROOT_DIR="$(cd -- "$(dirname -- "$SCRIPT_PATH")/.." && pwd)"
APP_DIR="$HOME/Library/Application Support/My Home Desktop"
ENTRYPOINT="$APP_DIR/my-home-desktop"
ALFRED_PREFERENCES="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences"
ALFRED_SETTINGS="$HOME/Library/Preferences/com.runningwithcrayons.Alfred-Preferences.plist"
if [[ -f "$ALFRED_SETTINGS" ]]; then
  SYNC_FOLDER="$(plutil -extract syncfolder raw "$ALFRED_SETTINGS" 2>/dev/null || true)"
  if [[ -n "$SYNC_FOLDER" ]]; then
    SYNC_FOLDER="${SYNC_FOLDER/#\~/$HOME}"
    ALFRED_PREFERENCES="$SYNC_FOLDER/Alfred.alfredpreferences"
  fi
fi
WORKFLOW_DIR="$ALFRED_PREFERENCES/workflows/user.workflow.9C7E2A14-6D51-4B8C-A3C9-12D4E6F8A0B2"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "这个安装脚本只支持 macOS。" >&2
  exit 1
fi
if [[ ! -f "$ROOT_DIR/server.mjs" ]]; then
  echo "请从项目根目录运行：yarn alfred" >&2
  exit 1
fi
if [[ ! -d "$(dirname -- "$WORKFLOW_DIR")" ]]; then
  echo "未找到 Alfred，请先安装 Alfred。" >&2
  exit 1
fi

mkdir -p "$APP_DIR" "$WORKFLOW_DIR"
cp "$ROOT_DIR/bin/my-home-desktop" "$ENTRYPOINT"
printf '%s\n' "$ROOT_DIR" >"$APP_DIR/.project-root"
chmod 755 "$ENTRYPOINT"

ENTRYPOINT_FOR_ALFRED="${ENTRYPOINT//\/\\}"
ENTRYPOINT_FOR_ALFRED="${ENTRYPOINT_FOR_ALFRED//&/\\&}"
sed "s|__MY_HOME_DESKTOP_ENTRYPOINT__|$ENTRYPOINT_FOR_ALFRED|g" \
  "$ROOT_DIR/alfred/My Home Desktop/info.plist.template" >"$WORKFLOW_DIR/info.plist"
cp "$ROOT_DIR/alfred/My Home Desktop/icon.png" "$WORKFLOW_DIR/icon.png"
plutil -lint "$WORKFLOW_DIR/info.plist" >/dev/null
echo "已安装 Alfred 工作流：My Home Desktop"
