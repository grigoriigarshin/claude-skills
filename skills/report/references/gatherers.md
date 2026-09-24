# Gatherers

One subagent per source, dispatched in parallel on a small fast model. Each reads its own source and returns the contract below and nothing else.

**Raw source content must never reach the orchestrator.** Ten sources cost roughly 3k tokens through this contract and around 80k without it. A single unfiltered Jira query has exceeded the entire context budget three times in testing.

## The return contract

```
Source: <name> (<type>, <period>)
Newest content: <date of the most recent item found, or "none in window">
Shipped: <what | when | or "none">
Status signals: <what | when>
Numbers: <metric: value | when | UNCONFIRMED if spoken>
Risks and blockers: <what | who | since when | why | what is needed | or "none">
Decisions made: <what | who decided | when | or "none">
Decisions raised: <what | who raised it | when | or "none">
Commitments: <who | what | by when>
Truncated: <yes, and how much was skipped | no>
```

**Every item carries what, who and when, plus why when the source says it.** A blocker returns as `Partner flow adaptation blocked | who: partner eng lead | since: 2026-09-10 | why: no capacity their side | needs: a timeline`, not as "the partner is blocked".

**Absent parts are named, never inferred.** This half matters more. Asking for all the fields is how a model invents the missing ones: a message saying "the partner is blocked" names no owner, and a gatherer required to produce one will produce a plausible one. Write `who: not stated` and stop. An invented owner reaching the report as a real name is the same class of failure as an unconfirmed number reaching it as fact.

`Newest content` is required even when nothing was found. It is what makes staleness detectable.

## Rules for every gatherer

**Strip personal data at this boundary.** Return no customer names, order IDs, addresses, phone numbers or rider names. Report the fact without the identifier: "one customer reported a duplicate charge", never the name or the order. This is the only place the filter works, because everything downstream has already seen the text.

**Cap the volume and say so.** A busy channel can carry hundreds of messages a week. Read the most recent up to a generous cap and set `Truncated`. Silent truncation is worse than a failed read, because nothing looks wrong.

**Spoken numbers are never facts.** "We're at maybe twenty percent" returns as `UNCONFIRMED` with the speaker and an approximate time. No confirmation, no number.

**Include bot and app messages.** Most tooling excludes them by default. In testing, the single most valuable message across seven channels and ten days was a meeting-summary bot post carrying the decisions, the owners and the only real risk.

**Sources are expected to be English.** If one is not, say so and flag that you translated.

## Source types

### Slack

Read the channel over the window. Meeting summaries, rollout announcements and escalations are the high-value content. Thread replies matter more than top-level noise.

### Jira

Only run the filter the config gives you. **Never text-search for the project name**: searching "CFX" returned tickets from twelve unrelated projects, and "inbox" returned fifteen results with none relevant.

If the filter is a pattern such as `parent in (epics matching "Inbox")`, resolve it at run time: list the project's epics, match the summary, then query their children. This is what stops a filter going stale when a new iteration epic appears.

**Jira status does not establish `Shipped`.** A ticket moving to Done is usually an internal task, not a launch. Report Done items under `Status signals` and let a human source confirm a launch.

If the filter returns zero inside the window, say so. That is different from a source that failed, and usually means the filter is stale.

### Decks

See `gws.md` for access. **Never put a full deck into the response or the context.** These run to hundreds of slides. Pipe through an extractor that prints slide titles plus the text of matching slides.

**Detect the section order, do not assume it.** Decks carry dated cover slides, and they may run oldest-first or newest-first. One real deck descended Sept, Jul, Jun, May. Cross-check the top section's date against the file's `modifiedTime`.

Use only sections inside the window. When a metric appears in two sections, take the later one. A deck with no dated sections falls back to `modifiedTime`, and you read only the most recent slides.

### Sheets

Design and ops teams often track their work in a spreadsheet rather than Jira. Read it with `gws sheets spreadsheets values get`.

**A sheet has no schema you can assume.** Read the header row first and work out which columns carry the item, the status, the owner and any dates. Say in your return what you inferred, so a wrong guess is visible rather than silent. If the headers are unreadable or the sheet has no obvious structure, return nothing and say why. A misread sheet produces confident nonsense.

**A sheet is a snapshot, not a log.** Rows carry current state, and unless there is a date column there is no way to tell what changed this period. So a sheet feeds `Status signals` and `Numbers`, and it cannot establish `Shipped`, which needs "since the last report". Set `Newest content` from a date column if one exists, otherwise from the file's `modifiedTime`.

Ignore empty rows and anything below the last populated row. Cap at a few hundred rows and set `Truncated` if you hit it.

### Transcripts

Meeting transcripts arrive as Google Docs, pasted as a link or found in the configured folder. Read via `gws`.

A transcript is mostly noise and the extraction problem is different: people speculate out loud. Separate what was decided from what was discussed. Attribute commitments to named people with dates. Every number gets `UNCONFIRMED`.

Transcripts carry the most personal data of any source, because people say things out loud that they would not write in a ticket. The scrub matters most here.

### Confluence pages

Read the page over the window. Useful for SteerCo notes and decision logs.

## When sources disagree

```
warehouse figure  >  Jira  >  deck  >  written Slack  >  transcript
```

A warehouse figure means a number someone took from a dashboard or a query. The higher-trust source wins the draft, and the conflict still goes to the author. Never resolve it silently.

A real example: one deck carried three different answers to "what did this save". An annual figure extrapolated globally, a smaller direct figure from an actual rollout, and a contact-rate change with no cost conversion. All three were correct for different scopes. The metric's declared source decides which one the report means.
