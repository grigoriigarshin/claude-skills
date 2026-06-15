#!/usr/bin/env bash
set -euo pipefail

SKILL="${1:-}"
REPO="grigoriigarshin/claude-skills"
SKILLS_DIR="$HOME/.claude/skills"

if [ -z "$SKILL" ]; then
  echo "Usage: install.sh <skill-name>"
  echo ""
  echo "Available skills:"
  echo "  presentations   Create slide decks in the Service XP design language"
  exit 1
fi

TMP_DIR=$(mktemp -d)
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "Downloading $SKILL from $REPO..."
gh api "repos/$REPO/tarball/main" > "$TMP_DIR/repo.tar.gz"

tar -xzf "$TMP_DIR/repo.tar.gz" -C "$TMP_DIR"

EXTRACTED_DIR=$(find "$TMP_DIR" -maxdepth 1 -mindepth 1 -type d | head -1)

if [ ! -d "$EXTRACTED_DIR/skills/$SKILL" ]; then
  echo "Error: skill '$SKILL' not found in repo."
  echo "Available: $(ls "$EXTRACTED_DIR/skills/" | tr '\n' ' ')"
  exit 1
fi

mkdir -p "$SKILLS_DIR"
rm -rf "$SKILLS_DIR/$SKILL"
cp -r "$EXTRACTED_DIR/skills/$SKILL" "$SKILLS_DIR/$SKILL"

if [ -f "$SKILLS_DIR/$SKILL/package.json" ]; then
  echo "Installing npm dependencies (this may take a minute — Puppeteer downloads Chromium)..."
  npm install --prefix "$SKILLS_DIR/$SKILL" --silent
fi

echo ""
echo "Done. Use /$SKILL in Claude Code."
