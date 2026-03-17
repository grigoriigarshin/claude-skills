# MLflow on GMLP

## Supported Versions
- Shared cluster: `>= 2.0, < 3.0`
- Dedicated clusters: `>= 3.0, < 4.0`

## Installation
```bash
poetry add mlflow@<version>
poetry add google-cloud-storage@<version>
```

## Tracking URI Selection Logic

**Decision: Local or Kubernetes?**
- Local runs → use external HTTPS URLs (VPN required)
- Kubernetes pods → use internal cluster URIs (no VPN needed, same VPC)

### External URLs (for local runs)

Use the service URLs from `clusters-and-namespaces.md`. Example:
```python
mlflow.set_tracking_uri("https://gmlp-mlflow-stg.deliveryhero.io/")  # Shared staging
```

### Internal URIs (for K8s pods)

| Cluster | Staging | Production |
|---|---|---|
| Shared | `http://gmlp-mlflow-mdai-mlflow-svc.gmlp-mlflow.svc.cluster.local:8080` | `http://gmlp-mlflow-8hs7-mlflow-svc.gmlp-mlflow.svc.cluster.local:8080` |
| QC | `http://gmlp-qc-mlflow-nuts-mlflow-svc.gmlp-qc-mlflow.svc.cluster.local:8080` | `http://gmlp-qc-mlflow-r3c2-mlflow-svc.gmlp-qc-mlflow.svc.cluster.local:8080` |
| Consumer | `http://gmlp-consumer-mlflow-8h80-mlflow-svc.gmlp-consumer-mlflow.svc.cluster.local:8080` | `http://gmlp-consumer-mlflow-ig0b-mlflow-svc.gmlp-consumer-mlflow.svc.cluster.local:8080` |
| FinTech | `http://gmlp-fintech-mlflow-v58i-mlflow-svc.gmlp-fintech-mlflow.svc.cluster.local:8080` | N/A |
| Logistics | `http://gmlp-logistics-mlflow-35t3-mlflow-svc.gmlp-logistics-mlflow.svc.cluster.local:8080` | `http://gmlp-logistic-mlflow-ufbx-mlflow-svc.gmlp-logistics-mlflow.svc.cluster.local:8080` |
| Glovo | `http://gmlp-glovo-mlflow-l7e5-mlflow-svc.gmlp-glovo-mlflow.svc.cluster.local:8080` | `http://gmlp-glovo-mlflow-h44r-mlflow-svc.gmlp-glovo-mlflow.svc.cluster.local:8080` |
| Talabat | `http://gmlp-talabat-mlflow-wtcg-mlflow-svc.gmlp-talabat-mlflow.svc.cluster.local:8080` | `http://gmlp-talabat-mlflow-ct27-mlflow-svc.gmlp-talabat-mlflow.svc.cluster.local:8080` |

Internal URI pattern: `http://gmlp-{vertical}-mlflow-{stamp}-mlflow-svc.gmlp-{vertical}-mlflow.svc.cluster.local:8080`

NOTE: Logistics production has a known typo in the service name (`gmlp-logistic-` instead of `gmlp-logistics-`). This is the actual deployed name.

## Code Examples

### Single Run
```python
import mlflow

mlflow.set_tracking_uri("https://gmlp-mlflow-stg.deliveryhero.io/")
mlflow.set_experiment("<experiment_name>")

with mlflow.start_run():
    mlflow.set_tag("Training Info", "Basic test model.")
    mlflow.log_param("param1", 5)
    mlflow.log_metrics({"foo1": 1, "foo2": 2})
    with open("output.txt", "w") as f:
        f.write("Hello world!")
    mlflow.log_artifact("output.txt")
```

### Nested Runs
```python
import mlflow

mlflow.set_tracking_uri("https://gmlp-mlflow-stg.deliveryhero.io/")
mlflow.set_experiment("<experiment_name>")

with mlflow.start_run(run_name="parent"):
    mlflow.log_param("ts", "2025-01-17")
    for gid in ["FP_SG", "FP_SH"]:
        with mlflow.start_run(run_name=gid, nested=True):
            mlflow.log_params({"gid": gid})
    mlflow.log_metric("best_loss", 1e3)
```

### Metaflow + MLflow Integration
```python
import mlflow
from metaflow import FlowSpec, step

class MLflowFlow(FlowSpec):
    @step
    def start(self):
        self.next(self.write_to_mlflow)

    @step
    def write_to_mlflow(self):
        mlflow.set_tracking_uri("<MLflow_tracking_URI>")
        mlflow.set_experiment("<experiment_name>")
        with mlflow.start_run():
            mlflow.log_params({"max_depth": 2, "random_state": 42})
            mlflow.log_metrics({"mse": 355.833})
        self.next(self.end)

    @step
    def end(self):
        pass

if __name__ == "__main__":
    MLflowFlow()
```

## Artifact Storage Rules
- **Staging local**: Can log artifacts if user email has GCS bucket access
- **Production**: Must run via Kubernetes (service account credentials required)
- Logging runs/metrics/parameters works the same in both environments
- Use clear team-specific experiment names (e.g., `qc_category_product_ranking`)
- Do NOT upload sensitive data or PII

---

## Model Registry

### Register a Model
```python
import mlflow
import mlflow.sklearn

with mlflow.start_run() as run:
    mlflow.sklearn.log_model(model, "model")
    model_uri = f"runs:/{run.info.run_id}/model"
    mlflow.register_model(model_uri, "IrisModel")
```

CLI: `mlflow models register -m runs:/<RUN_ID>/model -n IrisModel`

### Model Aliases
```python
from mlflow import MlflowClient
client = MlflowClient()
client.set_registered_model_alias("MyModel", "champion", 1)
# Reference via: models:/MyModel@champion
```

### Promote Across Environments
```python
from mlflow import MlflowClient
client = MlflowClient()
client.copy_model_version(
    src_model_uri="models:/regression-model-staging@candidate",
    dst_name="regression-model-production",
)
```

### Custom Inference Pipeline
```python
import mlflow.pyfunc

class MyPipeline(mlflow.pyfunc.PythonModel):
    def load_context(self, context):
        pass  # Load model components

    def predict(self, context, model_input):
        return result  # Inference logic

with mlflow.start_run() as run:
    mlflow.pyfunc.log_model(artifact_path="pipeline", python_model=MyPipeline())
    mlflow.register_model(f"runs:/{run.info.run_id}/pipeline", "MyPipeline")
```
