# Skill Creation Reference

Read this file before generating any skill.

---

## 1. Frontmatter Fields

### Agent Skills Spec Fields

| Field | Required | Constraints |
|---|---|---|
| `name` | Yes | 1-64 chars. Lowercase `a-z`, `0-9`, hyphens. No leading/trailing/consecutive hyphens. Must match parent directory name. |
| `description` | Yes | 1-1024 chars. Controls activation. See [Description Rules](#2-description-rules). |
| `license` | No | License name or reference to bundled file. Example: `Apache-2.0`. |
| `compatibility` | No | 1-500 chars. Environment requirements. Example: `Requires git, docker, jq`. |
| `metadata` | No | Arbitrary key-value map. Not used by runtime. |
| `allowed-tools` | No | Pre-approved tools. Spec: space-delimited. Claude Code: comma-delimited with patterns. |

### Claude Code Extension Fields

| Field | Default | Purpose |
|---|---|---|
| `argument-hint` | — | Autocomplete hint. Example: `[issue-number]`. |
| `disable-model-invocation` | `false` | `true` = only user can invoke via `/name`. |
| `user-invocable` | `true` | `false` = hidden from `/` menu. Only agent can invoke. |
| `model` | — | Model override when skill is active. |
| `context` | — | `fork` = run in isolated subagent. Skill content becomes subagent prompt. No conversation history. CLAUDE.md still loaded. Only use for skills with explicit task instructions. |
| `agent` | `general-purpose` | Subagent type when `context: fork`. Options: `Explore`, `Plan`, `general-purpose`, custom from `.claude/agents/`. |
| `hooks` | — | Hooks scoped to skill lifecycle. |

### Invocation Matrix

| Frontmatter | User invokes | Agent invokes | Context loading |
|---|---|---|---|
| (default) | Yes | Yes | Description always loaded; full skill on invoke |
| `disable-model-invocation: true` | Yes | No | Description NOT loaded; full skill on user invoke |
| `user-invocable: false` | No | Yes | Description always loaded; full skill on agent invoke |

### allowed-tools Syntax (Claude Code)

```yaml
allowed-tools: Read, Grep, Glob, Bash(python *), Bash(gh *)
```

### Name Validation

Valid: `pdf-processing`, `data-analysis`, `code-review`
Invalid: `PDF-Processing` (uppercase), `-pdf` (leading hyphen), `pdf--processing` (consecutive hyphens), `pdf-` (trailing hyphen)

---

## 2. Description Rules

Max 1024 chars. If omitted, agent uses first paragraph of markdown body.

### Writing Rules

1. **Imperative phrasing.** "Use when..." not "This skill does..."
2. **User intent, not implementation.** Describe what the user wants to achieve.
3. **Be pushy.** List trigger contexts explicitly, including indirect: "even if they don't explicitly mention X."
4. **Specific keywords:** tool names, error messages, action verbs, file names.
5. **Concise.** A few sentences to one paragraph.

### Bad → Good

```yaml
# Bad
description: A skill for CSV analysis.

# Good
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use when
  the user has a CSV, TSV, or Excel file and wants to explore,
  transform, or visualize the data, even if they don't explicitly
  mention "CSV" or "analysis."
```

### Trigger Failures

| Symptom | Cause | Fix |
|---|---|---|
| Never triggers | Too vague, missing keywords | Add specific keywords and user intent phrases |
| Triggers too often | Too broad | Add specificity about what the skill does NOT do |
| Misses indirect requests | Only covers explicit mentions | Add "even if they don't explicitly mention X" |

### YAML Syntax

```yaml
description: >
  Folded block scalar. Lines join into one paragraph.
  Use when X, Y, or Z.
```

---

## 3. Skill Anatomy

### Directory Structure

```
my-skill/
├── SKILL.md           # Required
├── references/        # On-demand detail files
├── templates/         # Output templates
├── assets/            # Static resources (schemas, lookup tables)
└── scripts/           # Executable scripts
```

### Skill Locations

| Location | Path | Scope |
|---|---|---|
| Personal | `~/.claude/skills/<name>/SKILL.md` | All user projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled |
| Enterprise | Managed settings | All org users |

Priority: enterprise > personal > project. Nested `.claude/skills/` auto-discovered (monorepo support).

### Progressive Disclosure

1. **Startup**: only `name` + `description` loaded (~100 tokens)
2. **Activation**: full SKILL.md loaded (< 500 lines, < 5000 tokens)
3. **On-demand**: reference files loaded when agent needs them

### String Substitutions

| Variable | Value |
|---|---|
| `$ARGUMENTS` | All args. If absent from content, appended as `ARGUMENTS: <value>`. |
| `$ARGUMENTS[N]` / `$N` | Arg by 0-based index. `$0` = first. |
| `${CLAUDE_SESSION_ID}` | Current session ID. |
| `${CLAUDE_SKILL_DIR}` | Directory containing SKILL.md. Use for script paths. |

### Dynamic Context Injection

`` !`command` `` runs shell commands during preprocessing. Output replaces placeholder. Agent only sees rendered result.

```yaml
---
name: pr-summary
context: fork
agent: Explore
---

PR diff: !`gh pr diff`
Changed files: !`gh pr diff --name-only`

Summarize this pull request.
```

### Extended Thinking

Include "ultrathink" anywhere in skill content to enable extended thinking mode.

---

## 4. Instruction Patterns

### Gotchas Sections

Highest-value content. Concrete corrections to mistakes the agent WILL make:

```markdown
## Gotchas
- `users` table uses soft deletes. Always add `WHERE deleted_at IS NULL`.
- User ID = `user_id` (DB), `uid` (auth), `accountId` (billing). Same value.
- `/health` returns 200 even if DB is down. Use `/ready` for full check.
```

Place in SKILL.md so agent reads them before encountering the situation.

### Output Templates

Agents pattern-match against concrete structures better than prose:

````markdown
```markdown
# [Analysis Title]
## Executive summary
[One-paragraph overview]
## Key findings
- Finding 1 with supporting data
## Recommendations
1. Specific actionable recommendation
```
````

Short templates: inline. Long templates: `templates/` directory.

### Checklists

For multi-step workflows with dependencies or validation gates:

```markdown
- [ ] Step 1: Analyze (run `scripts/analyze.py`)
- [ ] Step 2: Map fields (edit `fields.json`)
- [ ] Step 3: Validate (run `scripts/validate.py`)
- [ ] Step 4: Execute (run `scripts/execute.py`)
```

### Calibrating Control

**Give freedom** when multiple approaches are valid. Explain WHY so the agent can adapt.
**Be prescriptive** when operations are fragile or sequence is critical. Use exact commands.

### Content Rules

| Rule | Rationale |
|---|---|
| Only include what the agent would get wrong | Avoids wasting context on known information |
| Pick one default, mention alternatives briefly | Agent can't decide between equal options |
| Teach procedures, not specific answers | Procedures generalize across tasks |
| Scope to one coherent domain | Too narrow = conflicts; too broad = imprecise activation |
| Bundle scripts if agent reinvents same logic | Tested script > ad-hoc agent code |
