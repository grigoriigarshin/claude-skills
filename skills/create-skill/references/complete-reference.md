# Skill Creation Reference

Read this file before generating any skill.

---

## 1. Frontmatter Fields

### Agent Skills Spec Fields (agentskills.io)

| Field | Required | Constraints |
|---|---|---|
| `name` | Yes | 1-64 chars. Lowercase `a-z`, `0-9`, hyphens only. No leading/trailing/consecutive hyphens. Must match parent directory name. |
| `description` | Yes | 1-1024 chars (spec). Non-empty. Describes what the skill does and when to use it. |
| `license` | No | License name or reference to bundled file. Example: `Apache-2.0`. Keep short. |
| `compatibility` | No | 1-500 chars. Environment requirements. Example: `Requires git, docker, jq`. Only include if skill has specific requirements. |
| `metadata` | No | Map of string keys to string values. Not used by runtime. Make key names reasonably unique to avoid conflicts. |
| `allowed-tools` | No | Pre-approved tools. Spec: space-separated string. Example: `Bash(git:*) Read`. |

### Claude Code Extension Fields

| Field | Default | Purpose |
|---|---|---|
| `when_to_use` | — | Additional trigger context appended to `description`. Combined text truncated at 1,536 chars in skill listing. |
| `argument-hint` | — | Autocomplete hint. Example: `[issue-number]` or `[filename] [format]`. |
| `arguments` | — | Named positional args. Space-separated string or YAML list. Maps to `$name` placeholders. Example: `arguments: [issue, branch]` → `$issue`, `$branch`. |
| `disable-model-invocation` | `false` | `true` = only user can invoke via `/name`. Description NOT loaded into context. Also prevents preloading into subagents. |
| `user-invocable` | `true` | `false` = hidden from `/` menu. Only agent can invoke. |
| `model` | — | Model override when skill is active. Same values as `/model`, or `inherit` to keep active model. Override applies for current turn only. |
| `effort` | — | Effort level override. Options: `low`, `medium`, `high`, `xhigh`, `max`. Inherits from session by default. |
| `context` | — | `fork` = run in isolated subagent. Skill content becomes subagent prompt. No conversation history. CLAUDE.md still loaded (except Explore/Plan agents). Only use for skills with explicit task instructions, not guidelines. |
| `agent` | `general-purpose` | Subagent type when `context: fork`. Options: `Explore`, `Plan`, `general-purpose`, or custom from `.claude/agents/`. |
| `allowed-tools` | — | Claude Code syntax: comma-separated with glob patterns. Example: `Read, Grep, Bash(python3 *)`. Grants permission without prompting. Does NOT restrict available tools. |
| `disallowed-tools` | — | Tools removed from Claude's available pool while skill is active. Use for autonomous skills. Example: `AskUserQuestion`. Restriction clears on next user message. |
| `hooks` | — | Hooks scoped to skill lifecycle. See Claude Code hooks docs. |
| `paths` | — | Glob patterns limiting activation. Comma-separated string or YAML list. Skill auto-loads only when working with matching files. |
| `shell` | `bash` | Shell for `!`command`` and ` ```! ` blocks. Options: `bash`, `powershell`. PowerShell requires `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`. |

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

Spec max: 1,024 chars. Claude Code: `description` + `when_to_use` combined truncated at 1,536 chars in skill listing. Put key use case first.

If `description` omitted, agent uses first paragraph of markdown body.

### Writing Rules

1. **Imperative phrasing.** "Use when..." not "This skill does..."
2. **User intent, not implementation.** Describe what the user wants to achieve.
3. **Be pushy.** List trigger contexts explicitly, including indirect: "even if they don't explicitly mention X."
4. **Specific keywords:** tool names, error messages, action verbs, file names.
5. **Concise.** A few sentences to one paragraph.
6. **Put key use case first.** Text is truncated — front-load the most important triggers.

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

### Using when_to_use

Use `when_to_use` for additional trigger phrases that would clutter `description`:

```yaml
description: >
  Build AI agents with Pydantic AI — tools, structured output, streaming, testing.
when_to_use: >
  Use when user imports pydantic_ai, asks to build an AI agent, add tools,
  stream output, define agents from YAML, or test agent behavior.
```

### Trigger Failures

| Symptom | Cause | Fix |
|---|---|---|
| Never triggers | Too vague, missing keywords | Add specific keywords and user intent phrases |
| Triggers too often | Too broad | Add specificity about what the skill does NOT do |
| Misses indirect requests | Only covers explicit mentions | Add "even if they don't explicitly mention X" |
| Description truncated | Too many skills, budget overflow | Front-load key use case. Run `/doctor`. Set skills to `"name-only"` in `skillOverrides`. |

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
├── SKILL.md           # Required — metadata + instructions
├── references/        # On-demand detail files
├── templates/         # Output templates
├── assets/            # Static resources (schemas, lookup tables, images)
├── scripts/           # Executable scripts (Python, Bash, JS)
└── ...                # Any additional files or directories
```

Scripts should be self-contained, include helpful error messages, and handle edge cases.

Reference files should be focused per topic. Agents load on demand — smaller files = less context.

### Skill Locations

| Location | Path | Scope |
|---|---|---|
| Enterprise | Managed settings | All org users |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All user projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled |

Priority: enterprise > personal > project. Plugin skills use `plugin-name:skill-name` namespace.

**Auto-discovery**: Project skills load from `.claude/skills/` in starting dir and every parent up to repo root. Nested `.claude/skills/` in subdirs discovered on demand (monorepo support).

**Additional directories**: `.claude/skills/` within `--add-dir` directories loaded automatically (but NOT from `permissions.additionalDirectories` setting).

**Live change detection**: Adding/editing/removing skills takes effect within the session without restart. Creating a new top-level skills directory requires restart.

### Progressive Disclosure

1. **Startup**: only `name` + `description` loaded (~100 tokens)
2. **Activation**: full SKILL.md loaded (< 500 lines, < 5000 tokens recommended)
3. **On-demand**: reference files loaded when agent needs them

### Skill Content Lifecycle

Once invoked, rendered SKILL.md content enters conversation as a single message and **stays for the rest of the session**. Not re-read on later turns. Write standing instructions, not one-time steps.

**Compaction behavior**: Auto-compaction re-attaches most recent invocation of each skill (first 5,000 tokens each). Combined budget: 25,000 tokens. Most-recently-invoked skills filled first; older skills may be dropped.

### Command Name Resolution

| Skill location | Command name source |
|---|---|
| `~/.claude/skills/` or `.claude/skills/` | Directory name |
| `.claude/commands/` | Filename without extension |
| Plugin `skills/` subdirectory | Directory name, namespaced by plugin |
| Plugin root `SKILL.md` | Frontmatter `name` (only case where `name` sets command name) |

### String Substitutions

| Variable | Value |
|---|---|
| `$ARGUMENTS` | All args. If absent from content, appended as `ARGUMENTS: <value>`. |
| `$ARGUMENTS[N]` / `$N` | Arg by 0-based index. `$0` = first. Shell-style quoting for multi-word values. |
| `$name` | Named arg from `arguments` frontmatter list. Maps to positions in order. |
| `${CLAUDE_SESSION_ID}` | Current session ID. |
| `${CLAUDE_EFFORT}` | Current effort level: `low`, `medium`, `high`, `xhigh`, or `max`. |
| `${CLAUDE_SKILL_DIR}` | Directory containing SKILL.md. Use for script paths regardless of CWD. |

### Dynamic Context Injection

`` !`command` `` runs shell commands during preprocessing. Output replaces placeholder. Agent only sees rendered result. Must appear at start of line or after whitespace.

**Inline form:**
```yaml
PR diff: !`gh pr diff`
Changed files: !`gh pr diff --name-only`
```

**Multi-line form:**
````markdown
```!
node --version
npm --version
git status --short
```
````

Substitution runs once. Output is not re-scanned for further placeholders.

Can be disabled globally with `"disableSkillShellExecution": true` in settings.

### Extended Thinking

Include `ultrathink` anywhere in skill content to enable extended thinking mode.

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
| Keep body concise — it stays in context | Every line is a recurring token cost |

---

## 5. Subagent Execution (`context: fork`)

| Approach | System prompt | Task | Also loads |
|---|---|---|---|
| Skill with `context: fork` | From agent type | SKILL.md content | CLAUDE.md (except Explore/Plan agents) |
| Subagent with `skills` field | Subagent's markdown body | Claude's delegation message | Preloaded skills + CLAUDE.md |

**Warning**: `context: fork` only makes sense for skills with explicit task instructions. Guidelines-only skills produce no meaningful output in a subagent.

---

## 6. Skill Visibility Controls

### skillOverrides Setting

Control visibility from settings without editing SKILL.md:

```json
{
  "skillOverrides": {
    "legacy-context": "name-only",
    "deploy": "off"
  }
}
```

| Value | Listed to Claude | In `/` menu |
|---|---|---|
| `"on"` (default) | Name and description | Yes |
| `"name-only"` | Name only | Yes |
| `"user-invocable-only"` | Hidden | Yes |
| `"off"` | Hidden | Hidden |

Plugin skills not affected — manage via `/plugin`.

### Permission Rules

```
# Allow specific skills
Skill(commit)
Skill(review-pr *)

# Deny specific skills
Skill(deploy *)

# Deny all skills
Skill
```

### Budget Management

Skill descriptions share a budget (1% of model context window by default). When over budget, least-used skill descriptions dropped first.

- `skillListingBudgetFraction` setting: raise budget (e.g., `0.02` = 2%)
- `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var: fixed character count
- `maxSkillDescriptionChars` setting: per-skill description cap (default 1,536)
- Run `/doctor` to check budget overflow

---

## 7. Visual Output Pattern

Skills can bundle scripts that generate visual output (HTML files opened in browser):

```yaml
---
name: codebase-visualizer
description: Generate an interactive tree visualization of your codebase.
allowed-tools: Bash(python3 *)
---

Run the visualization script:
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/visualize.py .
```
```

Use `${CLAUDE_SKILL_DIR}` for script paths so they resolve at any install location.

---

## 8. Troubleshooting

| Problem | Solution |
|---|---|
| Skill not triggering | Check description keywords. Verify with "What skills are available?" Try `/skill-name` directly. |
| Triggers too often | Make description more specific. Add `disable-model-invocation: true` for manual-only. |
| Descriptions cut short | Front-load key use case. Run `/doctor`. Set low-priority skills to `"name-only"` in `skillOverrides`. |
| Skill stops influencing behavior | Content may still be present. Strengthen instructions. Re-invoke after compaction. Use hooks for deterministic enforcement. |

---

## 9. Validation Checklist

```
[ ] name: lowercase, numbers, hyphens. 1-64 chars. No leading/trailing/consecutive hyphens.
[ ] name matches parent directory name.
[ ] description: 1-1024 chars (spec). Non-empty. Includes trigger keywords.
[ ] description + when_to_use combined < 1,536 chars (Claude Code).
[ ] Key use case appears first in description.
[ ] SKILL.md < 500 lines / < 5000 tokens.
[ ] Detail moved to reference files.
[ ] All referenced files exist.
[ ] $ARGUMENTS / $N / $name placeholders correct.
[ ] No generic filler content.
[ ] No content the agent already knows.
[ ] If context: fork, has explicit task instructions.
[ ] If paths set, glob patterns correct.
[ ] If scripts bundled, uses ${CLAUDE_SKILL_DIR} for paths.
```

Use `skills-ref validate ./my-skill` from the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) library to validate frontmatter and naming.
