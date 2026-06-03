# Backend Tracking

Lightweight, non-blocking Python SDK that captures ML inference data and streams it to BigQuery. Designed for production inference services — logs are buffered in-process and flushed by a background thread with negligible latency impact.

## Installation

### Poetry
```toml
[tool.poetry.dependencies]
gmlp-backend-tracking = { version = ">=0.4.0", source = "gmlp-pypi" }

[[tool.poetry.source]]
name = "gmlp-pypi"
url = "https://europe-python.pkg.dev/dp-common-infra-5780/developer-platform-python/simple"
priority = "explicit"

[tool.poetry.requires-plugins]
keyrings-google-artifactregistry-auth = "^1.1.2"
```

### pip
```bash
pip install keyrings-google-artifactregistry-auth
pip install gmlp-backend-tracking --extra-index-url https://europe-python.pkg.dev/dp-common-infra-5780/developer-platform-python/simple
```

---

## Quick Start

### 1. Define Schema
```python
from gmlp_backend_tracking import GMLPBaseLog

class RankingLog(GMLPBaseLog):
    input_features: dict
    prediction_score: float
    experiment_group: str = "control"
```

Base fields (inherited): `request_id`, `gmlp_id`, `timestamp`, `date`, `custom_schema`.

### 2. Initialize Tracker
```python
from gmlp_backend_tracking import GMLPTracker
from gmlp_backend_tracking.models.tracker_config import GMLPTrackerConfig
from gmlp_data_handler.sink.bigquery.streaming_api.json import BigQueryStreamJson

sink_config = BigQueryStreamJson(
    destination_project_id="gmlp-prod-123",
    destination_dataset_id="ml_observability",
    destination_table_id="inference_logs_v0",
    execution_project_id="gmlp-prod-123"
)

tracker = GMLPTracker.from_config(
    configs=[sink_config],
    config=GMLPTrackerConfig(batch_size=500, flush_interval=5),
    tracker_name="ranking-tracker",
)
```

### 3. Push Logs
```python
log = RankingLog(
    request_id=context.id,
    gmlp_id="your-gmlp-id",
    input_features=input,
    prediction_score=output
)
tracker.push(log)  # non-blocking
```

---

## Configuration

### GMLPTrackerConfig

| Field | Type | Default | Description |
|---|---|---|---|
| `batch_size` | `int` | `500` | Records per batch flush |
| `flush_interval` | `float` | `5` | Seconds between flushes |
| `buffer_size` | `int` | `1000` | Max buffer size (oldest dropped when full) |
| `drain_timeout` | `float` | `10` | Seconds to wait for drain on shutdown |

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GMLP_TRACKING_ENABLED` | `true` | Enable/disable tracking |
| `GMLP_METRICS_ENABLED` | `false` | Enable OTel metrics export |
| `GMLP_TRACKER_BATCH_SIZE` | `500` | Override batch_size |
| `GMLP_TRACKER_FLUSH_INTERVAL` | `5` | Override flush_interval |
| `GMLP_TRACKER_BUFFER_SIZE` | `1000` | Override buffer max length |
| `GMLP_TRACKER_DRAIN_TIMEOUT` | `10` | Seconds to wait on shutdown |

**Precedence**: env vars > `GMLPTrackerConfig` fields > built-in defaults.

**Deprecation (v0.4.0)**: Passing `batch_size`/`flush_interval` etc. as kwargs to `GMLPTracker()` emits `DeprecationWarning`. Use `config=GMLPTrackerConfig(...)`.

---

## Schema Output Formats

### Standard Schema (`custom_schema=False`, default)
User-defined fields packed into a `payload` JSON string column. Shared BQ table for multiple log types.

### Custom Schema (`custom_schema=True`)
All fields as top-level BQ columns. Requires dedicated table with matching columns.

---

## Sinks

Currently supported: **BigQuery Streaming JSON** via `gmlp_data_handler`.

```python
from gmlp_data_handler.sink.bigquery.streaming_api.json import BigQueryStreamJson

config = BigQueryStreamJson(
    destination_project_id="your-project",
    destination_dataset_id="your-dataset",
    destination_table_id="your-table"
)
tracker = GMLPTracker.from_config(configs=[config])
```

---

## Permissioning (Cross-Cloud: AWS → GCP)

Inference services on AWS need a GCP Service Account with BigQuery write access.

### Step 1: Add cloud-provider authorization to OAM manifest
```yaml
authorizations:
  - authType: cloud-provider
    provider: GCP
```

### Step 2: Retrieve created SA from ArgoCD
SA email pattern: `oam-{hash}@dp-cross-cloud-idp-1-8893.iam.gserviceaccount.com`

### Step 3: Grant BigQuery roles on destination project
- `roles/bigquery.dataEditor`
- `roles/bigquery.jobUser`

---

## OTel Metrics

Enable by passing `OTelHelper` + setting `GMLP_METRICS_ENABLED=true`.

```python
from gmlp_otel.helper import OTelHelper

tracker = GMLPTracker.from_config(
    configs=[sink_config],
    config=GMLPTrackerConfig(),
    otel_helper=OTelHelper(...),
    tracker_name="ranking-tracker",
)
```

### Key Metrics

| Metric | Type | Description |
|---|---|---|
| `sdk_buffer_size` | Gauge | Current buffer items |
| `sdk_dropped_logs` | Counter | Logs dropped (buffer full) |
| `sdk_push_latency` | Histogram (µs) | Time to append to buffer |
| `sink_flush_duration` | Histogram (ms) | Time per sink write |
| `sink_flush_success` | Counter | Successful writes |
| `sink_flush_failure` | Counter | Failed writes |

**Breaking change in v0.4.0**: `sdk_push_latency` now uses µs (was ms in 0.3.x).

Grafana dashboard: `https://deliveryhero.grafana.net/d/rarp2sx/backend-tracking-metrics-sdk`

---

## Reliability

- **Fail-open**: Sink failures logged, don't impact main application
- **Sink init retry**: Up to 3 attempts with exponential backoff (1s, 2s)
- **Transform isolation**: Bad log entries skipped, rest of batch flushed
- **Worker thread resilience**: Catches all exceptions, continues processing
- **Graceful degradation**: Init failure disables tracker (no exception raised)
- **Auto-shutdown**: `atexit` drains buffer on normal process exit

### Limitations (v0)

- At-most-once delivery (logs may be lost under extreme conditions)
- Memory-only buffer (pod eviction/OOM/SIGKILL loses buffered data)
- No backpressure (old logs dropped when buffer fills)