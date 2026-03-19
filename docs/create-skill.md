# create-skill Skill

**Skill Creator** — Helps create and edit Claude Code skills (SKILL.md files) following the Agent Skills open standard.

## Purpose

This skill gives Claude Code a structured workflow to scaffold skill directories, write SKILL.md files with correct frontmatter, craft descriptions that trigger reliably, and apply best practices for agent-oriented instruction design.

## What It Does

1. **Gathers requirements** — asks about purpose, invocation mode, location, arguments
2. **Requests source material** — ensures skills are grounded in real expertise, not generic LLM knowledge
3. **Generates the skill** — writes SKILL.md with correct frontmatter, description, and agent-optimized instructions
4. **Verifies** — checks name validation, description length, content quality

## What It Covers

- All Agent Skills spec fields (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`)
- Claude Code extension fields (`disable-model-invocation`, `user-invocable`, `context`, `agent`, `model`, `hooks`, `argument-hint`)
- Description optimization for reliable triggering
- Skill anatomy: directory structure, progressive disclosure, string substitutions, dynamic context injection
- Instruction patterns: gotchas sections, output templates, checklists, calibrating control

## Trigger Keywords

The skill activates when a user mentions: create a skill, write a SKILL.md, build a slash command, set up a custom command, scaffold a skill, skill frontmatter, skill best practices, or uses the `/create-skill` command.

## Installation

```bash
cd claude-skills

# Personal (all projects)
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/create-skill" ~/.claude/skills/create-skill

# Or project-specific (run from your target project)
mkdir -p .claude/skills
ln -s /absolute/path/to/claude-skills/skills/create-skill .claude/skills/create-skill
```

See the [main README](../README.md) for full installation instructions.
