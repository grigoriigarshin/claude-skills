---
name: bigquery-eppo-experiments-per-user-assignment-per-metric-subject-results
description: "How to find the users assigned to each variant of any DH Eppo A/B test, plus how to read Eppo's exact per-user metric values. Use this whenever the task is to validate, reproduce, or segment-cut an Eppo experiment."
metadata: 
  node_type: memory
  type: reference
  originSessionId: dc64dcca-4c0a-4c57-9c54-e8a53dacd3a3
---

# BigQuery — analysing any Eppo A/B test

DH runs A/B tests through FwF (assignment) + Eppo (analysis). For any experiment with an Eppo ID (e.g. `eppo.cloud/experiments/153173`), BigQuery has the per-user assignment data Eppo used and the per-user metric values Eppo computed. Use these directly instead of rebuilding from session tables — much cleaner and matches Eppo's published numbers exactly.

## Step 1 — Look up the experiment

`fulfillment-dwh-production.curated_data_shared_experimentation.experiment_metadata` — one row per experiment with metadata.

Key fields: `eppo_id`, `eppo_experiment_name`, `eppo_assignments_start_date`, `eppo_assignments_end_date`, `eppo_total_assignments`, `eppo_status`, `eppo_results_url`, `eppo_variants` (RECORD with `variant_key`, `assignment_count`, `metrics`), `eppo_primary_metric_name`, `eppo_traffic_allocation`, `experiment_key` (FwF key — often NULL for HC experiments).

```sql
SELECT eppo_id, eppo_experiment_name, eppo_assignments_start_date, eppo_assignments_end_date,
       eppo_total_assignments, eppo_status, eppo_primary_metric_name
FROM `fulfillment-dwh-production.curated_data_shared_experimentation.experiment_metadata`
WHERE eppo_id = <EPPO_ID>
QUALIFY ROW_NUMBER() OVER (PARTITION BY eppo_id ORDER BY partition_date DESC) = 1
```

## Step 2 — Per-user variant assignment (the canonical source)

`logistics-data-storage-staging.eppo_output.g_view_assignments_experiment_<EPPO_ID>` — Eppo's actual assignment view for any experiment. Always present, always accessible.

Schema: `subject` (STRING — see "Subject format" below), `timestamp` (TIMESTAMP — first assignment time), `variant` (STRING — the variant key).

```sql
SELECT variant, COUNT(DISTINCT subject) AS users
FROM `logistics-data-storage-staging.eppo_output.g_view_assignments_experiment_153173`
GROUP BY variant
```

**Sister tables** in the same dataset, all keyed by `_experiment_<EPPO_ID>`:
- `g_view_daily_subject_result_experiment_<ID>_metric_<METRIC_ID>` — **per-user metric value** Eppo used (saves rebuilding the metric)
- `g_view_daily_aggregated_results_experiment_<ID>_metric_<METRIC_ID>` — daily aggregated rollup
- `g_inc_assignment_source__assn_<N>_experiment_<ID>` — incremental assignment source for that experiment
- `g_inc_experiment_metric_estimates_experiment_<ID>` — Eppo's metric estimates with CIs

To find which `metric_<ID>` is which metric, cross-reference with `experiment_metadata.eppo_variants[].metrics[].metric_name` for that experiment.

## Step 3 — Subject format (how to join to other tables)

`subject` is built by the experiment's assignment SQL, so the format varies. Check `eppo_assignments_global` for the definition:

```sql
SELECT id, name, project, sql, entity_join_column_name, experiment_key_column
FROM `fulfillment-dwh-production.curated_data_shared_experimentation.eppo_assignments_global`
WHERE LOWER(name) LIKE '%<keyword>%'
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY partition_date DESC) = 1
```

Common subject formats observed:
- **Help Center / Service experiments**: `<customer_id><global_entity_id>` (e.g. `5074509HS_SA`). Strip the trailing entity ID with `REGEXP_REPLACE(subject, r'<ENTITY>$', '')` to recover `customer_id` for joining to `orders`.
- **QC / Consumer experiments**: often `pseudo_user_id` directly, or `client_id`, or a custom session-derived key.
- **Vendor Growth**: `<entity_id>_<vendor_code>` (vendor experiments, not user).

Always check the SQL definition before assuming — getting the join wrong silently corrupts the analysis.

## Step 4 — Alternative sources (when `g_view_assignments_*` doesn't exist or you need raw evaluation events)

**FwF SDK assignment events** — `fulfillment-dwh-production.curated_data_shared_experimentation.experiment_assignment_<brand>` (e.g. `experiment_assignment_hungerstation`, `_global`, `_global_service_experiments`).

Schema: `experimentId` (FwF key), `experimentVariation` (variant), `userId`, `clientId`, `pseudo_user_id`, `partition_date`, `fwf_evaluationKind`, `fwf_abtestParticipated`. Multiple rows per user (one per evaluation event) — dedupe by `(userId, experimentId)`.

Link FwF key ↔ Eppo ID via `experiment_metadata` where `is_eppo_automated = TRUE` (then `experiment_key` is populated).

**Help-Center-specific assignment table** — `fulfillment-dwh-production.cl.helpcenter_experiments_assignments` has `stakeholder_id`, `feature`, `variant`, `intended_variant`, `stakeholder` (Customer/Rider/Vendor). Cleaner than FwF for HC tests **but the `cl.*` dataset returns 403 for Grigorii's account** — use the `g_view_assignments_*` table instead.

## Step 5 — Read Eppo's assignment SQL when you need to understand the population

The `eppo_assignments_global.sql` field is the literal SQL Eppo runs to define the assignment set. This tells you:
- What counts as "assigned" (e.g. only logged-in users, only certain markets, only specific events)
- The join key (`entity_join_column_name` — e.g. `CUSTOMER_ID_EPPO`, `PSEUDO_USER_ID`, `VENDOR_UID`)
- The timestamp column (`timestamp_column`)

Reading this is mandatory before reproducing Eppo's denominator. Selection rules baked into the SQL (e.g. "only users who triggered event X") will not be obvious from the assignment view alone.

## Standard workflow for any experiment analysis

1. Find Eppo ID — Confluence weekly update / SteerCo / Slack / Eppo URL.
2. `experiment_metadata` → window, variants, total N, primary metric name.
3. `eppo_assignments_global` → understand what counts as "assigned" + the join key.
4. `g_view_assignments_experiment_<ID>` → per-user variant for SRM check, baseline equivalence, segment cuts.
5. `g_view_daily_subject_result_experiment_<ID>_metric_<METRIC_ID>` → if you want Eppo's exact metric value per user (skip rebuild).
6. Join to `orders` / `sessions` / `cfx_sessions` / `helpcenter_sessions` / etc using the join key from step 3.

## Caveats

- **Always run an SRM test on Eppo's actual assignment view, not on a session-table proxy.** A proxy population (e.g. "users seen in `cfx_sessions`") will not match Eppo's randomised set and will produce false SRM failures plus selection bias on every cohort cut. Lesson learned from the HS CFX investigation (2026-05-13) where the executor used `cfx_sessions` ∖ `helpcenter_sessions` as the proxy and got results pointing the opposite way to Eppo because the proxy denominator was wrong.
- **`g_view_assignments_*` is in `logistics-data-storage-staging`, not `fulfillment-dwh-production`.** Different project. The `curated_data_shared_experimentation` dataset only has metadata + FwF SDK evaluation events, not Eppo's resolved per-user assignment.
- **The `cl.*` dataset is access-restricted for Grigorii's account.** Don't waste time querying `cl.helpcenter_experiments_assignments` directly — use `g_view_assignments_experiment_<ID>` instead.
- **Multiple Eppo experiments can exist for the same product/window** (e.g. CFX HungerStation had 142837, 144215, 153173 in overlapping periods — the original 50%, an "active users only" cut, and the final internal-V cut). Always confirm the date range of the experiment matches the window the stakeholder is asking about, before assuming you have the right one.
- **The FwF `experiment_key` is often NULL** in `experiment_metadata` for service-side experiments (e.g. CFX uses template-engine routing, not FwF SDK). When NULL, you cannot join `experiment_assignment_*` by `experimentId` to find users — use the Eppo `g_view_assignments_*` table instead.

Related: [[reference_bigquery_all_datasets]] (general BQ map), [[reference_bigquery_cfx_share]] (CFX-specific session tables).
