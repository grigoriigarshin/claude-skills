# DH Claude Skills

Shared Claude Code skills for Delivery Hero colleagues.

## Install a skill

```bash
bash <(gh api repos/grigoriigarshin/claude-skills/contents/install.sh -H "Accept: application/vnd.github.raw") research
```

Replace `research` with the name of the skill you want.

**To update:** re-run the same command. It overwrites the existing install.

## Available skills

| Skill | Description | Extra setup |
|---|---|---|
| `presentations` | Create slide decks in the Service XP dark design language | Requires `npm` (installs Puppeteer for QA screenshots, ~150 MB) |
| `research` | Research workflow for XP PMs: `/research-planner` -> executor -> `/audit` | Requires BigQuery + Atlassian MCP; access to `deliveryhero/data-platform-product` |

## Prerequisites

- `gh` CLI authenticated with your corporate GitHub account. Check with: `gh auth status`
- `npm` for the `presentations` skill
- BigQuery and Atlassian MCP configured in Claude Code for the `research` skill

---

## Research workflow

The research skill is a three-stage pipeline that turns a product question into a structured, evidence-based report. Each stage runs as a separate Claude Code component. You trigger the first one; it chains the rest automatically.

### How it works

```
/research-planner  -->  research-executor (workflow)  -->  /audit
   (you start here)        (runs automatically)          (you run manually)
```

**Stage 1: Planning** (`/research-planner` skill). You describe a product question: a metric drop, a user behavior pattern, an opportunity to size. The planner asks 3-4 rounds of clarifying questions, reads your BigQuery schema references, then writes a phased plan to disk. The plan follows an issue-tree structure that moves from top-level pattern confirmation through decomposition, root-cause drilling, causal validation, and mandatory impact sizing in euros (GMV or cost reduction). Once the plan is written, the planner launches the executor automatically.

**Stage 2: Execution** (`research-executor` workflow). A multi-agent workflow that reads the plan and runs it. It works in six phases:

1. **Ingest and validate.** Parses the plan, checks that referenced tables exist, validates assumptions the planner flagged.
2. **Gap mapping.** For metric-gap questions (A vs B comparisons), decomposes the gap by user cohort, contact reason, and time window before investigating mechanisms. This prevents anchoring on a plausible-but-partial explanation.
3. **Analysis.** Executes each plan phase sequentially. Each phase gets its own agent with fresh context. All BigQuery results are saved to CSV files on disk so later phases can reference them without re-querying.
4. **Synthesize.** Ranks findings across phases, resolves hypotheses as validated/busted/inconclusive, and tags each root cause as Hard Technical Failure, Operational Bottleneck, or Behavioral Hypothesis.
5. **Report.** Writes the structured report from phase detail files and CSVs. Generates charts from existing data (does not re-query BigQuery).
6. **Format report.** Rewrites the report into a hypothesis-first structure and applies plain-writing rules: no em-dashes, no corporate jargon, active voice, short sentences, concrete numbers with their base.

Every finding in the report traces back to a specific query result. The executor does not propose solutions or action plans. It identifies problems, sizes their euro impact, and tags their root cause type. What to do about them is the PM's call.

**Stage 3: Audit** (`/audit` skill, run manually). You point it at the finished report and it runs eight structured lenses: framing, assumption extraction, structural coherence, causal chain validation, gap detection, product reality grounding, visualisation honesty, and stakeholder relevance. The auditor resolves what it can directly (targeted BQ queries, Confluence lookups) and produces two files: `audit.md` with findings ranked by severity, and a revised version of the report with fixes applied.

### What gets installed

The `research` install puts files in four places:

| Component | Installed to | Type |
|---|---|---|
| `/research-planner` | `~/.claude/skills/research-planner/skill.md` | Skill (you invoke it) |
| `/audit` | `~/.claude/skills/audit/skill.md` | Skill (you invoke it) |
| `research-executor` | `~/.claude/workflows/research-executor.js` | Workflow (launched by planner) |
| `research-executor` | `~/.claude/agents/research-executor.md` | Agent definition |
| `research-auditor` | `~/.claude/agents/research-auditor.md` | Agent definition |
| BQ reference files | `~/.claude/skills/xp-research/reference/` | Context files |
| DH schema reference | `~/.claude/skills/data-analyst/schema_reference.md` | Context file (fetched from DH repo) |

### Quick start

1. Install: `bash <(gh api repos/grigoriigarshin/claude-skills/contents/install.sh -H "Accept: application/vnd.github.raw") research`
2. Open Claude Code and type `/research-planner`
3. Describe your question. The planner will ask clarifying questions, then write a plan and launch the executor.
4. Watch progress with `/workflows`. The executor typically runs 10-30 minutes depending on the number of plan phases.
5. When the report is ready, review it. If you want a structured challenge before sharing with stakeholders, run `/audit <path-to-report.md>`.

### Requirements

- **BigQuery MCP** configured in Claude Code (the executor runs SQL queries against `fulfillment-dwh-production`)
- **Atlassian MCP** configured (the executor and auditor look up Confluence pages and Jira tickets for context)
- Access to `deliveryhero/data-platform-product` repo (the installer fetches a schema reference file from there)
- Slack MCP is optional but useful. The executor can search Slack for context if configured.
- Grafana MCP (dp-devinfra) is optional. Used for log and metric queries when the research involves system performance.

### Output structure

Each research run creates a folder:

```
research/YYYY-MM-DD-<topic>/
  plan.md              <-- written by planner
  report/
    report.md          <-- primary deliverable
    charts/            <-- rendered PNGs + Vega-Lite specs
    data/              <-- per-chart CSVs
    queries/           <-- per-chart SQL
  audit.md             <-- written by /audit (if you run it)
```

---

## Adding a new skill (for maintainers)

1. Create `skills/<skill-name>/` with supporting files
2. If the skill needs post-install distribution (files go to agents/, workflows/, etc.), add an `install-hook.sh`
3. Add a row to the table above
4. The install script picks it up automatically
