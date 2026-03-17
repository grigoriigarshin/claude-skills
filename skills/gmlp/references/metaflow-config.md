# Metaflow Configuration

Environment variable reference for `.metaflowconfig.env`. Values depend on cluster type (shared vs dedicated) and vertical.

## Local Run Configuration (Minimum Required)

### Shared Cluster
```bash
METAFLOW_DEFAULT_METADATA=service
METAFLOW_SERVICE_URL=https://gmlp-metaflow-stg.deliveryhero.io/metaflow-metadata
METAFLOW_DEFAULT_DATASTORE=gs
METAFLOW_DATASTORE_SYSROOT_GS=gs://gmlp-metaflow-mdai-storage/metaflow
```

### Dedicated Clusters — Local Run

For dedicated clusters, replace `METAFLOW_SERVICE_URL` and `METAFLOW_DATASTORE_SYSROOT_GS`:

| Vertical | METAFLOW_SERVICE_URL | METAFLOW_DATASTORE_SYSROOT_GS |
|---|---|---|
| QCommerce | `https://gmlp-qc-metaflow-stg.deliveryhero.io/metaflow-metadata` | `gs://gmlp-qc-metaflow-nuts-storage/metaflow` |
| Consumer | `https://gmlp-consumer-metaflow-stg.deliveryhero.io/metaflow-metadata` | `gs://gmlp-consumer-metaflow-8h80-storage/metaflow` |
| FinTech | `https://gmlp-fintech-metaflow-stg.deliveryhero.io/metaflow-metadata` | `gs://gmlp-fintech-metaflow-v58i-storage/metaflow` |
| Logistics | `https://gmlp-logistics-metaflow-stg.deliveryhero.io/metaflow-metadata` | `gs://gmlp-logistics-metaflow-35t3-storage/metaflow` |
| Glovo | `https://gmlp-glovo-metaflow-stg.deliveryhero.io/metaflow-metadata` | `gs://gmlp-glovo-metaflow-l7e5-storage/metaflow` |
| Talabat | `https://gmlp-talabat-metaflow-stg.deliveryhero.io/metaflow-metadata` | `gs://gmlp-talabat-metaflow-wtcg-storage/metaflow` |

Run command (VPN required):
```bash
export $(cat .metaflowconfig.env)
poetry run python my_flow.py run
```

---

## Kubernetes Run Configuration (Full)

Add these variables to `.metaflowconfig.env` on top of the local run variables. Values for namespace and service account are in `clusters-and-namespaces.md`.

### Variable Reference

| Variable | Description | Source |
|---|---|---|
| `METAFLOW_KUBERNETES_SERVICE_ACCOUNT` | K8s service account for pods | See `clusters-and-namespaces.md` |
| `METAFLOW_KUBERNETES_NAMESPACE` | K8s namespace for pods | See `clusters-and-namespaces.md` |
| `METAFLOW_KUBERNETES_CONTAINER_IMAGE` | Docker image name:tag | User's image or `dh-mlp-sandbox-project:1.0.39` |
| `METAFLOW_KUBERNETES_CONTAINER_REGISTRY` | Docker registry | `harbor.deliveryhero.net/container/deliveryhero/` |
| `METAFLOW_SERVICE_INTERNAL_URL` | Internal metadata URL for K8s pods | See Internal URL table below |
| `METAFLOW_ARGO_EVENTS_WEBHOOK_URL` | Argo Events webhook | `http://eventsource-webhook:12001/metaflow-argo-events` |
| `METAFLOW_ARGO_EVENTS_EVENT_BUS` | Argo Events bus | `default` |
| `METAFLOW_ARGO_EVENTS_EVENT_SOURCE` | Argo Events source | `eventsource-webhook` |
| `METAFLOW_ARGO_EVENTS_SERVICE_ACCOUNT` | Argo Events SA (same as K8s SA) | Same as `METAFLOW_KUBERNETES_SERVICE_ACCOUNT` |
| `METAFLOW_ARGO_EVENTS_EVENT` | Argo Events event name | `metaflow-argo-events` |
| `METAFLOW_ARGO_WORKFLOWS_UI_URL` | Argo UI URL | See `clusters-and-namespaces.md` service URLs |
| `METAFLOW_ARTIFACT_LOCALROOT` | Temp artifact path | `/tmp` |
| `METAFLOW_DEFAULT_PACKAGE_SUFFIXES` | File types to package | `.py,.yml,.yaml,.sql` |
| `METAFLOW_KUBERNETES_LABELS` | Cost tracking + Slack labels | See Cost Labels section |

### Complete Config: Shared Cluster (Consumer Example)

```bash
METAFLOW_DEFAULT_METADATA=service
METAFLOW_SERVICE_URL=https://gmlp-metaflow-stg.deliveryhero.io/metaflow-metadata
METAFLOW_SERVICE_INTERNAL_URL=http://gmlp-metaflow-mdai-metadata-svc.gmlp-metaflow.svc.cluster.local:8080/metaflow-metadata
METAFLOW_DEFAULT_DATASTORE=gs
METAFLOW_DATASTORE_SYSROOT_GS=gs://gmlp-metaflow-mdai-storage/metaflow
METAFLOW_KUBERNETES_SERVICE_ACCOUNT=gmlp-user-consumer-mdai-http-svc
METAFLOW_KUBERNETES_NAMESPACE=gmlp-user-consumer
METAFLOW_KUBERNETES_CONTAINER_IMAGE=dh-mlp-sandbox-project:1.0.39
METAFLOW_KUBERNETES_CONTAINER_REGISTRY=harbor.deliveryhero.net/container/deliveryhero/
METAFLOW_ARGO_EVENTS_WEBHOOK_URL=http://eventsource-webhook:12001/metaflow-argo-events
METAFLOW_ARGO_EVENTS_EVENT_BUS=default
METAFLOW_ARGO_EVENTS_EVENT_SOURCE=eventsource-webhook
METAFLOW_ARGO_EVENTS_SERVICE_ACCOUNT=gmlp-user-consumer-mdai-http-svc
METAFLOW_ARGO_EVENTS_EVENT=metaflow-argo-events
METAFLOW_ARGO_WORKFLOWS_UI_URL=https://gmlp-argo-workflows-stg.deliveryhero.io/
METAFLOW_ARTIFACT_LOCALROOT=/tmp
METAFLOW_DEFAULT_PACKAGE_SUFFIXES=.py,.yml,.yaml,.sql
METAFLOW_KUBERNETES_LABELS=slack_alerts_channel=gmlp-consumer-stg-notifications
```

To generate a config for other entities: replace namespace, service account, and slack channel per `clusters-and-namespaces.md`.

### Internal Metadata URL Patterns

| Cluster | Internal URL |
|---|---|
| Shared Staging | `http://gmlp-metaflow-mdai-metadata-svc.gmlp-metaflow.svc.cluster.local:8080/metaflow-metadata` |
| Shared Production | `http://gmlp-metaflow-8hs7-metadata-svc.gmlp-metaflow.svc.cluster.local:8080/metaflow-metadata` |
| QC Dedicated | `http://gmlp-qc-metaflow-nuts-metadata-svc.gmlp-qc-metaflow.svc.cluster.local:8080/metaflow-metadata` |
| Consumer Dedicated | `http://gmlp-consumer-metaflow-8h80-metadata-svc.gmlp-consumer-metaflow.svc.cluster.local:8080/metaflow-metadata` |
| FinTech Dedicated | `http://gmlp-fintech-metaflow-v58i-metadata-svc.gmlp-fintech-metaflow.svc.cluster.local:8080/metaflow-metadata` |
| Logistics Dedicated | `http://gmlp-logistics-metaflow-35t3-metadata-svc.gmlp-logistics-metaflow.svc.cluster.local:8080/metaflow-metadata` |
| Glovo Dedicated | `http://gmlp-glovo-metaflow-l7e5-metadata-svc.gmlp-glovo-metaflow.svc.cluster.local:8080/metaflow-metadata` |
| Talabat Dedicated | `http://gmlp-talabat-metaflow-wtcg-metadata-svc.gmlp-talabat-metaflow.svc.cluster.local:8080/metaflow-metadata` |

URL pattern: `http://gmlp-{vertical}-metaflow-{stamp}-metadata-svc.gmlp-{vertical}-metaflow.svc.cluster.local:8080/metaflow-metadata`

Run on Kubernetes:
```bash
export $(cat .metaflowconfig.env)
poetry run python my_flow.py run --with kubernetes
```

---

## Cost Tracking Labels

Required for cost attribution. Set via `METAFLOW_KUBERNETES_LABELS`.

| Label | Description | Example |
|---|---|---|
| `dh_platform` | Platform name | `consumer`, `qc`, `pandora`, `glovo` |
| `dh_tribe` | DevPortal tribe ID | `con-global-ranking` |
| `dh_squad` | DevPortal squad ID | `con-core-ml` |
| `dh_app` | DevPortal app ID | `gmlp-sandbox-project` |
| `slack_alerts_channel` | Slack channel for Argo failure alerts | `gmlp-consumer-stg-notifications` |

Example:
```bash
METAFLOW_KUBERNETES_LABELS=slack_alerts_channel=gmlp-consumer-stg-notifications,dh_platform=consumer,dh_tribe=con-global-ranking,dh_squad=con-core-ml,dh_app=gmlp-sandbox-project
```

Cost dashboards:
- Global K8s Cost: https://lookerstudio.google.com/reporting/fcfd957c-e6b2-4b11-b7d5-ffb6b3cb55d7/page/p_6vybuyt51c
- FinOps Cost: https://lookerstudio.google.com/reporting/ece2f41f-7962-4383-a755-3d75ec2b03ef/page/p_pzrwbge16c

---

## Default Retry Configuration

Set default retries for all steps:
```bash
METAFLOW_DEFAULT_DECOSPECS=retry:times=2,minutes_between_retries=3
```

Or via CLI:
```bash
python flow.py --with retry:times=2,minutes_between_retries=3 argo-workflows create
```

---

## Secrets Configuration

Secret Kubernetes object name pattern: `<application>-<stamp>-<component>-<environment|tenant>`

- `<application>`: GDP application name
- `<stamp>`: Environment stamp (see `clusters-and-namespaces.md`)
- `<component>`: OAM component name (e.g., `workflow`, `http-svc`)
- `<environment|tenant>`: `environment` for global secrets, `tenant` for stamp-specific

Example: `gmlp-affinity-score-h44r-workflow-tenant`

Steps:
1. Add secret in Developer Portal → your vertical's "Global MLP User" app → Secrets section
2. Set `METAFLOW_KUBERNETES_SECRETS=<secret-name>` in `.metaflowconfig.env`
3. Access in code: `os.environ.get('SECRET_KEY_NAME')`

```python
@kubernetes(cpu=1, memory=128)
@step
def use_secret(self):
    import os
    api_key = os.environ.get('API_KEY')
```
