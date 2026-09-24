# report — project status reports

Writes a project status report from your Slack channels, Jira, decks, meeting notes and anything you paste, then publishes it to a shared Confluence tree.

```bash
bash <(gh api repos/grigoriigarshin/claude-skills/contents/install.sh -H "Accept: application/vnd.github.raw") report
```

**Current version: 0.5.1.** Check yours with `head -12 ~/.claude/skills/report/SKILL.md`.

## Update

Re-run the install command. It replaces the skill folder and leaves your cached config in `~/.claude/xp-reporting/` alone, so you do not redo setup. Start a new Claude Code session afterwards, because a running one has already loaded the old copy.

## Before you start

**Required**

- Claude Code with the **Atlassian MCP** connected. Without it there is no project to resolve, no config to read and nothing to publish. `/report <project> --quick` still works and hands you markdown.
- Permission to create child pages in the Confluence space holding the reporting tree. Check with whoever owns the space.
- Nothing else. The skill already knows the [Service reporting root](https://atlassian.cloud.deliveryhero.group/wiki/spaces/GCC/pages/2223505420/Service+Reporting) and caches it on first run.

**Optional, and each one makes the report better**

- Slack MCP, for channel gathering. This is usually where most of the value is.
- `gws` CLI, for anything in Google Workspace: Docs, Sheets, Slides, Drive folders, Tasks. `brew install googleworkspace-cli` plus gcloud ADC.
- BigQuery, if any of your metrics are defined as a SQL query. Metrics are defined on their own page, separately from your sources, and each one can be a query, a dashboard you read off, or a number you supply.

The skill degrades rather than failing. A missing source is skipped and named.

## Set a project up

```
/report new
```

It searches Slack and Drive for anything matching the project name, shows you what it found, and asks two rounds of questions: the basics and your sources, then your metrics. Everything else takes a default.

**It does not assume your work is in Jira.** Setup asks one direct question: which sources should I read? Channels, a spreadsheet, a doc, a task list, a deck, all of them. It works out what each one is and reads what it can. Anything it cannot read, such as a dashboard or a Figma file, it shows you to fill in yourself rather than dropping.

It will ask for **one Jira ticket or epic** rather than searching Jira itself. Jira full-text search is unusable for this, because searching a project name returns tickets from a dozen unrelated projects.

For metrics it asks for a **source**, not just a name. That matters more than it sounds: "self-service CSAT" can mean an absolute average or an uplift against control, which are completely different numbers, and a skill given only the name will pick one and publish it with confidence.

It finishes by generating a real report.

## Write a report

```
/report cfx
```

The skill reads your configured sources in parallel, asks up to four questions about anything genuinely missing, drafts, and shows it to you.

**Every question has a safe default.** Ignore the whole thing and you still get a correct report, just a sparser one.

If the project is not yours, it checks once before starting: *"CFX is owned by Junyu Pu. Reporting on his behalf?"* Anyone can report on any project, and covering for someone on holiday is normal. Doing it by accident because you picked the wrong name off a list is not. The report still shows the owner in its header, and records who generated it.

At review, three things need you:

- **Status.** It proposes Delivery and Impact with one line of reasoning. You confirm or override. It never publishes a status nobody looked at.
- **Numbers.** Only the risky ones need a click: new metrics, anything from a deck or Slack, anything that moved a lot.
- **Anything it left out**, told to you in chat and never written into the report.

Correcting something patches that section only. It does not redraft everything else behind your back.

## Several projects at once

```
/report all
```

Takes every project you own that is due, gathers for all of them in one go, then walks you through them one at a time.

The saving is in the gathering, which is the slow part and runs in parallel. Approval is not batched: each report still gets your confirmation on status and on anything risky, because a batch you clicked through is not a batch you checked.

It tells you what is coming and leads with whatever needs you most. `/report all --any` ignores the due dates, and `/report all cfx inbox` takes exactly those two.

## The shape

Fixed section order, and any section with nothing in it is deleted rather than left empty.

```
Status              always
Shipped             one sentence, what went live
Metrics             table
[your extras]       Rollout, Findings, whatever this project declared
Risks and blockers
Decisions needed
Up next
```

A rollout project and a discovery project produce reports that look nothing alike, without either author filling in anything irrelevant.

The order **within** a section is not fixed. The skill ranks items and leads with what matters most, which is the judgement a report exists to carry.

## Things worth knowing

**Your edits win.** Once published, if you fix something on the page by hand, the skill never overwrites it. Next period's report compares against your corrected version, so fixing a number by hand improves every report after it.

**It will not fake freshness.** If your sources have nothing new, facts carry their date ("share was 21% as of Sep 5") and a quiet period still gets a report saying nothing moved.

**It reports what is there, never what is missing.** No "N/A", no "owner not stated", no empty headings.

**It will not invent.** If no source names an owner for a blocker, the report leaves the owner out rather than guessing plausibly.

**Personal data never reaches the report.** Customer names, order IDs and phone numbers are stripped at the point each source is read, not at the end.

## Who this is for

The gain comes from gathering, so it scales with how scattered your project's information is. A rollout across many entities with five sources is the strong case.

A single-squad track with one weekly meeting is not. Nothing gathers, you already know everything, and the tool is a questionnaire. Use `--quick` for those, or write it by hand.
