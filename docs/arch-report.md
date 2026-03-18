# arch-report Skill

**Architecture Overview Generator** — Produces a high-level `ARCHITECTURE.md` for Python ML/GenAI repositories.

## Purpose

This skill gives Claude Code a structured workflow to analyze a repository and generate architecture documentation. It's designed for ML and GenAI codebases and produces documentation that a new team member can quickly scan to understand the system.

## What It Generates

An `ARCHITECTURE.md` file at the repo root with:

1. **Overview** — What the system does and the ML/GenAI problem it solves
2. **Tech Stack** — Frameworks, libraries, infrastructure in table format
3. **System Components** — Major components with one-line descriptions
4. **Architecture Diagram** — Mermaid flowchart showing how components connect
5. **Pipeline Flow** — End-to-end ML/GenAI pipeline with a Mermaid sequence diagram
6. **Deployment & Infrastructure** — Training infra, serving infra, CI/CD, environments
7. **Key Design Decisions** — Notable architectural choices (when evident)

## What It Does NOT Include

- Class or function names
- Code snippets
- Line-by-line explanations
- Implementation details

## Trigger Keywords

The skill activates when a user mentions: architecture overview, architecture diagram, system overview, `ARCHITECTURE.md`, document the architecture, or uses the `/arch-report` command.

## Installation

```bash
cd claude-skills

# Personal (all projects)
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/arch-report" ~/.claude/skills/arch-report

# Or project-specific (run from your target project)
mkdir -p .claude/skills
ln -s /absolute/path/to/claude-skills/skills/arch-report .claude/skills/arch-report
```

See the [main README](../README.md) for full installation instructions.
