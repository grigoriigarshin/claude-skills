#!/usr/bin/env bash
# Post-install hook: distributes research bundle files to the correct ~/.claude/ locations

set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
SKILL_DIR="$CLAUDE_DIR/skills/research"

# research-planner skill
mkdir -p "$CLAUDE_DIR/skills/research-planner"
cp "$SKILL_DIR/research-planner/skill.md" "$CLAUDE_DIR/skills/research-planner/"

# XP BQ reference files
mkdir -p "$CLAUDE_DIR/skills/xp-research/reference"
cp -r "$SKILL_DIR/xp-research/reference/." "$CLAUDE_DIR/skills/xp-research/reference/"

# Workflow
mkdir -p "$CLAUDE_DIR/workflows"
cp "$SKILL_DIR/workflows/research-executor.js" "$CLAUDE_DIR/workflows/"

# Agents
mkdir -p "$CLAUDE_DIR/agents"
cp "$SKILL_DIR/agents/research-executor.md" "$CLAUDE_DIR/agents/"
cp "$SKILL_DIR/agents/research-auditor.md" "$CLAUDE_DIR/agents/"

# General DH schema reference (from data-platform-product)
echo "Fetching DH schema reference..."
mkdir -p "$CLAUDE_DIR/skills/data-analyst"
gh api repos/deliveryhero/data-platform-product/contents/.claude/skills/data-analyst/schema_reference.md \
  --jq '.content' | base64 -d > "$CLAUDE_DIR/skills/data-analyst/schema_reference.md"

echo "Research workflow installed:"
echo "  /research-planner — planning skill"
echo "  research-executor — workflow (launched automatically by planner)"
echo "  research-auditor  — audit agent (run /audit <report.md>)"
