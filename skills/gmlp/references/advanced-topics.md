# Advanced Topics

## GPU Usage

Use `@kubernetes_optional` with `gpu` and `node_selector` for GPU acceleration:

```python
from gmlp_metaflow import kubernetes_optional
from metaflow import FlowSpec, step

class GPUFlow(FlowSpec):
    @step
    def start(self):
        self.next(self.gpu_task)

    @kubernetes_optional(
        memory=4000, cpu=1, gpu=1,
        node_selector="cloud.google.com/gke-accelerator=nvidia-tesla-t4"
    )
    @step
    def gpu_task(self):
        import torch
        print(f"GPU count: {torch.cuda.device_count()}")
        print(f"GPU name: {torch.cuda.get_device_name(0)}")
        self.next(self.end)

    @step
    def end(self):
        pass

if __name__ == '__main__':
    GPUFlow()
```

Node selector pattern: `cloud.google.com/gke-accelerator={gpu_type}` (e.g., `nvidia-tesla-t4`, `nvidia-tesla-v100`)

GPU types must be enabled in NAP. Check availability: https://github.com/deliveryhero/cluster-orchestrator-modules/blob/develop/modules/gcp/gke-cluster/main.tf

GPU quotas can be increased via GCP request. Clean up failing GPU jobs to avoid resource waste.

---

## Node Selection & Compute Classes

| Compute Class | Node Types | Provisioning | Preemption Risk | Cost | Use Case |
|---|---|---|---|---|---|
| Default (no selector) | e2, t2d, n2d, n2, c4a, t2a | Spot | High | Lowest | General-purpose |
| `gmlp-performance` | c3, c4, m3, c3d, n2, n4 | Spot | Medium | Low | CPU/memory intensive |
| `gmlp-performance-on-demand` | c3, c4, m4, m3, c3d, n2, n4 | On-demand | None | High | Mission-critical only |

```python
# Spot performance (recommended for most workloads)
@kubernetes_optional(cpu=1, memory=4000,
    node_selector="cloud.google.com/compute-class=gmlp-performance")

# On-demand (no preemption, significantly higher cost)
@kubernetes_optional(cpu=1, memory=4000,
    node_selector="cloud.google.com/compute-class=gmlp-performance-on-demand")
```

### GKE Node Labels

| Node Type | Label | Value |
|---|---|---|
| On-demand | `cloud.google.com/gke-spot` | `false` |
| On-demand | `cloud.google.com/gke-provisioning` | `standard` |
| On-demand | `goog-gke-node-pool-provisioning-model` | `on-demand` |
| Spot | `cloud.google.com/gke-spot` | `true` |
| Spot | `cloud.google.com/gke-provisioning` | `spot` |
| Spot | `goog-gke-node-pool-provisioning-model` | `spot` |

---

## Fault Tolerance & Retries

GMLP uses Spot instances by default (up to 91% savings). Tasks may be preempted with: `Pod was terminated in response to imminent node shutdown.`

### @retry Decorator
```python
@retry(times=2, minutes_between_retries=3)
@step
def my_step(self):
    ...
```

Defaults: `times=3`, `minutes_between_retries=2`. Maximum: `times=4`.

Disable retry for a specific step: `@retry(times=0)`

### Idempotent Code Requirements

**Safe to retry:** Checkpoint-based training, read-only DB queries, re-downloading files, stateless transforms, writing to deterministic GCS paths.

**Dangerous without safeguards:** Incrementing counters, inserting without idempotency keys, sending notifications, financial transactions, appending to files.

```python
# Checkpoint-based training pattern
@kubernetes
@retry(times=3, minutes_between_retries=2)
@step
def train(self):
    checkpoint_path = "gs://my-bucket/checkpoints/model.pt"
    if self.checkpoint_exists(checkpoint_path):
        model, optimizer, start_epoch = self.load_checkpoint(checkpoint_path)
    else:
        model, optimizer, start_epoch = self.init_model(), self.init_optimizer(), 0
    for epoch in range(start_epoch, 100):
        self.train_epoch(model, optimizer, epoch)
        self.save_checkpoint(checkpoint_path, model, optimizer, epoch)
    self.next(self.end)
```

**Scheduled workflows limitation:** ArgoUI does NOT support manual retry/resubmit for scheduled workflows. Use `@retry` in code only.

---

## Cross-Cloud Access (AWS from GCP)

Access AWS resources (S3, SQS) from GMLP workflows on GCP.

### Scenario 1: Provider App with OAM Resources

Consumer app adds `authorizations` block in `app.yaml`:
```yaml
- type: task-v1alpha1
  name: workflow
  properties:
    image:
      repository: deliveryhero/gmlp-task
      tag: v1
    authorizations:
    - authType: oam-app
      environment: <provider_env>
      application: <provider_app>
      stamp: <provider_stamp>
```

Provider app grants access via `externalgrant`:
```yaml
- name: gmlp-application-cross-cloud-access
  type: externalgrant-v1alpha1
  properties:
    consumer:
      type: OAM_APP
      environment: <consumer_env>
      stamp: <consumer_stamp>
      app: <consumer_app>
      component: <consumer_component>
    authorizations:
    - authType: component
      component:
        name: model-store
```

### Scenario 2: Provider App with Non-OAM Resources

1. Consumer adds `cloud-provider` authorization:
```yaml
authorizations:
- authType: cloud-provider
  provider: AWS
```

2. Find principal ARN:
```bash
kubectl get sa <app>-<stamp>-<component> -n <namespace> \
  -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'
```

3. Provider creates escapehatch with the principal ARN.

### Python Client for Cross-Account S3
```python
import boto3

def get_cross_account_s3_client(region_name, role_arn, role_session_name="session", duration_seconds=3600):
    sts_client = boto3.client("sts")
    response = sts_client.assume_role(
        RoleArn=role_arn, RoleSessionName=role_session_name, DurationSeconds=duration_seconds)
    creds = response["Credentials"]
    return boto3.client("s3", region_name=region_name,
        aws_access_key_id=creds["AccessKeyId"],
        aws_secret_access_key=creds["SecretAccessKey"],
        aws_session_token=creds["SessionToken"])
```

---

## Performance Optimization

### Batch Training for Regional Models

Instead of naive `foreach` (one pod per model), batch models with similar resource needs:

```python
@step
def split_models_in_batches(self):
    model_config_list = [...]
    self.model_batch_list = self.split_models(model_config_list)
    self.next(self.train_model_batch, foreach="model_batch_list")

@resources(cpu=5, memory=1000)
@step
def train_model_batch(self):
    for model_params in self.input:
        model_artifact = self.get_or_train_model(model_params)
    self.next(self.validate)
```

---

## Drone CI Integration

### Deploying Argo Templates (WIF Federation, gmlp-cli >= 0.10.0)

DEPRECATION: OAM task + OAM image update workflow is deprecated. Use WIF federation instead.

Requirements:
- Pipeline `type: kubernetes`
- `service_account_name: gmlp-deployer`
- Image with `gmlp-cli >= 0.10.0`
- `GCP_CREDS` from secret `DP_ARTIFACT_REGISTRY_WIF_CONFIG`

```yaml
kind: pipeline
type: kubernetes
name: build_image
service_account_name: gmlp-deployer

steps:
  - name: build-and-push-image
    image: plugins/harbor
    settings:
      dockerfile: Dockerfile
      repo: ${DRONE_REPO}
      tags:
        - ${DRONE_TAG}
        - deployer-${DRONE_COMMIT_SHA}

  - name: tag-argo-deploy-production
    image: harbor.deliveryhero.net/container/${DRONE_REPO}:deployer-${DRONE_COMMIT_SHA}
    depends_on:
      - build-and-push-image
    environment:
      GCP_CREDS:
        from_secret: DP_ARTIFACT_REGISTRY_WIF_CONFIG
    commands:
      - |
        gmlp argo deploy-workflows --flow-path src/sandbox/flows --branch main --environment production --namespace gmlp-sandbox-project --production
```

NOTE: `DRONE_TAG` is empty for non-tag events, causing YAML validation errors. Always use `deployer-${DRONE_COMMIT_SHA}` as a secondary tag.

### Harbor Image Push Pipeline
```yaml
kind: pipeline
type: docker
name: build-release.harbor

trigger:
  event:
    - tag

steps:
  - name: gdp-harbor-docker-push
    image: plugins/harbor
    environment:
      GITHUB_USERNAME:
        from_secret: GH_READ_USERNAME
      GITHUB_TOKEN:
        from_secret: GITHUB_TOKEN
    settings:
      dockerfile: Dockerfile.metaflow
      repo: deliveryhero/{{YOUR_REPOSITORY}}
      tags:
        - ${DRONE_TAG}
      build_args_from_env:
        - GITHUB_USERNAME
        - GITHUB_TOKEN
```

### Dockerfile for CI/CD Deployment Image

Set Metaflow env vars for the target environment:
```dockerfile
ENV METAFLOW_DATASTORE_SYSROOT_GS="gs://gmlp-metaflow-8hs7-storage/metaflow"
ENV METAFLOW_DEFAULT_DATASTORE="gs"
ENV METAFLOW_DEFAULT_METADATA="service"
ENV METAFLOW_KUBERNETES_NAMESPACE="{YOUR_NAMESPACE}"
ENV METAFLOW_KUBERNETES_SERVICE_ACCOUNT="{YOUR_NAMESPACE}-8hs7-http-svc"
ENV METAFLOW_SERVICE_URL="http://gmlp-metaflow-8hs7-metadata-svc.gmlp-metaflow.svc.cluster.local:8080/metaflow-metadata"
ENV METAFLOW_SERVICE_INTERNAL_URL="http://gmlp-metaflow-8hs7-metadata-svc.gmlp-metaflow.svc.cluster.local:8080/metaflow-metadata"
```

---

## Debugging Flows

### Tools
- **Metaflow UI**: Flow search, logs, DAGs, running times
- **Grafana**: Resource utilization, K8s logs — https://deliveryhero.grafana.net/d/9e34fa3d-0148-4343-b7aa-414f7fe6ab1c/gmlp-metaflow-tasks
- **Argo Workflows UI**: For Argo-managed flows
- **kubectl**: Direct pod inspection

### Useful kubectl Commands
```bash
# Describe pod by Metaflow task ID
kubectl describe pod $(kubectl get pods -n $METAFLOW_KUBERNETES_NAMESPACE \
  -o=jsonpath='{.items[?(@.metadata.annotations.metaflow/task_id=="{TASK_ID}")].metadata.name}') \
  -n $METAFLOW_KUBERNETES_NAMESPACE

# Delete stuck job by task ID
kubectl delete job $(kubectl get jobs -n $METAFLOW_KUBERNETES_NAMESPACE \
  -o=jsonpath='{.items[?(@.metadata.annotations.metaflow/task_id=="{TASK_ID}")].metadata.name}') \
  -n $METAFLOW_KUBERNETES_NAMESPACE
```
