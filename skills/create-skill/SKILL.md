---
name: create-skill
description: >
  Create or edit Claude Code skills (SKILL.md files). Use when the user wants to
  create a new skill, write a SKILL.md, build a slash command, set up a custom
  command, scaffold a skill directory, or improve an existing skill's description
  or frontmatter. Also use when asking about skill structure, frontmatter fields,
  skill best practices, or how to make a skill trigger reliably.
metadata:
  author: Mundher Al
  version: 1.0.0
---

# create-skill

Creates Claude Code skills following the Agent Skills open standard. Read `references/complete-reference.md` BEFORE generating any skill.

## Workflow

### Step 1: Gather Requirements

Ask the user:
1. **What does the skill do?** — Core purpose in one sentence.
2. **Who invokes it?** — User only (`disable-model-invocation: true`), Claude only (`user-invocable: false`), or both (default).
3. **Where should it live?** — Personal (`~/.claude/skills/`), project (`.claude/skills/`), or this repo (`skills/`).
4. **Does it need reference files?** — If the skill covers multiple topics, split into `references/*.md` and add a router table.
5. **Does it need arguments?** — If yes, use `$ARGUMENTS` or `$0`, `$1`, etc.

### Step 2: Gather Source Material

Ask what the user can provide:
- Internal docs, runbooks, style guides, API specs, schemas
- Code review comments, issue trackers, real failure cases
- Existing conversation where Claude was corrected/guided through the task

Do NOT generate skills from generic LLM knowledge alone.

### Step 3: Generate the Skill

Rules:
- **SKILL.md < 500 lines / < 5000 tokens.** Move detail to reference files.
- **Write for an AI agent, not a human.** Use lookup tables, decision trees, imperative instructions. No prose explanations of concepts the agent already knows.
- **Description field controls activation.** See Section 2 of `references/complete-reference.md`.
- **Include a reference file router table** if using reference files.
- **Add a gotchas section** for environment-specific facts that defy assumptions.
- **Provide defaults, not menus.** Pick one approach, mention alternatives briefly.
- **Favor procedures over declarations.** Teach how to approach a class of problems.

### Step 4: Verify

1. `name`: lowercase, numbers, hyphens only. Max 64 chars. No leading/trailing/consecutive hyphens. Matches parent directory name.
2. `description`: under 1024 characters. Includes specific trigger keywords.
3. SKILL.md under 500 lines. Detail in reference files.
4. All reference files in router table exist.
5. `$ARGUMENTS` placeholders correct if skill accepts arguments.
6. No generic filler ("handle errors appropriately", "follow best practices").
7. No content the agent already knows (HTTP basics, language fundamentals).

## Templates

### Minimal

```yaml
---
name: skill-name
description: >
  What this skill does. Use when [specific trigger contexts].
  Include keywords users would say, even if they don't name the domain.
---

# skill-name

## Instructions

Imperative steps for the agent.
```

### With References

```yaml
---
name: skill-name
description: >
  Description covering all reference file topics with trigger keywords.
---

# skill-name

Read the matching reference file BEFORE answering.

## Reference File Router

| Topic keywords | Reference file |
|---|---|
| keyword1, keyword2 | `references/topic-a.md` |
| keyword3, keyword4 | `references/topic-b.md` |

## Quick-Answer Patterns

### Common Task 1
Steps that don't require reading reference files.

## Gotchas
- Specific non-obvious fact the agent would get wrong.
```

### Task-Only (user-invoked)

```yaml
---
name: deploy
description: Deploy the application
disable-model-invocation: true
argument-hint: "[environment]"
---

Deploy to $ARGUMENTS:

1. Run tests
2. Build
3. Deploy
4. Verify
```
