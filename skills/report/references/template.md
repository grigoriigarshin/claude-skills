# The report shape

One shape for every project and every cadence. Only the depth and the period change.

```markdown
# CFX — CW38 · 2026-09-23

**Delivery: On track** · **Impact: Too early to tell**
Owner: A. Nkemelu · Squad: CFX

## Status
CFX reached 48.4% of Customer Help Center users in CW38, up from 42.8%.
Talabat finished its rollout on Sep 15 and sits at 96%.

## Shipped
Talabat completed rollout across all its markets on Sep 15.

## Metrics
| Metric | Now | vs last | Target |
|---|---|---|---|
| CFX share, global | 48.4% | +5.6pp | 60% |

## Rollout
*(an extra section, declared by this project)*

## Risks and blockers
- **Turkey may slip to Q4.** Coding support is constrained by Q3 OKR
  commitments. Raised at the support sync on Sep 14, no decision since.

## Decisions needed
- **Cooking instructions for POS vendors.** Talabat asked on Sep 15
  whether the feature can extend beyond in-house devices. Unanswered.

## Up next
- foodora EU to 100% and foodpanda to 25%, both today

---
*Sources: #cfx-rollout · Jira · SteerCo deck, section dated 2026-09-09*
```

## Core sections

Six, in this order, always. A section is core when the reader needs it and the writer has an incentive to leave it out.

| Section | Required | Notes |
|---|---|---|
| Status | Yes | Current state, not a diary. Two to four sentences, never more. |
| Shipped | No | **One sentence.** What went live since the last report. Not an activity log. |
| Metrics | No | Rows come from the project's Metrics page |
| Risks and blockers | No | One section, not two. A risk is what might miss the target, a blocker is what is stopping the work now, and readers treat them the same way. |
| Decisions needed | No | The section that makes leadership act |
| Up next | No | What the reader can hold someone to next period |

`Shipped` exists in this shape because the upstream monthly page needs one "win" sentence per initiative. Keep the cap.

## Omit when empty

A section with nothing in it is **deleted**. No placeholders, no "N/A", no empty headings, no "owner not stated".

This gives every project a tailored report for free. A rollout project renders Status, Shipped, Metrics, Rollout, Risks and Up next. A discovery project renders Status, Findings and Up next. Neither one has an empty line, and both are still readable by the same roll-up, because the sections that are present keep their known names and order.

Absence carries meaning under this rule, which is why per-project templates are not supported. If the section set varied by project, a missing `Risks and blockers` would be ambiguous.

## Extra sections

A project declares its own on its parent page. They render between `Metrics` and `Risks and blockers`, so the action-oriented sections stay at the bottom. Core sections cannot be renamed, removed or reordered.

An extra can be a table. Ship this one unchanged when a project rolls out to entities:

```markdown
## Rollout
| Entity | Users | Share |
|---|---|---|
| HungerStation | 359,482 | 100% |
| foodpanda | 765,031 | 4.7% |
```

## Status vocabulary

The word carries the meaning. Colour is decoration. **`Delivery` is health, not lifecycle stage.** It says whether the work is on pace, not whether the project is in discovery or development. Stage belongs to Jira.

**Delivery.** Are we building at the planned pace?

| Label | Lozenge |
|---|---|
| On track | green |
| At risk | yellow |
| Off track | red |
| Done | green |

**Impact.** Is it producing the expected result?

| Label | Lozenge |
|---|---|
| On track | green |
| At risk | yellow |
| Off track | red |
| Too early to tell | neutral |
| No measurement yet | neutral |

"Too early to tell" means the measurement exists and the data does not. "No measurement yet" means nobody knows how this would be proven, which is a gap worth seeing.

## Period labels

| Cadence | Label | Window |
|---|---|---|
| Weekly | `CW38` | Since the last report, default 7 days |
| Biweekly | `CW37-38` | default 14 days |
| Monthly | `September 2026` | default 30 days |
| Quarterly | `Q3 2026` | default 90 days |
| Ad-hoc | Ask the author | default 30 days |

Week numbers are ISO, always.

**Events between the period end and the report date.** `Shipped` and `Metrics` stay strictly inside the period. `Status` may mention a later event when it changes the current picture. Anything still ahead goes in `Up next` with its date.

## The Metrics table

Rows come from the project's `<Project> Metrics` page, which defines each metric's unit, target and source. A metric name alone is ambiguous: "self-service CSAT" can mean an absolute average or an uplift against control, and those are different numbers.

**Drop a column rather than showing it empty.** `Target` disappears when no metric has one, which is most projects for a long time, because targets get set later than metrics do. A permanently blank column in every report reads as broken.

`vs last` is dropped entirely when there is no previous report, when the previous report had no Metrics section, when a metric is new, or when the template version changed. On a first report it is simply absent, with nothing said about it. There is no previous period to compare to and the reader can see that. Deltas keep the unit of the value and are never converted. A value that has not moved reads `flat`. When the gap is longer than the cadence implies, the column header names its comparison date.

Lead with the metric that moved.

## The source footer

Every report ends with a one-line list of what was actually read, with dates for dated sources.

```markdown
---
*Sources: #cfx-rollout · Jira · SteerCo deck, section dated 2026-09-09*
```

This closes a hole. Sections are omitted silently and gathering degrades silently, so a Slack outage could delete `Risks and blockers` and a reader would take the absence as good news. The footer says what was read, never what is missing, so it stays inside the omit rule.

**Never list a source the reader cannot open**, and never link one. A permalink into a private channel returns an error that looks like evidence. Name it plainly, or leave it out if it is marked `Context only`.

## Linking

Hyperlink the word already in the sentence. "The September SteerCo names capacity as the cause" carries the link on *September SteerCo*.

- Never add a phrase just to hang a link on
- No visible URLs, brackets or footnote markers
- Deck links point at the slide used, not the deck's first page
- Jira keys are always links
- A number links from its Metrics row
- Never embed images hosted by Google. Those URLs expire. Link the slide.

## The metadata block

Last element on every published page, inside a collapsed expand.

```
xpr-squad-<squad> · xpr-delivery-<status> · xpr-impact-<status>
xpr-cadence-<cadence> · xpr-period-<token> · xpr-has-decisions
xpr-hash: <hash of the body> · xpr-template: 1
xpr-generated-by: <whoever ran the skill>
```

`xpr-generated-by` is whoever ran the skill, which is often not the `Owner` in the header. Confluence records the page author too, but the token keeps it visible without opening the history.

Period tokens: `xpr-period-2026-cw38`, `-2026-cw37-38`, `-2026-09`, `-2026-q3`, or a slug for ad-hoc. `xpr-has-decisions` only when that section has content.

The tokens make reports findable by CQL text search, which is how someone finds every project currently off track or waiting on a decision. The hash is what detects human edits. See `confluence.md`.
