# claude-skills

A collection of custom [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills that provide domain-specific knowledge to Claude via structured reference files.

## What are Claude Code Skills?

Skills are curated knowledge bundles that extend Claude Code with expertise on specific tools, platforms, or workflows. Each skill contains a `SKILL.md` definition and a set of reference files that Claude reads on-demand to answer questions accurately.

## Available Skills

| Skill | Description | Docs |
|-------|-------------|------|
| [gmlp](skills/gmlp/) | Delivery Hero's Global Machine Learning Platform — Metaflow, MLflow, Argo Workflows, GKE clusters, and more | [docs/gmlp.md](docs/gmlp.md) |
| [arch-report](skills/arch-report/) | Generates a high-level `ARCHITECTURE.md` for Python ML/GenAI repositories — system overview, components, mermaid diagrams, tech stack, and deployment | [docs/arch-report.md](docs/arch-report.md) |
| [create-skill](skills/create-skill/) | Creates and edits Claude Code skills (SKILL.md files) — scaffolds directories, writes frontmatter, optimizes descriptions for reliable triggering | [docs/create-skill.md](docs/create-skill.md) |

## Installation

Claude Code discovers skills from two locations:

| Location | Path | Scope |
|----------|------|-------|
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` | All your projects |
| Project | `.claude/skills/<skill-name>/SKILL.md` | Current project only |

### 1. Clone the repository

```bash
git clone <repo-url> ~/claude-skills
```

### 2. Symlink the skill you want

**For personal use** (available in all projects):

```bash
# Install the GMLP skill globally
ln -s ~/claude-skills/skills/gmlp ~/.claude/skills/gmlp
```

**For a specific project** (available only in that project):

```bash
cd /path/to/your/project
mkdir -p .claude/skills
ln -s ~/claude-skills/skills/gmlp .claude/skills/gmlp
```

You can also copy the skill folder instead of symlinking if you prefer a standalone copy.

### 3. Verify

Start Claude Code in your project. The skill activates automatically when you ask a question matching its trigger keywords. For example, asking about Metaflow configuration will trigger the GMLP skill. You can also invoke it directly with `/gmlp` or check available skills by asking "What skills are available?"

## Adding a New Skill

1. Create a directory under `skills/`:
   ```
   skills/my-skill/
   ├── SKILL.md
   └── references/
       ├── topic-a.md
       └── topic-b.md
   ```

2. Write `SKILL.md` with YAML frontmatter and a body:
   ```yaml
   ---
   name: my-skill
   description: >
     Keywords and phrases that should trigger this skill.
     Be specific — include tool names, error messages, and common terms.
   metadata:
     author: Your Team
     version: 1.0.0
   ---

   # My Skill

   Overview and quick-answer patterns go here.

   ## Reference File Router

   | Topic keywords | Reference file |
   |---|---|
   | keyword1, keyword2 | `references/topic-a.md` |
   | keyword3, keyword4 | `references/topic-b.md` |
   ```

3. Add reference files under `references/` — one file per topic, self-contained.

4. Add a documentation page in `docs/` explaining the skill's purpose and coverage.

## Repository Structure

```
claude-skills/
├── CLAUDE.md              # Instructions for Claude Code when working on this repo
├── README.md
├── docs/                  # Skill documentation for humans
│   ├── gmlp.md
│   └── arch-report.md
├── materials/             # Source docs used to build skills (gitignored)
└── skills/                # Skill definitions
    ├── gmlp/
    │   ├── SKILL.md       # Skill entry point (frontmatter + overview)
    │   └── references/    # Detailed topic files loaded on-demand
    ├── arch-report/
    │   └── SKILL.md       # Self-contained skill (no references needed)
    └── create-skill/
        ├── SKILL.md       # Skill creation workflow + templates
        └── references/
            └── complete-reference.md  # Frontmatter, description, anatomy, patterns
```
