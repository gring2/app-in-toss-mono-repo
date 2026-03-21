#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILL_NAME="$(basename "$SKILL_DIR")"
CODEX_HOME_DIR="${1:-${CODEX_HOME:-$HOME/.codex}}"
DEST_DIR="$CODEX_HOME_DIR/skills/$SKILL_NAME"

mkdir -p "$CODEX_HOME_DIR/skills"
rm -rf "$DEST_DIR"
cp -R "$SKILL_DIR" "$DEST_DIR"

echo "Installed $SKILL_NAME to $DEST_DIR"
