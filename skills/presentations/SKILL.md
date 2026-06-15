---
name: presentations
description: Use when the user asks to create a presentation, deck, or slides — covers narrative arc, slide planning, and HTML file generation in the Service XP dark design language.
---

# Presentations

Three-phase workflow: narrative → slide plan → HTML file.

**Read `base.html` in this skill directory before Phase 3.** It contains the full CSS, JS navigation, and one working example of every slide type.

---

## Design Principles (always-on — apply in every phase)

These are hard constraints, not suggestions. They override default instincts at every step.

### 1. One idea per slide
Every slide communicates exactly one main idea. If a slide has two competing thoughts, it must be split into two slides. The audience should grasp the point within three seconds of seeing the slide.

### 2. No bullet points
Bullet points are forbidden. They are the laziest way to present information and the fastest way to lose the audience. Instead:

| Instead of bullets, use | When |
|---|---|
| Horizontal cards | Parallel entities, options, pillars |
| Timeline or step diagram | Sequential steps or process |
| Large data callout (single number + label) | Key metric or stat |
| Two-column split | Contrast, before/after, problem/solution |
| Visual metaphor or diagram | Abstract concepts, relationships, systems |

The `dot-list` slide type is the only exception — it uses visual dots as separators, not text bullets. `text-blob` must be used sparingly and even then should use numbered steps or short labeled groups, never raw text lists.

### 3. White space is content
At least 30–40% of each slide must remain visually empty. White space focuses the eye. Resist the urge to fill it. If the slide feels too sparse, it is probably correct.

### 4. Details go into speaker notes, not slides
Every piece of context, explanation, or supporting data that doesn't fit the three-second rule goes into speaker notes — not on the slide. The slide is the signal. Notes are the detail.

### 5. Visual metaphors over abstract words
Before placing text, ask: can this be shown as a diagram, icon, or spatial metaphor? Overlapping circles for interaction. Vectors for acceleration. A funnel for filtering. Translate the concept into a visual shape whenever possible.

---

## Per-slide design process (apply internally in Phase 2)

For each slide, before writing the slide plan entry, run this diagnostic internally:

1. **Diagnose** — is the source material overloaded? Name the problem (too much text, competing ideas, slide-document).
2. **Extract the core message** — one sentence the audience must remember even if they only glance.
3. **Choose the structure** — which layout makes that message land in three seconds? (card grid, single stat, split, diagram)
4. **Find the visual metaphor** — is there a spatial or physical metaphor that makes the concept obvious?
5. **Move the rest to speaker notes** — everything that didn't make it onto the slide.

When the source material is raw or unclear, surface this process to the user as a brief diagnostic before proposing the slide plan.

---

## Phase 1 — Narrative

Ask all four questions in one message:

1. **Goal** — what should the audience think, feel, or decide after this?
2. **Audience** — who are they and what do they already know?
3. **Context** — live vs async? any format or time constraints?
4. **Duration** — how many minutes?

Then propose a **narrative arc** as 4–7 bullet points. Typical shape:
- Hook / problem statement
- Current state + tension
- Key insight or evidence
- Solution / direction
- Implications / so-what
- Ask or next step

Wait for approval before Phase 2.

## Phase 2 — Slide Plan

Numbered list: `N. [type] — one-line content description`

```
1. [cover] Q2 Service XP Strategy — 01·05·2026
2. [catchy-title] "Contact rates are rising and we don't know why"
3. [dot-list] Four root causes — one dot-item each
4. [section-divider] "Here's the plan" with → icon
5. [cards] Three initiatives: CFX rollout · Comms discovery · Inbox
6. [text-blob] CFX progress: 12% share, target 30%
7. [closing] Ask: greenlight Q3 roadmap
```

**Slide type guide:**

| Type | Use when |
|------|----------|
| `cover` | Always slide 1 |
| `catchy-title` | Strong declarative statement; no body needed |
| `agenda` | 30+ min sessions or multi-topic decks |
| `hello` | Presenter intro or scene-setting with body text |
| `section-divider` | Major section break; full-screen blob effect |
| `dot-list` | 4–6 parallel items: pillars, root causes, principles |
| `cards` | 2–3 options or themes to compare |
| `product-spotlight` | Feature showcase with mockup or screenshot |
| `text-heavy` | Appendix, dense reference, two-column breakdown |
| `text-blob` | Single topic with bulleted or numbered list |
| `closing` | Always last slide; reuse cover or section-divider style |

Wait for approval before Phase 3.

## Phase 3 — HTML Generation

Ask:
1. "Filename? (e.g. `q2-strategy`)"
2. "Save location? (default: `~/Downloads/`)"

Read `base.html` in this skill directory. It has the complete CSS and JS — copy them verbatim into the new file. Then add one `<div class="slide dark">` per slide using the HTML patterns shown in base.html for each slide type.

Rules:
- Slide 1: add class `active`
- Set total count: `<span id="ct">NN</span>` where NN = number of slides
- Update each `<div class="slide-num">` to show `XX / NN`
- Write real content — no Lorem ipsum, no placeholders
- Agenda slides use `class="slide light"`; all others use `class="slide dark"`
- Copy the blob configuration from the matching slide type in base.html, adapt colors if needed
- No bullet point lists in slide content — use cards, splits, or data callouts instead
- Add speaker notes as `<!-- NOTES: ... -->` comment after each slide div — 2–3 sentences covering what didn't fit on the slide

Save to specified path. Confirm: "Saved to `~/path/file.html` — open in browser, navigate with ← → or Space."

## Phase 4 — QA with Puppeteer (always run after Phase 3)

After generating the HTML, run the QA script to screenshot every slide and inspect them yourself before reporting done.

```bash
node ~/.claude/skills/presentations/qa-screenshots.js /path/to/deck.html [/path/to/out-dir]
```

Puppeteer is installed in `~/.claude/skills/presentations/node_modules/`. The script opens the file at 1440×900, activates each slide by index, waits 120ms for blobs/transitions, and saves `slide-01.png … slide-NN.png` to `out-dir` (default: `qa-screenshots/` next to the HTML).

**What to check per slide:**
- No text or element clipped by slide edges
- Paragraph widths aren't too narrow (inline `max-width` override if CSS default 360px is too tight)
- Image/video containers don't overflow — for phone screenshots use `max-height:100%;max-width:calc((100% - Xpx)/N)` where N = count and X = total gap
- Section-divider ghost text behind the next slide is **intentional design**, not a bug
- Slide numbers in bottom-right match the slide position
- Bottom-left JS counter shows `01/NN` in all Puppeteer shots — this is a script artifact; correct in real browser

**Known limitations:**
- Videos show their first frame only (expected in headless)
- The JS nav counter always reads `01/NN` in screenshots (not a real bug)

## Good UI Examples

**These are UI references only — not examples of good storytelling or slide structure.** Use them to copy visual patterns, layout techniques, and component styling. Do not use them as a model for narrative arc, content hierarchy, or information design.

Two reference decks live in `references/` next to this skill. Open them in a browser before Phase 2 when designing layout-heavy slides.

### `references/cfx-deep-dive-v2/index.html`
Best for: **data-dense slides, tables, video layouts, metric cards**

| Pattern | Where | Key technique |
|---------|-------|---------------|
| Metric cards with glow | Slide 8 | `background:rgba(74,222,128,0.06); border:1px solid rgba(74,222,128,0.22)` — tint + border in same color |
| CSS Grid confidence matrix | Slide 12 | `grid-template-columns:100px repeat(6,1fr)` — fixed label col, equal data cols; borders only on bottom+right; color-coded pills |
| Bullet lists inside grid cells | Slide 12 | `<ul style="list-style:disc;padding-left:14px;display:flex;flex-direction:column;gap:3px">` |
| Two-column video layout | Slides 4, 5 | `flex:1; min-height:0; height:0; width:100%; object-fit:contain` — `height:0`+`flex:1` is the correct responsive video pattern |
| Number + inline label | Slide 12 | Large bold number + `font-size:12px; color:rgba(255,255,255,0.5); margin-left:5px` annotation |

### `references/herocare-strategy-2026/index.html`
Best for: **strategy slides, pillar layouts, KPI comparisons with progress bars**

| Pattern | Key technique |
|---------|---------------|
| Color-tinted cards per brand color | `background:rgba(45,143,207,0.08); border:1px solid rgba(45,143,207,0.2)` — each card tinted in its accent color |
| Uppercase category label above card | `font-size:11px; font-weight:800; letter-spacing:0.15em; text-transform:uppercase; color:var(--blue)` |
| Staggered card entrance animations | CSS custom property `--d:0.05s / 0.2s / 0.3s / 0.4s` on successive items |
| Progress bars for KPI comparison | `height:12px; border-radius:6px; overflow:hidden` container + gradient fill with glow shadow |
| Pill tag on card (e.g. GROWTH) | `padding:4px 12px; border-radius:12px; border:1px solid rgba(...); letter-spacing:0.05em` |
| Glow highlight on active card | `box-shadow:0 0 30px rgba(45,143,207,0.1)` — subtle, not aggressive |

## Design System Quick Reference

**Colors:** `--blue: #2D8FCF` · `--teal: #8BAAAA` · `--pink: #C898B8` · `--amber: #D4A850`

**Typography:** `.mega` (cover) · `.big-title` · `.section-title` · `.body-lg` · `.body-md`

**Layout:** `.grid-2` · `.grid-3` · `.split` + `.split-half` · `.content.left` (55% width)

**Components:** `.dot-line.{blue|teal|pink|amber}` + `.dot-item` · `.card-outline` · `.h-rule` · `.icon-circle` · `.agenda-row`

**Header** (every slide): logo pill left · italic tagline center · year right
