# /report new

Sets a project up, then runs a real report against it. It does not stop at creating a page: a first report with no previous period and no configured sources is the tool at its least impressive, at exactly the moment someone decides whether to come back.

## 1. Check nothing like it exists

Near-match the name against the root page's existing children before creating anything. A project that was renamed will not match its old name, and creating a second page splits its reports and its history. Show the near-matches and ask.

## 2. Discover before asking

Search for the project's sources first, then ask the person to pick rather than recall. This turns "list your Slack channels" into "one clear match and two maybes, which do you want". It also surfaces sources a new owner does not know exist.

Discovery works for some source types and actively misleads for others.

| Source | Method | What to expect |
|---|---|---|
| **Slack** | Search channel names for the project name | Works well. One real project returned 14 channels and the author picked seven plus one as `Context only`. Another returned one obvious match, two maybes and ten incident channels. Channel names are deliberate, which is why this works. |
| **Drive: decks, docs and sheets** | `gws drive files list` with `name contains "<project>"` | Works. Returns decks, PRDs, tracking sheets and any stale copies, with `modifiedTime` to rank them. Check `mimeType`, because a spreadsheet and a deck are read differently. |
| **Confluence** | Near-match existing project pages | Works, and it is what stops step 1 creating a duplicate |
| **Jira** | **Do not search** | Fails badly. A text search for one project name returned tickets from twelve unrelated projects. Another returned fifteen results with none relevant, because the word appears in any ticket mentioning an email inbox. A project-name search returned nothing at all. |

**For Jira, ask for one ticket.** Given a single epic or issue you can find the rest and, more usefully, generalise. In testing one epic key led to two sibling epics from earlier iterations, and to the discovery that the Jira project covered the whole platform rather than this one initiative.

Store the rule, not the keys:

```
project = PLAT AND parent in (epics matching "Inbox")
```

resolved at each run, so a new iteration epic is picked up the day it is created. A literal list of epic keys is accurate the morning you write it and silently empty a quarter later.

**Never auto-select.** Discovery proposes, the person confirms. Present the clear match and the maybes separately, say what you discarded as noise, and never widen the search to fill a gap. A source nobody chose is worse than a missing one, because it shapes reports quietly and nobody traces back to it.

## 3. Two rounds, not a form

Asked one field at a time the config is a wall, and setup is the worst place to lose someone because nothing has been produced yet.

**Round one: where it goes, owner and squad, cadence, and sources.**

Ask the destination first, because it changes what gets created:

> Should reports go to the shared Confluence tree, where the product line and the monthly roll-up can read them, or stay as files on your machine?

Do not probe for Confluence permissions to decide this. Someone may have the rights and still want to keep a project local, and someone without them should hear a question rather than an error.

Ask for sources as **one direct question**:

> **Which sources should I read?** I found [what discovery turned up]. Add anything else: a spreadsheet, a doc, a task list, a board, a dashboard, anything you would open to check on this.

Direct, and it names no specific tool. Both halves matter. "What would you point someone at to see the state of this work" is a question about how somebody thinks rather than a request for input, and people answer it slowly and badly. Asking separately about Jira, Slack and decks is worse: it tells a person whose work is in none of them that the tool is not for them, which is exactly what happened the first time a designer tried it.

Generic categories are fine and help someone who does not know what counts. Named products are not, because each one implies a way of working that excludes somebody.

Lead with what discovery already found, so the question is a confirmation rather than a memory test.

**If one of their sources turns out to be Jira**, and only then, ask for a single epic or ticket rather than a filter. You can generalise from one key, and the durable filter comes out of that. Never make Jira a standing question.

**Round two: metrics.** Each needs a name, a unit, a target and a source, where the source is a query, a dashboard they read off, or a number they supply.

**Ask for the target, never infer it.** A number in a deck is a forecast somebody wrote down, not a commitment, and turning it into a target invents an agreement nobody made. "No target yet" is a fine answer and the column simply will not appear.

Metrics get their own round because each one is real thought. Mixed into a list of quick facts they get answered carelessly, and a vague metric definition is how a report publishes the wrong number confidently.

**Everything else defaults and is never asked.** `Lifecycle` is Active, `Extra sections` and `Context only` are empty, `Description` is blank. All of them are edited on the page later by anyone.

## 4. Create what the destination needs

**Local:** write `~/.claude/xp-reporting/projects/<slug>/config.md` and nothing else. Say where it is.

**Shared:**

```
<Project>                    description, then config table in a collapsed expand
├── <Project> Metrics        one block per metric
└── <Project> 2026           year folder
```

Put the description first and the config inside the expand. A stakeholder opening the project page wants the project, not its JQL.

State the title rule on the parent page, so the next person does not break the roll-up by adding an undated child to a year folder.

## 5. Run a real report

Immediately, against the sources just configured. No `vs last` column, because there is no previous report. Nothing is reported as omitted, because there is no baseline to compare against.

## What to say about what this is for

The gain comes from gathering, so it scales with how scattered a project's information is and how little of it the author already holds in their head. A rollout across eight entities with five sources is the strong case.

A single-squad discovery track with one weekly meeting is not: nothing gathers, the author knows everything already, and the tool becomes a questionnaire. Say so rather than letting someone find out. One polite attempt and a person who now believes the tool is useless costs more than never asking them.
