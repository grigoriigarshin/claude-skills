# Time-to-Market (TTM) Tracking

## Setup Procedure

3 steps. All are required.

### Step 1: Generate a GMLP ID

Registry UI: https://gmlp-registry.deliveryhero.io/

- One `gmlp_id` per initiative. Reuse the SAME ID across all tools (notebooks, Metaflow, MLflow).
- Using different IDs breaks metric aggregation.
- Registration requires: Platform, Tribe, Squad. Description is optional.
- ID format example: `core_ml_x0z3`

### Step 2: Tag All Runs

**Mandatory tags** (all four required for TTM tracking):

| Tag | Value |
|-----|-------|
| `gmlp_id` | From Step 1 |
| `dh_platform` | Your vertical/platform name |
| `dh_tribe` | Your tribe name |
| `dh_squad` | Your squad name |

#### MLflow Tagging

```python
import mlflow

with mlflow.start_run():
    mlflow.set_tag("gmlp_id", "<your-gmlp-id>")
    mlflow.set_tag("dh_platform", "<your-platform>")
    mlflow.set_tag("dh_tribe", "<your-tribe>")
    mlflow.set_tag("dh_squad", "<your-squad>")
```

Tags MUST be set inside an active run context (`with mlflow.start_run()` or between `mlflow.start_run()` / `mlflow.end_run()`).

#### Metaflow Tagging

```python
from metaflow import FlowSpec, step, current

class MyFlow(FlowSpec):
    @step
    def start(self):
        current.run.add_tags([
            "gmlp_id:<your-gmlp-id>",
            "dh_platform:<your-platform>",
            "dh_tribe:<your-tribe>",
            "dh_squad:<your-squad>",
        ])
        self.next(self.end)

    @step
    def end(self):
        pass
```

Format: Metaflow uses `key:value` strings in a list, not key-value dict.

#### Cloud Notebook Tagging

- When creating notebooks via `gmlp-cli`, `dh_platform`, `dh_tribe`, `dh_squad`, `gcp_project_id` are auto-populated. Only `gmlp_id` needs manual addition.
- Add `gmlp_id` via: Advanced Tools → metadata block → add `"gmlp_id": "<your-gmlp-id>"` → save metadata → save `.ipynb` file.
- If `gmlp_id` is missing, a reminder pop-up appears in GMLP notebooks.
- If pop-up does NOT appear and `gmlp_id` is NOT set, the TTM post-startup script likely failed (check Service Account permissions).

LIMITATION: TTM for Notebooks (Exploration Stage) is NOT yet enabled for dedicated clusters. Shared cluster only.

### Step 3: Check Dashboards

Dashboards update daily (up to 24h delay after runs).

| Dashboard | URL |
|-----------|-----|
| TTM Dashboard | https://lookerstudio.google.com/u/0/reporting/9e5efea1-a375-4cad-866f-151cf7839c34/page/gQqXF |
| Dummy Data Dashboard (example) | https://lookerstudio.google.com/u/0/reporting/747ecd2c-7003-4147-be0e-ec5e2acc92be/page/gQqXF |

Available filters: `gcp_project_id`, `gmlp_id`, `dh_platform`, `dh_squad`, `dh_tribe`, date range. Filters apply per page only — re-apply when switching pages.

Dashboard pages:

| Page | Shows |
|------|-------|
| **KPI** | Median TTM in days, average stage duration by stage |
| **Funnel** | Count of `gmlp_id`s per lifecycle stage (Exploration, Development, Training, Done) |
| **Time Breakdown** | Stacked bar chart of average days per stage per `gmlp_id` |
| **Trends** | 4 sub-pages: Median `ttm_total_days`, Exploration duration, Development duration, Training duration over time |
| **Drilldowns** | Raw source table exploration (`ttm_metrics`, `ttm_metrics_wide`) |

---

## Lifecycle Stages

Events collected from: Metaflow, MLflow, Cloud Notebooks.

| Stage | Trigger: Starts | Trigger: Ends |
|-------|----------------|---------------|
| **Exploration** | First Cloud Notebook log for a new `gmlp_id` | First log from the next stage (Development) |
| **Development** | First Metaflow log in **staging** for same `gmlp_id` | First log from the next stage (Training) |
| **Training** | First Metaflow log in **production** for same `gmlp_id` | First production Metaflow log tagged with `release_to_market` |
| **Done** | After `release_to_market` tag detected | N/A |

The `release_to_market` tag must be set MANUALLY on a production Metaflow run to mark the end of the Training stage:

```python
current.run.add_tags(["release_to_market"])
```

---

## Metrics Reference

| Metric | Calculation |
|--------|-------------|
| `event_date` | Anchor date for trend charts. Completed stages: `stage_end_utc`. In-progress stages: current date. |
| `stage_duration_days` | Days between `stage_start_utc` and `stage_end_utc`. Ongoing stages use current date as end. |
| `ttm_total_days` | Sum of all `stage_duration_days` for a `gmlp_id`. Dynamically updated for in-progress IDs. |
| `stage_pct_of_total_ttm` | `stage_duration_days / ttm_total_days`. Example: 10 days dev / 40 total = 25%. |
| `last_updated_utc` | Refreshed when pipeline detects new data for a `gmlp_id`. No-change runs do not update this. |
| `is_anomaly` | NOT YET IMPLEMENTED. |
