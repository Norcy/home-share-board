#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows/user.workflow.9C7E2A14-6D51-4B8C-A3C9-12D4E6F8A0B2"
rm -rf "$WORKFLOW_DIR"
echo "已移除 Alfred 工作流：My Home Desktop"
