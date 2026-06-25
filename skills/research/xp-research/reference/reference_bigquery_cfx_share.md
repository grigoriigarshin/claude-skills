---
name: BigQuery — Weekly CFX Share
description: Ready-to-run query for weekly CFX vs HC user distribution (global, Customer helpcenter). Uses curated_data_shared, not cl.
type: reference
originSessionId: ea1b9207-1bec-4dcd-b2a7-36c33207921a
---
# Weekly CFX Share query

Shows what share of all Help Center users globally went through CFX vs legacy HC, broken down by week.

**Tables:** `fulfillment-dwh-production.curated_data_shared.cfx_sessions` and `helpcenter_sessions`  
**Filter:** `helpcenter = 'Customer'`, `stakeholder_id IS NOT NULL`  
**Note:** The original query in the CFX PM assistant repo references `fulfillment-dwh-production.cl.*` — that dataset is not accessible. Use `curated_data_shared` instead (same tables, same columns).

## Query — last 12 complete weeks (excluding current)

```sql
WITH cfx_weekly AS (
  SELECT
    DATE_TRUNC(created_date, WEEK(MONDAY)) AS week_start,
    COUNT(DISTINCT stakeholder_id)          AS cfx_users
  FROM `fulfillment-dwh-production.curated_data_shared.cfx_sessions`
  WHERE created_date >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY)), INTERVAL 12 WEEK)
    AND created_date < DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY))
    AND helpcenter = 'Customer'
    AND stakeholder_id IS NOT NULL
  GROUP BY 1
),
hc_weekly AS (
  SELECT
    DATE_TRUNC(created_date, WEEK(MONDAY)) AS week_start,
    COUNT(DISTINCT stakeholder_id)          AS hc_users
  FROM `fulfillment-dwh-production.curated_data_shared.helpcenter_sessions`
  WHERE created_date >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY)), INTERVAL 12 WEEK)
    AND created_date < DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY))
    AND helpcenter = 'Customer'
    AND stakeholder_id IS NOT NULL
  GROUP BY 1
),
total_weekly AS (
  SELECT week_start, COUNT(*) AS total_unique_users
  FROM (
    SELECT DATE_TRUNC(created_date, WEEK(MONDAY)) AS week_start, stakeholder_id
    FROM `fulfillment-dwh-production.curated_data_shared.cfx_sessions`
    WHERE created_date >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY)), INTERVAL 12 WEEK)
      AND created_date < DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY))
      AND helpcenter = 'Customer' AND stakeholder_id IS NOT NULL
    UNION DISTINCT
    SELECT DATE_TRUNC(created_date, WEEK(MONDAY)) AS week_start, stakeholder_id
    FROM `fulfillment-dwh-production.curated_data_shared.helpcenter_sessions`
    WHERE created_date >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY)), INTERVAL 12 WEEK)
      AND created_date < DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY))
      AND helpcenter = 'Customer' AND stakeholder_id IS NOT NULL
  )
  GROUP BY 1
)
SELECT
  FORMAT("WK%02d", EXTRACT(ISOWEEK FROM t.week_start))                        AS week_label,
  FORMAT_DATE('%Y-%m', t.week_start)                                          AS month,
  t.week_start,
  t.total_unique_users,
  COALESCE(c.cfx_users, 0)                                                    AS cfx_users,
  COALESCE(h.hc_users, 0)                                                     AS hc_users,
  ROUND(100.0 * COALESCE(c.cfx_users, 0) / t.total_unique_users, 1)          AS cfx_pct,
  ROUND(100.0 * COALESCE(h.hc_users, 0) / t.total_unique_users, 1)           AS hc_pct
FROM total_weekly t
LEFT JOIN cfx_weekly c USING (week_start)
LEFT JOIN hc_weekly h USING (week_start)
ORDER BY t.week_start
```

## Last known result (run 2026-04-24)

CFX share jumped from ~5% (Jan–Mar 9) to ~12% (from Mar 16 onwards), indicating a major rollout event around the week of Mar 16.

| Week | CFX % | HC % |
|---|---|---|
| 2026-01-26 | 5.1% | 95.2% |
| 2026-02-16 | 4.4% | 95.9% |
| 2026-03-09 | 5.0% | 95.3% |
| 2026-03-16 | 11.8% | 89.2% |  ← rollout jump
| 2026-03-23 | 12.9% | 88.0% |
| 2026-04-13 | 11.5% | 89.3% |
