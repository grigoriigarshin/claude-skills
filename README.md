# DH Claude Skills

Shared Claude Code skills for Delivery Hero colleagues.

## Install a skill

```bash
bash <(gh api repos/grigoriigarshin/claude-skills/contents/install.sh -H "Accept: application/vnd.github.raw") presentations
```

Replace `presentations` with the name of the skill you want.

**To update:** re-run the same command — it overwrites the existing install.

## Available skills

| Skill | Description | Extra setup |
|---|---|---|
| `presentations` | Create slide decks in the Service XP dark design language | Requires `npm` (installs Puppeteer for QA screenshots, ~150 MB) |

## Prerequisites

- `gh` CLI authenticated with your corporate GitHub account
  — check with: `gh auth status`
- `npm` — required for the `presentations` skill

## Adding a new skill (for maintainers)

1. Create `skills/<skill-name>/SKILL.md` and any supporting files
2. Add a `docs/<skill-name>.md` human-readable description
3. Add a row to the table above
4. The install script picks it up automatically — no changes needed to `install.sh`
