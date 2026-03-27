# GMLP SDK Reference

## Installation

Prerequisite: Join `dp-gcp-ml-artifact-readers` Google Group for Artifact Registry access.

### Poetry (pyproject.toml)
```toml
[[tool.poetry.source]]
name = "gmlp-pypi"
url = "https://europe-python.pkg.dev/dp-common-infra-5780/developer-platform-python/simple/"
priority = "explicit"

[tool.poetry.requires-plugins]
keyrings-google-artifactregistry-auth = "^1.1.2"

[tool.poetry.dependencies]
# Choose packages as needed:
gmlp_cli = { source = "gmlp-pypi", version = "<version>", extras = ["all"] }
gmlp_metaflow_ext = { source = "gmlp-pypi", version = "0.2.0" }
gmlp_data_handler = { source = "gmlp-pypi", version = "0.0.5" }
gmlp_otel = { source = "gmlp-pypi", version = "0.1.0" }
gmlp_smi = { source = "gmlp-pypi", version = "0.0.5" }
gmlp_serving = { source = "gmlp-pypi", version = "0.2.1" }
```

Note: For Poetry < 2.0, run `poetry self add keyrings.google-artifactregistry-auth` instead of using `[tool.poetry.requires-plugins]`.

### uv (pyproject.toml)
```toml
[[tool.uv.index]]
name = "gmlp-pypi"
url = "https://oauth2accesstoken@europe-python.pkg.dev/dp-common-infra-5780/developer-platform-python/simple/"
explicit = true

[tool.uv]
keyring-provider = "subprocess"

[project]
dependencies = [
    "gmlp_cli[all]==<version>",
]

[tool.uv.sources]
gmlp_cli = { index = "gmlp-pypi" }
```

Then: `gcloud auth application-default login && uv lock && uv sync`

No separate auth plugin needed — uv calls `gcloud` automatically via keyring subprocess.

### Pip
```bash
pip install keyrings-google-artifactregistry-auth
pip install --extra-index-url https://europe-python.pkg.dev/dp-common-infra-5780/developer-platform-python/simple/ 'gmlp_cli[all]'
```

---

## SDK Packages

| Package | Description |
|---|---|
| `gmlp_cli` | CLI for CI/CD, notebooks, project templates, batch inference. Modules: `argo`, `batch-inference`, `cluster`, `notebook`, `project` |
| `gmlp_metaflow_ext` | Custom decorators (`@kubernetes_optional`, `@schedule_optional`) and GMLP Info card |
| `gmlp_data_handler` | Utilities for loading data from GCS, S3, BigQuery |
| `gmlp_otel` | OpenTelemetry helper for exporting metrics/traces to Grafana |
| `gmlp_serving` | Standardized model serving via `MLInferenceInterface` |
| `gmlp_smi` | FlowSpec templates for standardized Metaflow workflows |

---

## GMLP CLI Commands

### Project Init
```bash
gmlp project init --template-name inference-serving-app --output-dir test-app
```

### Argo Deploy (local)
```bash
gmlp argo deploy --root-flow-path ./mlops/flows --pr-branch feature/new-model --production
```

### Argo Deploy from DroneCI
```bash
gmlp argo deploy-workflows \
    --flow-path ./mlops/flows \
    --branch feature/new-model \
    --cluster "shared" \
    --environment "staging" \
    --namespace "logistics-stg"
```

### Argo Trigger
```bash
gmlp argo trigger \
    --url https://gmlp-argo-workflows.deliveryhero.io \
    --wf-namespace gmlp-sandbox-project \
    --wf-template myproject.mybranch.test.mytrainingflow \
    --wf-labels dh_app=data-science,dh_vertical=consumer \
    --wf-params '{"dataset_date":"2023-10-26"}' \
    --retries 5
```

### Argo Deploy-Watch (validate deployments)
```bash
gmlp argo deploy-watch \
    --url https://gmlp-argo-workflows.deliveryhero.io \
    --wf-namespace gmlp-sandbox-project \
    --flow-path ./mlops/flows \
    --pr-branch test \
    --production \
    --timeout-seconds 600 \
    --poll-interval-seconds 10
```

### Logging Config
```bash
export GMLP_LOG_LEVEL=INFO    # or DEBUG
export GMLP_LOG_FORMAT=CONSOLE # or JSON (default)
```

---

## Argo Workflows: `create` vs `trigger`

- **`argo-workflows create`** (or `deploy-workflows` in CI/CD): Creates a new code snapshot and workflow template. Run whenever flow code changes (model logic, DAG, decorators, parameters, schedules, container image).
- **`argo-workflows trigger`**: Executes an already-deployed template with different runtime parameters. Does NOT pick up code changes.

Rule: **Code changes = `create`**. **Parameter changes only = `trigger`**.

### Deployment Success/Failure Behavior

`deploy` and `deploy-workflows` handle multiple FlowSpecs:
- **Full Success**: All FlowSpecs deploy. CI/CD step green.
- **Partial Failure**: Some fail, at least one succeeds. CI/CD step still green. Check `WARNING` logs.
- **Full Failure**: All fail. Raises `DeploymentFailedError`. CI/CD step red.

Always check CI/CD logs for `WARNING` messages to catch partial failures.

### Airflow Integration (KubernetesPodOperator)

Requirements:
- Docker image with GMLP CLI installed
- Airflow DDU's IP whitelisted by GMLP team (request via #global-mlp-support)
- Harbor image access from datahub cluster (request token from #gdp-support, deploy via #datahub-support)

```python
KubernetesPodOperator(
    task_id=your_task_id,
    cmds=["/bin/bash -c"],
    arguments=["gmlp argo trigger --url https://gmlp-argo-workflows.deliveryhero.io --wf-namespace {YOUR_NAMESPACE} --wf-template {DEPLOYED_TEMPLATE_NAME} --wf-labels {YOUR_LABELS} --wf-params {FLOWSPEC_PARAMETERS}"],
)
```

---

## @kubernetes_optional Decorator

From `gmlp_metaflow_ext` package. Same parameters as `@kubernetes` but does NOT force K8s execution.

- `python flow.py run` → K8s settings ignored, runs locally
- `python flow.py run --with kubernetes` → full K8s config applied

```python
from metaflow import FlowSpec, step
from gmlp_metaflow import kubernetes_optional

class MyFlow(FlowSpec):
    @kubernetes_optional(cpu=1, memory=4000,
        node_selector="cloud.google.com/compute-class=gmlp-performance")
    @step
    def start(self):
        self.next(self.end)

    @step
    def end(self):
        pass

if __name__ == '__main__':
    MyFlow()
```

---

## @schedule_optional Decorator

Conditional scheduling. Schedule is controlled by `GMLP_METAFLOW_SCHEDULE_ENABLED` env var:
- Defaults to `false` in staging (saves cost)
- Defaults to `true` in production (set by `--environment production`)

```python
from metaflow import FlowSpec, project, step
from gmlp_metaflow import schedule_optional

@project(name="sandbox")
@schedule_optional(cron="0 10 * * * *", timezone="UTC")
class MyFlow(FlowSpec):
    @step
    def start(self):
        self.next(self.end)
    @step
    def end(self):
        pass
```

To force-enable in staging DroneCI: set `GMLP_METAFLOW_SCHEDULE_ENABLED: true` in the environment block.

---

## @slack Decorator

From `gmlp_metaflow_ext` package. Injects Slack alert metadata into Argo Workflows for targeted failure notifications.

Parameters:
- **`description`** — Human-readable name for the flow (appears in Slack notification)
- **`mentions`** — List of Slack user IDs to tag (e.g., `["U09QFF10XUH"]`)
- **`channel`** — Slack channel name for alerts (without `#`)

```python
from metaflow import FlowSpec, project, step
from gmlp_metaflow import slack

@slack(
    description="Daily ETL Pipeline",
    mentions=["U09QFF10XUH", "U05R8LSBN6L"],
    channel="gmlp-test-notifications"
)
@project(name="sandbox")
class MyFlow(FlowSpec):
    @step
    def start(self):
        print("Hello, world!")
        self.next(self.end)

    @step
    def end(self):
        pass

if __name__ == '__main__':
    MyFlow()
```

Finding Slack User IDs: Open user profile in Slack → three-dot menu → **Copy member ID** (format: `U09QFF10XUH`).

Known limitation: Metaflow version constraint — `gmlp_metaflow` pins Metaflow below 2.19.14 due to a flow mutators issue.

---

## GMLP Info Card

Custom Metaflow card with links to Grafana dashboards and Argo UI:

```python
from metaflow import FlowSpec, step, card

class MyFlow(FlowSpec):
    @card
    @card(type="gmlp_info")
    @step
    def start(self):
        ...
```

Config env vars:
- `METAFLOW_KUBERNETES_CLUSTER_NAME`: Pattern `gcp:{project}:{region}:{cluster}`
- `DH_METAFLOW_POD_DASHBOARD_ENABLED`: `"1"` or `"0"`
- `ARGO_WORKFLOWS_UI_URL`: e.g., `https://gmlp-argo-workflows.deliveryhero.io/workflows`

---

## Serving (MLInferenceInterface)

```python
from gmlp_serving import MLInferenceInterface

class MyModel(MLInferenceInterface):
    def load_context(self, context):
        self.model = load_model(context["model_path"])

    def infer(self, context, request):
        return self.model.predict(request.data)

    # Optional: override for true async I/O
    async def infer_async(self, context, request):
        return await self.async_predict(request)
```

Lifecycle: `load_context()` called once at startup. `infer()` called per request (must be thread-safe). `infer_async()` default wraps `infer()` in a thread.

---

## OTel (OpenTelemetry)

```python
from gmlp_otel.helper import OTelHelper
from time import perf_counter

otel = OTelHelper()

# Record duration
start = perf_counter()
results = do_work()
otel.record_time("do_work", start_timer=start, msg_attributes={"region": "US"})

# Increment counter
otel.add_to_counter("results", qty=len(results), msg_attributes={"region": "US"})

# Decorators
@otel.traced(msg_attributes={"region": "US"})
def get_results():
    ...

@otel.timed
def get_results():
    ...
```

Metrics exported to Prometheus/Grafana. Periods in metric names converted to underscores.

---

## Publishing Packages to Artifact Registry

### uv (via Drone CI with gmlp-uv-auth)

```yaml
kind: pipeline
type: docker
name: publish-package

volumes:
  - name: uv-auth
    temp: {}

steps:
  - name: generate-uv-auth
    image: harbor.deliveryhero.net/container/deliveryhero/gmlp-uv-auth:0.4.0
    environment:
      UV_REPO_NAME: gmlp-pypi
    volumes:
      - name: uv-auth
        path: /auth

  - name: publish
    image: python:3.11-slim
    commands:
      - . /auth/gmlp-uv-auth.env
      - pip install uv
      - uv build
      - uv publish --publish-url https://europe-python.pkg.dev/dp-common-infra-5780/developer-platform-python/ --username oauth2accesstoken --password "$UV_INDEX_GMLP_PYPI_PASSWORD"
    volumes:
      - name: uv-auth
        path: /auth
    depends_on:
      - generate-uv-auth
```

The `gmlp-uv-auth` plugin generates an OAuth2 access token written to `UV_INDEX_GMLP_PYPI_PASSWORD`.

### Poetry (via Drone CI)

See existing Poetry Drone CI publish approach with `keyrings-google-artifactregistry-auth` and `poetry publish --repository gmlp-pypi --build`.
