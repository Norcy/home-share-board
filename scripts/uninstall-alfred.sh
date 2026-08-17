#!/usr/bin/env bash
set -euo pipefail

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
rm -rf "$WORKFLOW_DIR"
echo "已移除 Alfred 工作流：My Home Desktop"
