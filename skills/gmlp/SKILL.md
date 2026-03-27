---
name: gmlp
description: Complete reference for Delivery Hero's Global Machine Learning Platform (GMLP). Use when user asks about Metaflow workflows, MLflow experiment tracking, GMLP Kubernetes clusters, deploying ML pipelines, configuring metaflowconfig.env, GMLP SDK packages, Argo Workflows, running flows on Kubernetes, GPU usage on GMLP, cross-cloud access, app onboarding to GMLP, TTM time-to-market tracking, gmlp_id, DroneCI deployment, Airflow integration, @slack decorator, Slack alerts, uv package manager with GAR, k6 load testing inference, cloud notebook K8s Argo NBRunner, or troubleshooting GMLP errors like JSONDecodeError, GCS 403, Pod termination, or cloud notebook permission errors.
metadata:
  author: Mundher
  version: 2.1.0
---

# GMLP - Global Machine Learning Platform

Internal ML platform reference for Delivery Hero. This skill is structured for AI agent consumption — use the lookup tables and decision logic below to resolve user questions.

## Reference File Router

Read the matching reference file BEFORE answering. Multiple files may be needed.

| Topic keywords | Reference file |
|---|---|
| cluster, namespace, service account, stamp, service URL, backend app, GCP service account, `get-credentials`, `kubectl`, vertical, staging to production, production cluster, switch environment, migrate to prod, cloud notebook service URL, `--internal-ip` | `references/clusters-and-namespaces.md` |
| `.metaflowconfig.env`, environment variable, local run, K8s run config, cost label, secret, `METAFLOW_` | `references/metaflow-config.md` |
| MLflow, tracking URI, experiment, model registry, nested run, model promotion, `mlflow.` | `references/mlflow-guide.md` |
| SDK, CLI, `gmlp_cli`, `@kubernetes_optional`, `@schedule_optional`, `@slack`, Slack alerts, slack decorator, serving, OTel, GMLP Info card, `gmlp_metaflow`, install package, Artifact Registry, uv, `uv sync`, `gmlp-uv-auth`, Argo deploy, Argo trigger, publish package | `references/sdk-reference.md` |
| GPU, node selection, compute class, cross-cloud, AWS, performance, Drone CI, Dockerfile, debugging, `kubectl describe`, retry, fault tolerance, spot, on-demand, k6, load testing, inference load test, NBRunner, cloud notebook K8s, cloud notebook Argo | `references/advanced-topics.md` |
| onboarding, Developer Portal, `app.yaml`, escapehatch, externalgrant, namespace creation, CI/CD setup, new app | `references/app-onboarding.md` |
| TTM, time-to-market, `gmlp_id`, lifecycle stage, dashboard, tagging runs | `references/ttm-tracking.md` |
| error, troubleshooting, VPN, permission, 403, JSONDecodeError, container image, cloud notebook | `references/troubleshooting.md` |

## Platform Components

- **Metaflow**: ML workflow orchestration (flows, steps, artifacts)
- **MLflow**: Experiment tracking + model registry
- **Argo Workflows**: Scheduled workflow execution on K8s
- **Kubernetes (GKE)**: Remote execution clusters (shared + dedicated per vertical)
- **GCS**: Artifact storage buckets
- **Cloud Notebooks**: Vertex AI interactive development

## Vertical Resolution Logic

GMLP has two cluster types. Determine which the user needs:

1. **Shared cluster**: Used by entities without dedicated infrastructure. Stamps: `mdai` (staging), `8hs7` (production). Namespace pattern: `gmlp-user-{entity}`.
2. **Dedicated clusters**: Per-vertical clusters with isolated infrastructure. Namespace pattern: `gmlp-{vertical}-user`. Verticals: QCommerce, Consumer, FinTech, Logistics, Glovo, Talabat.

If unclear which cluster type, ask the user. Shared cluster is the default for new users.

## Quick-Answer Patterns

### Setting up a new user
1. Request access via [#global-mlp-support](https://slack.com/app_redirect?channel=C08E98U9U31) with email + vertical
2. Wait for confirmation email
3. `gcloud auth login` then `gcloud auth application-default login`
4. `gcloud components install kubectl`
5. Connect to cluster → read `references/clusters-and-namespaces.md` for the exact command
6. Verify: `kubectl get pods -n <namespace>` (VPN required)

### Running a flow locally
1. Create `.metaflowconfig.env` → read `references/metaflow-config.md` for exact values
2. `export $(cat .metaflowconfig.env)`
3. `poetry run python my_flow.py run`
4. VPN required

### Running a flow on Kubernetes
1. Add K8s-specific vars to `.metaflowconfig.env` → read `references/metaflow-config.md`
2. `export $(cat .metaflowconfig.env)`
3. `poetry run python my_flow.py run --with kubernetes`

### Switching from staging to production
1. Read `references/clusters-and-namespaces.md` — see "Staging to Production Migration" section for the full variable-by-variable checklist
2. Use the Environment Stamps table to find the production stamp for the vertical
3. Use the Service URLs tables for production external URLs
4. Discover production cluster name: `gcloud container clusters list --project {prod_project} --format="value(name)"`
5. Connect: `gcloud container clusters get-credentials {cluster_name} --region us-east1 --project {prod_project}`

### MLflow tracking setup
1. `poetry add mlflow google-cloud-storage`
2. Set tracking URI → read `references/mlflow-guide.md` (external URL for local, internal URI for K8s)
3. Use `mlflow.set_tracking_uri()` + `mlflow.set_experiment()`

### Deploying scheduled flows
```bash
gmlp argo deploy --root-flow-path ./mlops/flows --pr-branch feature/new-model --production
```
Read `references/sdk-reference.md` for full CLI reference.

## Code Templates

### Hello World Flow
```python
from metaflow import FlowSpec, card, step

class HelloWorld(FlowSpec):
    @card
    @step
    def start(self):
        self.my_var = "hello world"
        self.next(self.end)

    @card
    @step
    def end(self):
        print(f"the data artifact is: {self.my_var}")

if __name__ == "__main__":
    HelloWorld()
```

### @kubernetes_optional (from gmlp_metaflow_ext package)
```python
from metaflow import FlowSpec, step
from gmlp_metaflow import kubernetes_optional

class MyFlow(FlowSpec):
    @kubernetes_optional(
        cpu=1, memory=4000,
        node_selector="cloud.google.com/compute-class=gmlp-performance"
    )
    @step
    def start(self):
        self.next(self.end)

    @step
    def end(self):
        pass

if __name__ == '__main__':
    MyFlow()
```

### Docker Image Configuration
Priority order: decorator > CLI flag > env var.
1. `@kubernetes(image="harbor.deliveryhero.net/container/deliveryhero/image:tag")`
2. `python flow.py run --with kubernetes:image=harbor.deliveryhero.net/container/image:tag`
3. `METAFLOW_KUBERNETES_CONTAINER_IMAGE` + `METAFLOW_KUBERNETES_CONTAINER_REGISTRY`

WARNING: Do NOT use `--with kubernetes:image=...` if any steps use `@kubernetes(image=...)`.

## Error Quick-Reference

| Error pattern | Cause | Fix |
|---|---|---|
| `json.decoder.JSONDecodeError` | Not on VPN | Connect to VPN |
| `Invalid value for '--datastore': gs` | Missing env config | `export $(cat .metaflowconfig.env)` |
| `Pod was terminated in response to imminent node shutdown` | Spot preemption | Add `@retry` or use on-demand nodes |
| `kubectl` i/o timeout | Not on VPN | Connect to VPN |
| `403 Forbidden` on GCS | Missing IAM permissions | Add `externalgrant` in gmlp-infra |
| `Failed to find credentials` (Artifact Registry) | Missing auth plugin | Install `keyrings.google-artifactregistry-auth` |
| `cannot create resource workflowtemplates` | Missing RBAC | Request access via #global-mlp-support |
| Service Account Not Found | `METAFLOW_KUBERNETES_SERVICE_ACCOUNT` mismatch | Check `kubectl get sa -n {namespace}` |
| `Incorrect version for metaflow service` | Network issue (not version) | Connect to VPN |
| `AssumeRoleWithWebIdentity` AccessDenied | Hardcoded `AWS_ROLE_ARN` | Remove manual `AWS_ROLE_ARN` exports |

For full troubleshooting details, read `references/troubleshooting.md`.
