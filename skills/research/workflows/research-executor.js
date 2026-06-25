export const meta = {
  name: 'research-executor',
  description: 'Execute a research plan from research-planner: validate assumptions, run analysis phases, synthesize findings, write report',
  phases: [
    { title: 'Ingest & Validate', detail: 'Parse plan, validate executor_must_validate items' },
    { title: 'Gap Mapping', detail: 'Cohort split, CCR breakdown, temporal durability (metric gap only)' },
    { title: 'Analysis', detail: 'Execute plan phases sequentially, fresh context per phase, BQ data saved to disk' },
    { title: 'Synthesize', detail: 'Rank findings, resolve hypotheses, tag root causes' },
    { title: 'Report', detail: 'Write structured report reading phase detail files from disk' },
    { title: 'Format report', detail: 'Rewrite into hypothesis-first structure with plain-writing rules' }
  ]
}

const { planPath, topicFolder } = args

// Guard: fail fast with a clear message if called without required args
if (!planPath || !topicFolder) {
  log('Error: planPath and topicFolder are required. Pass them via args when invoking the workflow.')
  return { status: 'error', reason: 'Missing required args: planPath and/or topicFolder' }
}

const reportDir = `${topicFolder}/report`

const INGESTION_SCHEMA = {
  type: 'object',
  required: ['plan_id', 'goal', 'is_metric_gap_question', 'phases', 'assumptions', 'abort', 'reference_file_used'],
  properties: {
    plan_id: { type: 'string' },
    goal: { type: 'string' },
    domain: { type: 'string' },
    is_metric_gap_question: { type: 'boolean' },
    reference_file_used: { type: 'string' },
    phases: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          depends_on: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    assumptions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['assumption', 'verdict'],
        properties: {
          assumption: { type: 'string' },
          verdict: { type: 'string', enum: ['true', 'false', 'uncertain'] },
          how_checked: { type: 'string' }
        }
      }
    },
    abort: { type: 'boolean' },
    abort_reason: { type: 'string' }
  }
}

const OBSERVATION_SCHEMA = {
  type: 'object',
  required: ['phase_id', 'phase_name', 'observations', 'stop_condition_met', 'confidence'],
  properties: {
    phase_id: { type: 'string' },
    phase_name: { type: 'string' },
    observations: { type: 'string', description: 'Compact summary, max 300 words, numbers with bases' },
    stop_condition_met: { type: 'boolean' },
    confidence: { type: 'string', enum: ['H', 'M', 'L'] },
    failed: { type: 'boolean', default: false },
    failure_reason: { type: 'string' },
    deviations: { type: 'array', items: { type: 'string' } },
    follow_ups: { type: 'array', items: { type: 'string' } },
    files_written: {
      type: 'array',
      items: { type: 'string' },
      description: 'Absolute paths of all files written (sql, csv, detailed.md)'
    }
  }
}

const SYNTHESIS_SCHEMA = {
  type: 'object',
  required: ['key_findings', 'hypotheses', 'overall_status', 'deviations', 'impact_sizing'],
  properties: {
    key_findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['rank', 'headline', 'symptom', 'impact_eur', 'root_cause', 'root_cause_tag', 'confidence', 'evidence_phase'],
        properties: {
          rank: { type: 'integer' },
          headline: { type: 'string' },
          symptom: { type: 'string' },
          impact_eur: { type: 'string' },
          impact_formula: { type: 'string' },
          root_cause: { type: 'string' },
          root_cause_tag: { type: 'string', enum: ['Hard Technical Failure', 'Operational Bottleneck', 'Behavioral Hypothesis'] },
          confidence: { type: 'string', enum: ['H', 'M', 'L'] },
          evidence_phase: { type: 'string' }
        }
      }
    },
    hypotheses: {
      type: 'array',
      items: {
        type: 'object',
        required: ['hypothesis', 'verdict', 'reality'],
        properties: {
          hypothesis: { type: 'string' },
          verdict: { type: 'string', enum: ['Validated', 'Busted', 'Inconclusive'] },
          reality: { type: 'string' },
          evidence_phase: { type: 'string' }
        }
      }
    },
    overall_status: { type: 'string', enum: ['complete', 'partial', 'blocked'] },
    deviations: { type: 'array', items: { type: 'string' } },
    failed_phases: { type: 'array', items: { type: 'string' } },
    impact_sizing: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          finding: { type: 'string' },
          dimension: { type: 'string' },
          formula: { type: 'string' },
          inputs: { type: 'string' },
          conversion_factor_source: { type: 'string' },
          confidence: { type: 'string' }
        }
      }
    }
  }
}

// ─── Phase 1: Ingest & Validate ───────────────────────────────────────────────
phase('Ingest & Validate')

// Create report subdirectories upfront so phase agents can write immediately without checking
// (phases run independently and each assumes the dirs exist)
await agent(
  `Run this shell command: mkdir -p "${reportDir}/queries" "${reportDir}/data" "${reportDir}/phases" "${reportDir}/charts". Return "done".`,
  { label: 'mkdir-report-dirs', phase: 'Ingest & Validate', model: 'claude-haiku-4-5-20251001' }
)
const ingestion = await agent(`
  Ingest the research plan at ${planPath}.

  1. Read the plan file. Parse: plan_id, goal, domain, products, brands, time_window,
     executor_must_validate, and the phase list (id, name, depends_on if present).

  2. Select the BQ reference file based on domain. Rules:
     - HC contacts / FCR / wastage / CSAT / CFX / NFX → reference_bigquery_hc_contacts.md
     - CFX share / CFX rollout distribution → reference_bigquery_cfx_share.md
     - Experiments / A/B / Eppo → reference_bigquery_eppo_experiments.md
     - Broad / cross-domain / unknown → reference_bigquery_all_datasets.md
     Read ~/.claude/CLAUDE.md and ~/.claude/skills/data-analyst/schema_reference.md.
     Then read only the selected XP-specific reference file from ~/.claude/skills/xp-research/reference/.

  3. Determine: is this a metric gap question ("why is metric M worse in A vs B")?

  4. Validate each executor_must_validate item with the smallest possible query or lookup.
     If a critical assumption fails and invalidates the whole plan, set abort: true.

  Return structured output.
`, { label: 'ingest-validate', phase: 'Ingest & Validate', schema: INGESTION_SCHEMA, model: 'claude-haiku-4-5-20251001' })

if (ingestion.abort) {
  log(`Plan aborted: ${ingestion.abort_reason}`)
  return { status: 'aborted', reason: ingestion.abort_reason }
}

// ─── Phase 2: Gap Mapping (parallel, metric gap questions only) ────────────────
const allObservations = []
const allDeviations = []

if (ingestion.is_metric_gap_question) {
  phase('Gap Mapping')
  const gapPromptBase = `
    Plan: ${planPath}
    You are running one of three parallel gap-location mapping cuts.
    Save every query to ${reportDir}/queries/gap-<slug>.sql and results to ${reportDir}/data/gap-<slug>.csv.
    Write a rich observation narrative to ${reportDir}/phases/phase-gap-<slug>-detailed.md.
    Self-verify before returning: sanity-check all numbers (partition filter applied? join on unique key? counting users not events?).
    Structure the observations field exactly as:
      Answer: <one sentence — direct answer to this cut's question>
      Key observations:
      - <finding with base and n> [flag if anomalous]
      - <second finding>
      Context: <baseline for comparison>
      Total n: <sample size>
      Data period: <exact start and end dates>
      Data quality: <issues or "none">
  `
  const [cohort, ccr, temporal] = await parallel([
    () => agent(`${gapPromptBase}\nYour cut: COHORT SPLIT — compute metric separately for users who took each natural action (contacted vs not-contacted for HC research). Which cohort drives the gap?`, { label: 'gap-cohort', phase: 'Gap Mapping', schema: OBSERVATION_SCHEMA, model: 'claude-sonnet-4-6' }),
    () => agent(`${gapPromptBase}\nYour cut: CCR/LEAF BREAKDOWN — join experiment subjects to contacts, compute metric delta by CCR-L2. Which specific contact reasons account for the gap?`, { label: 'gap-ccr', phase: 'Gap Mapping', schema: OBSERVATION_SCHEMA, model: 'claude-sonnet-4-6' }),
    () => agent(`${gapPromptBase}\nYour cut: TEMPORAL DURABILITY — compute metric on rolling post-experiment cohort weekly. Does the gap persist or fade?`, { label: 'gap-temporal', phase: 'Gap Mapping', schema: OBSERVATION_SCHEMA, model: 'claude-sonnet-4-6' })
  ])

  for (const obs of [cohort, ccr, temporal].filter(Boolean)) {
    allObservations.push(obs)
    if (obs.deviations) allDeviations.push(...obs.deviations)
  }
  log(`Gap mapping complete: ${allObservations.length}/3 cuts succeeded`)
}

// ─── Phase 3: Analysis (sequential, fresh context per phase) ──────────────────
phase('Analysis')

for (const planPhase of ingestion.phases) {
  const priorContext = allObservations
    .map(o => `### ${o.phase_name}\n${o.observations}`)
    .join('\n\n')

  const obs = await agent(`
    Execute Phase ${planPhase.id} — "${planPhase.name}" — from the research plan at ${planPath}.

    Prior phase observations (compact summaries only — not raw data):
    ${priorContext || 'None yet.'}

    Instructions:
    - Run the queries described in the plan for this phase only.
    - For every query: save SQL to ${reportDir}/queries/phase-${planPhase.id}-<slug>.sql
      and save raw BQ results to ${reportDir}/data/phase-${planPhase.id}-<slug>.csv.
      These files are the permanent record — save them even if the finding is negative.
    - Write a rich observation narrative (numbers, bases, anatomy of drop-off if relevant,
      what was observed vs what it means) to ${reportDir}/phases/phase-${planPhase.id}-detailed.md.
    - Self-verify before returning observations:
      1. Contradiction check — does this finding contradict any prior phase observation above? If yes, run an ad-hoc query to resolve it first.
      2. Relevance check — does the result directly answer this phase's goal? If not, rerun with a better-scoped query.
      3. Sanity check — is the number plausible? Common failure modes: missing partition filter, join on non-unique key, counting events instead of users. Verify before reporting.
    - Structure the observations field exactly as:
        Answer: <one sentence — direct answer to this phase's goal>
        Key observations:
        - <finding with base and n> [flag if anomalous]
        - <second finding>
        Context: <baseline or distribution for comparison>
        Total n: <sample size>
        Data period: <exact start and end dates>
        Data quality: <issues or "none">
    - Check the stop condition from the plan. Log any deviations.
  `, { label: `phase-${planPhase.id}`, phase: 'Analysis', schema: OBSERVATION_SCHEMA, model: 'claude-sonnet-4-6' })

  if (obs === null) {
    log(`Phase ${planPhase.id} failed — continuing without its observations`)
    allDeviations.push(`Phase ${planPhase.id} (${planPhase.name}) failed: agent returned null`)
    allObservations.push({
      phase_id: planPhase.id,
      phase_name: planPhase.name,
      observations: 'Phase failed — no observations.',
      stop_condition_met: false,
      confidence: 'L',
      failed: true,
      failure_reason: 'Agent returned null',
      deviations: [],
      follow_ups: [],
      files_written: []
    })
  } else {
    allObservations.push(obs)
    if (obs.deviations) allDeviations.push(...obs.deviations)
    log(`Phase ${planPhase.id} done — stop condition: ${obs.stop_condition_met}, confidence: ${obs.confidence}`)
  }
}

// ─── Phase 4: Synthesize ───────────────────────────────────────────────────────
phase('Synthesize')
const compactContext = allObservations
  .map(o => `### ${o.phase_name}${o.failed ? ' [FAILED]' : ''}\n${o.observations}`)
  .join('\n\n')

const synthesis = await agent(`
  Synthesize findings from a multi-phase research analysis.

  Plan: ${planPath}
  Failed phases: ${allObservations.filter(o => o.failed).map(o => o.phase_name).join(', ') || 'None'}
  Accumulated deviations: ${allDeviations.join('\n') || 'None'}

  Phase observations (compact summaries):
  ${compactContext}

  1. Resolve all hypotheses from the plan: Validated / Busted / Inconclusive.
  2. Rank 3–5 key findings by € impact × confidence.
  3. Tag each root cause: [Hard Technical Failure] / [Operational Bottleneck] / [Behavioral Hypothesis].
  4. Build impact sizing table (formula, inputs, conversion factor source, confidence).
  5. Set overall_status: complete (all phases ran) / partial (some failed) / blocked.
`, { label: 'synthesize', phase: 'Synthesize', schema: SYNTHESIS_SCHEMA, model: 'claude-sonnet-4-6' })

// ─── Phase 5: Report ──────────────────────────────────────────────────────────
phase('Report')
await agent(`
  Write the research report.

  Plan: ${planPath}
  Report directory: ${reportDir}
  Synthesis JSON: ${JSON.stringify(synthesis)}

  Phase detail files (read these for Section E — Detailed findings):
  ${allObservations.filter(o => !o.failed).map(o => `${reportDir}/phases/phase-${o.phase_id}-detailed.md`).join('\n')}

  Raw data backup files for reference (do not re-query — data is already on disk):
  ${allObservations.flatMap(o => o.files_written || []).filter(f => f.endsWith('.csv')).join('\n')}

  Instructions:
  - Follow the full report schema, chart generation rules, and self-review checklist.
  - For Section E: read each phase-<id>-detailed.md file and use it as the basis.
  - For charts: use the existing CSVs in ${reportDir}/data/ — do not re-run BQ queries.
    Render charts with ~/.claude/lib/render_chart.py via the chart venv.
  - Update plan frontmatter status to done when finished.
`, { label: 'write-report', phase: 'Report', agentType: 'research-executor', model: 'claude-sonnet-4-6' })

// ─── Phase 6: Format report ───────────────────────────────────────────────────
const PLAIN_WRITING = `PLAIN WRITING RULES (mandatory — apply to every sentence you write):
- No em-dashes. Rewrite the sentence.
- No semicolons. Use a full stop or restructure.
- No "not only X but also Y" constructions.
- No filler: "it's worth noting", "furthermore", "in conclusion".
- No corporate words: leverage, utilize, robust, seamless, comprehensive, holistic.
- Active voice. Short words. Front-load: key point first in every paragraph.
- Vary sentence length. Long sentence sets context, short one lands the point.
- Use prose, not bullets, unless the content is genuinely a list.
- Concrete over abstract: name the metric, give the number, name the product.`

const REPORT_TEMPLATE = `REPORT STRUCTURE (follow this order exactly):
1. Header block: experiment or research name, Eppo ID if applicable, data window, report date
2. ## Summary — 3 bullet points max. Each is one sentence. What was found, what it means, what to do. No hedging.
3. ## What we were investigating — 2–3 sentences on the business question and why it matters.
4. ## Hypotheses — table with columns: ID | Hypothesis | Verdict. One row per hypothesis. Verdicts: Confirmed / Refuted / Inconclusive.
5. ## Effect size (if applicable) — key quantitative estimate, confidence interval. Keep all numbers.
6. ## Findings — one subsection per hypothesis (### H1 through ### Hn). State the hypothesis in plain language first. Then what the data showed. Keep all numbers.
7. ## Sizing — ranked mechanism or finding table (keep all numbers), then 2–3 sentences of prose on total recoverable GMV or cost.
8. ## What this analysis cannot answer — bullet list of genuine open questions only.
9. ## Recommended fixes — numbered list, ranked by expected impact. One paragraph per fix.`

phase('Format report')
await agent(
  `Read the file at ${reportDir}/report.md. Rewrite it into a cleaner structure, then write it back to the same path using the Write tool.\n\n${PLAIN_WRITING}\n\n${REPORT_TEMPLATE}\n\nDo not add findings that are not in the source material. Do not remove any findings or numbers. Preserve all tables with their data. Write the file and return nothing else.`,
  { label: 'format-report', phase: 'Format report' }
)

return { status: synthesis.overall_status, planId: ingestion.plan_id, reportDir }
