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

## 3. Two rounds, never thirteen questions

The config has thirteen fields. Asked one at a time they are a wall, and setup is the worst place to lose someone because nothing has been produced yet.

**Round one.** Owner and squad. Cadence. Which of the discovered sources, plus anything missed. A Jira epic or filter, or skip.

Ask for sources in a way that does not assume Jira. Not everyone tracks work there: design and ops frequently live in a Google Sheet, and a person whose work is not in Jira will read a Jira-shaped question as "this tool is not for me". Ask what they would point someone at to see the state of the work, and take whatever comes.

**Round two.** Metrics, each with its unit, target and source.

Everything else defaults and is never asked: `Lifecycle` is Active, `Extra sections` and `Context only` are empty, `Dashboards` and `Description` are blank. All of them are edited on the page later by anyone.

Metrics get their own round because each needs a query or a source, which is real thought. Mixed into a list of quick facts they get answered carelessly, and a vague metric definition is how a report ends up publishing the wrong number confidently.

## 4. Create the pages

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
