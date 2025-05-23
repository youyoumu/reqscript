#!/usr/bin/env bash

# reqscript-select
# Script to select a request file using fzf with bat preview

# Exit on error
set -e

# Check if fzf is installed
if ! command -v fzf >/dev/null 2>&1; then
  echo "Error: fzf is not installed. Please install it first."
  exit 1
fi

# Set up preview command based on whether bat is available
PREVIEW_CMD="cat {}"
if command -v bat >/dev/null 2>&1; then
  PREVIEW_CMD="bat --color=always --style=numbers {}"
fi

# Check if a directory argument is provided, else use default
REQUESTS_DIR="${1:-./}"

if [ ! -d "$REQUESTS_DIR" ]; then
  echo "Error: '$REQUESTS_DIR' directory not found."
  exit 1
fi

# Find all TypeScript files and pipe to fzf with preview
find "$REQUESTS_DIR" -type f -name "*.ts" | fzf --height 40% --layout=reverse --border --preview "$PREVIEW_CMD"
