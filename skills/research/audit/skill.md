# Research Report Auditor

## What this skill does

Spawns the `research-auditor` agent to audit a research report produced by `research-executor`. The auditor runs 8 structured lenses, directly resolves what it can (via targeted BQ queries and Confluence lookups), and produces a structured audit report plus a revised version of the input report.

## Arguments

`[report_path]`

Absolute path to the report file to audit. Example:
```
/audit /Users/grigorii.garshin/Documents/AI tools/AI Product/research/2026-05-05-cfx-csat-drivers/report-v2.md
```

If no path is provided, ask the user for it before proceeding.

---

## How to invoke

When this skill is loaded, spawn the `research-auditor` agent with the report path:

```
Agent(
  subagent_type: "research-auditor",
  description: "Audit research report",
  prompt: "Audit the report at: <report_path>. Run all 8 lenses, resolve direct fixes and targeted queries yourself, and produce audit.md in the same folder. Brief research-executor for any findings that require a full investigation. Writing style: plain English only — short words, short sentences, active voice, no corporate jargon (no leverage / strengthen / unlock / empower / drive / enable / robust / holistic / seamless / optimise / streamline / surface-as-verb), no filler, define internal acronyms (CFX, NFX, FCR, CCR) on first use, sentence case for headings, no emojis. Apply this to audit.md AND to any edits made to the report file."
)
```

## Writing style — plain English (mandatory)

Every artefact this skill produces (audit report, edits to the report file, chat summary back to the user) must be in **plain English**:

- English only, even if the user writes in Russian
- Short words, short sentences, active voice, sentence case
- No corporate verbs: leverage, strengthen, unlock, empower, drive, enable, robust, holistic, seamless, optimise, streamline, surface (as verb)
- No filler ("in order to" → "to"; "due to the fact that" → "because")
- Concrete over abstract — every number with its base ("12% of 6.6M monthly contacts (≈790K)")
- Define internal acronyms (CFX, NFX, FCR, CCR, e2e) on first use
- No emojis unless explicitly requested

The same rule lives in user memory at `feedback_language.md`. The spawned `research-auditor` agent has the same rule in its system prompt — but always pass it through in the agent prompt as well, in case the agent file is updated separately.

Wait for the agent to complete, then present the user with:

1. A summary of findings: N critical / N major / N minor / N resolved / N research briefs
2. The list of CRITICAL and MAJOR findings with one-line descriptions
3. The list of research briefs (if any), with a one-line description of what each would investigate
4. Paths to `audit.md` and the revised report

---

## The 8 audit lenses (for user awareness)

| # | Lens | What it catches |
|---|---|---|
| 1 | Framing auditor | Technical labels on product problems; API "errors" that are actually business decisions |
| 2 | Assumption extractor | Implicit defaults in sizing; missing inline sources; undocumented conversion factors |
| 3 | Structural coherence | Patterns not connected to sizing; recommendations without cited findings |
| 4 | Causal chain validator | Correlation presented as causation; endogenous variables in regressions |
| 5 | Gap detector | Anomalies without explanation; high-stakes open questions not listed |
| 6 | Product reality grounding | Conclusions based on event names only vs. what users actually see; checks `cfx_events.property` message content and API payloads against report claims |
| 7 | Visualisation honesty | Truncated y-axes, missing sample sizes, wrong chart types, mermaid funnel arithmetic errors, orphan PNGs without spec/CSV/SQL on disk |
| 8 | Stakeholder relevance | Missing owners; sizing gaps; recommendations too vague to act on |

Lens 6 (Product reality grounding) is the most powerful for CFX analysis — it catches cases where aggregate metrics imply one user journey but the actual bot messages and API payloads show something completely different.

---

## When to use this skill

- After `research-executor` produces a report — before sharing it with stakeholders
- When a report has been written and you want a structured challenge before acting on its recommendations
- When findings feel surprising or counterintuitive and you want to verify the evidential basis

## When NOT to use this skill

- On raw data exports or exploratory analysis (not a report yet) — use `/data-analyst` instead
- On documents that aren't research reports (PRDs, specs, tickets) — use `/cpo` or `/refine`
