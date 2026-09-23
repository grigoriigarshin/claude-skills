# Confluence

Everything about finding, reading and publishing pages. Uses the Atlassian MCP.

## The tree

```
<reporting root>                  ← URL from ~/.claude/xp-reporting/config.json
├── CFX                           ← project parent: description + config
│   ├── CFX Metrics               ← metric definitions, outside the year folders
│   ├── CFX 2026                  ← year folder
│   │   ├── CFX 2026-09-15
│   │   └── CFX 2026-09-23        ← reports
│   └── CFX 2025
└── Inbox
```

**Every page title carries the project name.** Confluence enforces unique titles within a space, so a report called `2026-09-23` or a folder called `2026` can exist only once across the whole space. Without the prefix the second project to publish on any date simply cannot, and the design breaks on project number two.

**Under a year folder, every child is titled `<Project> YYYY-MM-DD` and nothing else.** The monthly roll-up picks the most recent child by the date in its title, so a stray "Archive" or "Notes" page breaks its selection. Anything that is not a report goes under the project parent.

## The config contract

A table on the project parent page, inside a collapsed expand so a human reading the page sees the description first. Every field optional except `Squad`.

| Field | Used for |
|---|---|
| Owner | Report header. Always the config owner, never whoever ran the skill. |
| Squad | Report header, metadata token |
| Lifecycle | `Active` / `Paused` / `Done`. Warn before reporting on a Done project. |
| Cadence | Period label and gather window |
| Slack channels | Gatherer targets |
| Jira filter | JQL, or a resolvable pattern such as `parent in (epics matching "<keyword>")` |
| Decks | A Slides link, or a Drive folder meaning the most recently modified deck |
| Meeting notes | Drive folder |
| Dashboards | Shown to the author when asking for numbers |
| Key metrics | Link to the `<Project> Metrics` page |
| Extra sections | Appended between Metrics and Risks and blockers |
| Context only | Sources read but never quoted. See below. |

**Read the config, do not parse it.** Fetch the page as markdown and read the fields out of it. No XHTML parser, no fixed columns. Confluence's editor will eventually mangle that table, and a model reading a slightly broken table still gets the channels out of it. Unknown fields are ignored, one warning for anything unreadable, and a half-filled config still produces a report.

**`Context only` sources are read and never quoted.** A PMO or coordination channel often holds the clearest picture of a project alongside things that should not appear on a page the whole product line reads. Nothing from them enters the draft, and they are left out of the source footer, because naming a private channel reveals it exists. Tell the author in chat what was found there and let them decide what to say in their own words. This is a prompt-level control, not a mechanical one: a source that must never leak should not be configured at all.

## The Metrics page

`<Project> Metrics`, a direct child of the project parent, outside any year folder. One block per metric:

```
Name:   CFX share, global
Unit:   % of Customer HC users
Target: 60% by end of Q3
Source: SQL
        SELECT ... FROM `project.dataset.table` ...
```

`Source` is a SQL query, a dashboard link, or `author-supplied`. A dashboard link means the author reads the number off and you ask for it. Run the SQL if the person has warehouse access, otherwise fall back to asking.

**The query is the definition.** A metric name alone is ambiguous in a way that produces wrong numbers: "self-service CSAT" computed one way is `2.69` and another way is `+46.5%`, and both are defensible. The same applies to deck sources, which is why a deck source names the slide and not just the file.

## Authoring HTML

**Call `getContentFormatGuide` before writing any page body.** The accepted patterns are narrower than general HTML, and anything unsupported is dropped or escaped rather than rejected.

**Never write Confluence storage XML.** `<ac:structured-macro>`, `<ac:rich-text-body>`, `<ac:plain-text-body>` and `<ri:page>` all render as literal visible text through this API. Confluence converts documented HTML into storage format itself.

| You write | Confluence renders |
|---|---|
| `<span data-type="status" data-color="green">On track</span>` | a status lozenge |
| `<details><summary>T</summary>…</details>` | an expand macro |
| `<pre><code>…</code></pre>` | a code macro |
| `<time datetime="2026-09-15">` | a date lozenge, its text discarded |
| `<div data-type="panel-note">` | a note panel |

Lozenge colours are `neutral`, `purple`, `blue`, `red`, `yellow`, `green`. Grey is written as `neutral`.

**Pass raw HTML, never HTML-escaped entities.** Escaped markup publishes as visible text on the page.

## Publishing

1. Write the local cache first, so an approved draft survives a failed publish
2. Create the year folder if this is the first report of the year
3. Create the page titled `<Project> YYYY-MM-DD`
4. Set a `versionMessage` on updates, as a secondary marker
5. Update the cached copy

If a create is rejected because the title already exists, somebody published this project and date first. Re-read that page and fall through to the update path below.

## Human edits always win

A published report is a normal page. People edit it directly, and more than one person may. **Anything a human changed is never overwritten.**

The author who fixes a number in Confluence rather than asking the skill is behaving reasonably, and a tool that silently reverts that edit is a tool nobody trusts twice.

**Detection.** The metadata block carries `xpr-hash`, a hash of the body as published. Before touching a page, fetch it, recompute the hash of the current body excluding the block, and compare. A mismatch means a human has been there.

The marker lives in the page rather than in the local cache, because the cache is per person. One teammate publishes, another reruns, and their machine has no record of what the first one wrote.

**It always fails toward not touching.** A missing block, an unreadable hash, a block someone deleted while editing, a page you cannot match to your own output: every one is treated as human-edited. The worst case is one unnecessary extra page. The alternative failure, silently overwriting someone's work, is the one that ends the tool.

**On a mismatch, stop and offer three options. Never pick one.**

| Option | Result |
|---|---|
| Leave it alone (default) | Nothing touched. Hand over the markdown. |
| New page | Publish as a new dated report, the edited one untouched |
| Overwrite | Only on an explicit instruction, and name what will be lost first |

**Edited reports feed forward.** Continuity reads the live page, not the cache, so a human correction becomes the baseline the next report compares against. Someone fixing a number by hand improves every report after it. The cache is a fallback for when Confluence is unreachable, never the preferred source.

This also settles two people running at once: the second finds a body it did not write, treats it as edited, and asks.

## Local cache

```
~/.claude/xp-reporting/
├── config.json                 rootPageUrl, cloudId
├── aliases.json                confirmed name to page ID
├── projects/<slug>/
│   ├── config.md               last successful config read
│   ├── last-report.md          last published report
│   └── meta.json               page IDs, timestamps, metric set, last report date
└── drafts/<slug>-<date>.md     written before publish, kept 30 days
```

A mirror, never a source of truth. Deleting it costs one round trip.

## Finding things later

The metadata block's tokens are searchable by CQL text search:

```
text ~ "xpr-delivery-off-track" AND lastmodified >= now("-30d")
text ~ "xpr-has-decisions"
```

Confluence page labels would be the natural home for this, and the Atlassian MCP exposes no tool that writes them, nor any that writes content properties. The token block is the workaround, not a preference.
