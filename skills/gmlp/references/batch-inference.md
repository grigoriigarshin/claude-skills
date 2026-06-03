# Batch Inference

Low-code framework for running large-scale inference on offline features in BigQuery. Built on Metaflow + Argo Workflows with MLflow model registry.

## CLI Commands

```bash
# Local run
poetry run gmlp batch-inference run --config config.yaml

# Remote Kubernetes run
poetry run gmlp batch-inference run --config config.yaml --kubernetes

# Deploy to Argo Workflows (staging, from local)
poetry run gmlp batch-inference deploy-workflows --config config.yaml --no-auth --cluster [CLUSTER] --environment staging --namespace [NAMESPACE]

# Deploy to Argo Workflows (production, from DroneCI)
gmlp batch-inference deploy-workflows --config [PATH] --branch main --environment production --namespace [NAMESPACE] --production
```

---

## Configuration YAML Reference

### Top-Level Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `project_name` | `string` | Yes | Logical project name |
| `flow_name` | `string` | Yes | Unique identifier (CamelCase) |
| `schedule` | `string` | No | Cron expression |
| `model` | `object` | Yes | Model config (type: `mlflow`, `model_uri`) |
| `source` | `object` | Yes | BigQuery source config |
| `sink` | `object` | Yes | BigQuery sink config |
| `batch_options` | `object` | No | Batching strategy |
| `resources` | `object` | No | K8s resource requests |
| `inference` | `object` | No | Custom inference plugin |

### batch_options

| Field | Default | Description |
|---|---|---|
| `max_workers` | `16` | Max parallel prediction workers |
| `size_mb` | `1024` | Parquet queue MB per worker |
| `step_max_retries` | `2` | Max retries per Step |
| `queue_max_retries` | `2` | Max retries per parquet queue |

### resources

| Field | Default | Description |
|---|---|---|
| `cpu` | `1` | CPU cores |
| `memory` | `4096` | Memory MB |
| `disk` | `10240` | Disk MB |
| `node_selector` | `None` | K8s node selector label |

### source

| Field | Required | Description |
|---|---|---|
| `type` | Yes | `bigquery` |
| `execution_project_id` | Yes | BQ execution project |
| `query` | Yes | SQL with Jinja variables |
| `window.lookback_hours` | No | Hours back from execution_ts |
| `window.offset_hours` | No | Hours offset (default 0) |
| `params` | No | Static Jinja variable values |

### sink

| Field | Required | Default | Description |
|---|---|---|---|
| `type` | Yes | | `bigquery` |
| `execution_project_id` | Yes | | BQ execution project |
| `destination_table` | Yes | | `project.dataset.table` |
| `write_disposition` | No | `WRITE_APPEND` | `WRITE_EMPTY`, `WRITE_TRUNCATE`, `WRITE_APPEND` |
| `time_partitioning_field` | No | `None` | Partition column |

---

## Data Intervals

### Dynamic (scheduled runs)
Use `{{window_start_ts}}` and `{{window_end_ts}}` in query + set `window.lookback_hours`.

### Static (backfill)
Use `{{start_ts}}` and `{{end_ts}}` in query + provide values in `params`.

Override execution timestamp: `--execution_ts "2025-11-02T04:00:00+00:00"`

---

## Environment Variables

### Batch Inference Storage Buckets

Service URLs (MLflow tracking URIs) are in `clusters-and-namespaces.md`.

#### Staging

| Cluster | `GMLP_BATCH_INFERENCE_STORAGE_BUCKET` |
|---|---|
| Shared | `gs://gmlp-batch-inference-mdai-storage` |
| QCommerce | `gs://gmlp-qc-batch-inference-nuts-storage` |
| Consumer | `gs://gmlp-consumer-batch-inference-8h80-storage` |
| Logistics | `gs://gmlp-logistics-batch-inference-35t3-storage` |
| Glovo | `gs://gmlp-glovo-batch-inference-l7e5-storage` |
| Talabat | `gs://gmlp-talabat-batch-inference-wtcg-storage` |
| Vendor | `gs://gmlp-vendor-batch-inference-0580-storage` |

#### Production

| Cluster | `GMLP_BATCH_INFERENCE_STORAGE_BUCKET` |
|---|---|
| Shared | `gs://gmlp-batch-inference-8hs7-storage` |
| QCommerce | `gs://gmlp-qc-batch-inference-r3c2-storage` |
| Consumer | `gs://gmlp-consumer-batch-inference-ig0b-storage` |
| Logistics | `gs://gmlp-logistics-batch-inference-ufbx-storage` |
| Glovo | `gs://gmlp-glovo-batch-inference-h44r-storage` |
| Talabat | `gs://gmlp-talabat-batch-inference-ct27-storage` |

### MLflow Tracking URIs (Internal, for K8s pods)

See `mlflow-guide.md` for the full internal URI table per cluster and environment.

### Schedule Activation

Schedule is deactivated by default. To enable:
```bash
export GMLP_METAFLOW_SCHEDULE_ENABLED=true
```

---

## Custom Inference Plugin

Inherit from `BatchInferenceBase`:

```python
from gmlp_cli.batch_inference.plugin.base import BatchInferenceBase
import numpy as np
import polars as pl

class MyPlugin(BatchInferenceBase):
    def __init__(self, model, df_in):
        super().__init__(model, df_in)

    def pre_process(self, cols_to_drop: list[str] | None = None, **kwargs) -> np.ndarray:
        df = self._df_in.drop(cols_to_drop) if cols_to_drop else self._df_in
        return df.to_numpy()

    def post_process(self, predictions: np.ndarray, **kwargs) -> pl.DataFrame:
        return self._df_in.with_columns(
            pl.Series(name="predictions", values=predictions)
        )
```

Config:
```yaml
inference:
  type: my_package.inference.MyPlugin
  pre_process:
    cols_to_drop: [global_entity_id, feature_timestamp_utc]
```

---

## Prerequisites

- Model registered in MLflow on the target GMLP cluster
- `gmlp-cli` with batch inference extra installed
- `gmlp-otel` installed
- `gcloud` authenticated
- For remote K8s: OAM app onboarded, Docker image in Harbor, BigQuery permissions (`roles/bigquery.dataEditor`, `roles/bigquery.jobUser`)