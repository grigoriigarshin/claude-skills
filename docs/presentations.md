# presentations

Creates slide decks in the Service XP dark design language through a three-phase workflow: narrative arc → slide plan → HTML file.

## What it does

- Phase 1: Asks 4 questions (goal, audience, context, duration), then proposes a narrative arc
- Phase 2: Produces a numbered slide plan using typed layouts (cover, cards, dot-list, etc.)
- Phase 3: Generates a self-contained HTML file with full CSS/JS navigation
- Phase 4: Runs Puppeteer QA screenshots of every slide automatically

## Design principles enforced

- One idea per slide
- No bullet points (cards, splits, or data callouts instead)
- 30–40% white space per slide
- Speaker notes for all detail that doesn't fit the slide

## Install

```bash
bash <(gh api repos/grigoriigarshin/claude-skills/contents/install.sh -H "Accept: application/vnd.github.raw") presentations
```

Requires `npm` — installs Puppeteer (~150 MB Chromium) on first install.

## Usage

Type `/presentations` in Claude Code.
