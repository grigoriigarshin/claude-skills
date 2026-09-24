---
name: report
description: >
  Generate a project status report from Slack, Jira, decks, meeting notes and pasted notes,
  and publish it to a shared Confluence tree. Use when the user asks to write a status update,
  a weekly or monthly project report, a squad update, or to set up reporting for a project.
  Triggered by /report, /report new, /report <project>.
metadata:
  version: 0.2.0
---

# report — Project status reports

Writes one report about one project for one period, in a fixed shape, and publishes it to a shared Confluence tree so it can be read and rolled up without rewriting.

**What it is not.** Squads already run working systems: Jira, their own trackers, whatever fits. Those own project state. This skill reads from them and publishes a periodic view. It does not track work, hold a backlog, or read across projects.

## Modes

| Command | Does |
|---|---|
| `/report` | Lists the projects that exist |
| `/report <project>` | The full flow: gather, ask, draft, review, publish |
| `/report <project> --quick` | Skips gathering. Paste, draft, publish. Works with no project page at all, producing markdown only. |
| `/report all` | Every project you own that is due. Gathers for all of them at once, then reviews them one at a time. |
| `/report new` | Discovers sources, creates the project pages, then runs a real report |

## First run

The Service product line's reporting root is:

```
https://atlassian.cloud.deliveryhero.group/wiki/spaces/GCC/pages/2223505420/Service+Reporting
```

Use it. Cache it in `~/.claude/xp-reporting/config.json` as `{"rootPageUrl": "...", "rootPageId": "2223505420", "cloudId": "atlassian.cloud.deliveryhero.group"}` so later runs skip this.

If that page is gone or you are working in another product line, find the root by its marker and cache what you find:

```
text ~ "xpr-reporting-root" AND type = page
```

Only ask the person if both fail, and then say what you are asking for: the Confluence page holding one child page per project. Offer `--quick` as the way to get a report without it.

## Reporting several projects at once

`/report all` exists because gathering is the slow part and it parallelises. Approval does not, and is not batched.

**Scope.** Projects where you are the `Owner` and a report is due. Due means the last report's date plus the cadence has passed. Get your name from `atlassianUserInfo` and match it against each project's config, and ask if that fails rather than guessing.

`/report all --any` takes every project you own whether due or not. `/report all cfx inbox` takes exactly those.

**Cap at five.** Each project costs a gather plus a draft in this context. Beyond five, report the rest separately and say so.

**One fan-out.** Resolve and load every project, then dispatch all gatherers for all projects in a single parallel round. Five sources across three projects is fifteen subagents at once, not three rounds of five.

**Then one report at a time, each fully reviewed and published before the next.** Every report gets its own status confirmation, its own metric checks, its own omission report. Nothing is batch-approved. A report that has been read once is not a report that has been checked, and the failure this guards against is one wrong number published under somebody's name.

**Order the queue by what needs attention.** After drafting, say what is coming and put the demanding one first:

> Three ready. CFX first: status moved to At risk and two numbers came from Slack.
> Then Inbox and Comms, both unchanged from last period.

That is ordering and expectation-setting, not permission to skip anything.

**Each project stands alone.** A failure on the third must not lose the two already published. Report what succeeded, what failed and why, and let the person retry just the failure.

## The seven phases

Load `references/` files only in the phase that needs them. Never load them all.

### 1. Resolve the project

Normalise the input and each child title of the root page: lowercase, strip spaces and punctuation.

| Case | Do |
|---|---|
| Exact match | Use it, say nothing |
| One title contains the input | Use it and name it: "Using *CFX Project*." |
| Several match | Ask. Never guess. |
| None | Offer `/report new` |

Cache confirmed aliases in `~/.claude/xp-reporting/aliases.json` against the page **ID**, not the title, so a rename does not break them.

### 2. Load context

Read `references/confluence.md`. Read the project's config table and the most recent report. Cache both under `~/.claude/xp-reporting/projects/<slug>/`.

Derive the period label and the gather window from `Cadence`. Always prefer the last report's date over the cadence default so a skipped period leaves no hole. Cap the window at 90 days and say so.

If Confluence fails, use the cache and say how old it is. If nothing is cached, degrade to `--quick` with no project page.

### 3. Gather

Read `references/gatherers.md`, and `references/gws.md` if any Google source is configured.

Dispatch one subagent per source, in parallel, on a small fast model. Each returns the fixed contract in `gatherers.md` and nothing else. **Raw source content must never enter this context.** A single Jira query can exceed the whole context budget.

Three input tiers, all optional: text pasted into the invocation, links the author pasted, and the sources in the config.

### 4. Ask what is missing

**One message, at most four questions, most valuable first.** Ask only about core sections with nothing in them, and prioritise sections the previous report had. With no previous report, the order is Metrics, Risks and blockers, Up next, Decisions needed.

**Every question has a safe default that needs no answer**: skip the metric, omit the section, do not publish the number. The author can ignore the whole message and still get a correct report.

Only surface numbers that match a declared metric or appeared in the last report. Everything else is dropped silently.

### 5. Draft

Read `references/template.md` and `references/writing-rules.md`.

Omit empty sections entirely. Rank items inside each section. PII was already stripped by the gatherers, and this is the second check.

### 6. Review

Show the full draft and wait for explicit approval.

- **Status is proposed with one line of reasoning**, then confirmed or overridden. Never published unread.
- **Metrics are confirmed by exception**: only numbers that are new, came from a deck, Slack or a transcript, or moved more than expected.
- **An edit patches one section.** Never redraft. A pasted rewrite is taken verbatim.
- **Omissions are reported in chat only, and only when the previous report had that section.**
- **Name any source that failed.**

### 7. Publish

Read `references/confluence.md`. Write the cache first, then publish, then update the cached copy.

Reports go under the current year folder, titled `<Project> YYYY-MM-DD`. Create the year folder if it is the first report of the year.

A same-day rerun updates that page, but only if no human has edited it. See the edit rules in `references/confluence.md`.

## Rules that hold everywhere

**Report what is there, never what is missing.** No placeholders, no "N/A", no "no blockers this week", no "owner not stated". A section with nothing in it is deleted. The only exception is the source footer, which lists what was read.

**Never infer a fact that no source states.** A gatherer that cannot find an owner returns `who: not stated`, and the report leaves the owner out. Verifying an unknown by checking another source is fine, and you say that you did. Guessing silently is not.

**Never present old news as current.** If a source's newest content predates the period, facts from it carry their date: "CFX share was 21% as of Sep 5". A period where nothing moved still gets a report saying so.

**Never overwrite a human's edit.** Anything a person changed on a published page stays. Check before touching a page, and when in doubt, do not touch it.

## Files

| File | Read in |
|---|---|
| `references/template.md` | Phase 5 |
| `references/writing-rules.md` | Phase 5 |
| `references/gatherers.md` | Phase 3 |
| `references/confluence.md` | Phases 1, 2, 7 |
| `references/gws.md` | Phase 3, only for Google sources |
| `references/new-project.md` | `/report new` only |
