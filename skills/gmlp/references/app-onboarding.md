# App Onboarding

One application per repository. Each app gets a dedicated K8s namespace and Service Account.

## Step-by-Step Process

### 1. Register in Developer Portal

URL: https://dev.deliveryhero.net (GDP automation template)

Configuration rules:
- **Platform**: Select your vertical (Consumer, FinTech, QCommerce, etc.)
- **App name convention**: `[domain]-[purpose]-model-[training/serving]` — separate training and serving into distinct apps
- **Keep names short**: App name is the base for many resources. Argo Workflow names combine `{project_name}.{branch_name}.{flow_name}` and can exceed the 63-char K8s limit.
- **Deployment Destinations**: Select stamps for your vertical (e.g., `gmlp-consumer-stg` and `gmlp-consumer-prod`)
- **Shared cluster apps**: Must select `Consumer` as platform. Use stamps `gmlp-staging` (staging) / `gmlp-shared` (production).

### 2. Update App Manifest

After onboarding, default `app.yaml` files are created in `.gdp/deploy/`. Update them with:

**A. `task-v1alpha1` component** — creates namespace + Service Account:
- Give a meaningful name (e.g., `workflow`)
- Use `task` for batch workloads, `service` for long-running APIs

**B. `escapehatch-v1alpha1` component** — grants Argo Workflows RBAC permissions:
- Prerequisite: Enable Escape Hatch in repo Settings (requires admin role)

Resource limits in `ns-setup`:
```yaml
ns_resource_quotas:
    requests:
        cpu: "2"
        memory: "4Gi"
```

Example app.yaml: https://github.com/deliveryhero/gmlp-app-creation-handbook/blob/main/.gdp/deploy/staging/gmlp-consumer-stg/app.yaml

Latest `ref=` version tag: https://github.com/deliveryhero/dh-mlp-tf-modules/releases

### 3. Grant Permissions to Shared Resources (gmlp-infra PR)

Your app needs GCS bucket access for Metaflow and MLflow services.

**Dedicated clusters**: Clone https://github.com/deliveryhero/gmlp-infra
- Files at: `platforms/[vertical]/[service]/.gdp/deploy/[env]/[stamp]/app.yaml`

**Shared cluster**: Clone https://github.com/deliveryhero/dh-mlp-infra
- Metaflow staging: `apps/gmlp-metaflow/.gdp/deploy/staging/gmlp-staging/app.yaml`
- MLflow staging: `apps/gmlp-mlflow/.gdp/deploy/staging/gmlp-staging/app.yaml`
- Metaflow production: `apps/gmlp-metaflow/.gdp/deploy/production/gmlp-shared/app.yaml`
- MLflow production: `apps/gmlp-mlflow/.gdp/deploy/production/gmlp-shared/app.yaml`

Add `externalgrant` component to the service's `app.yaml`:
```yaml
- type: externalgrant-v1alpha1
  name: [grant-name]
  properties:
    consumer:
      type: OAM_APP
      app: [your-app-name]
      stamp: [your-vertical-stamp]
      component: [component-name]
    authorizations:
      - authType: component
        component:
          name: *bucket-component
```

Repeat for both Metaflow and MLflow service `app.yaml` files.

CRITICAL: The `component` name in the consumer block must EXACTLY match the `name` of the `task` or `service` component in the consumer app's `app.yaml`. Mismatches cause silent permission failures.

After PR approval: comment `atlantis apply`, wait for `Apply complete!`, then merge.

Post merge in #global-mlp-support for review: https://deliveryhero.enterprise.slack.com/archives/C079F35F78T

### 4. Update CI/CD

Update `.drone.yml` and `Dockerfile`.

Templates:
- Dedicated cluster: https://github.com/deliveryhero/gmlp-app-creation-handbook/tree/main
- Shared cluster: https://github.com/deliveryhero/gmlp-sandbox-project (use `--cluster shared` in `gmlp argo deploy-workflows`)

Prerequisite: install `gmlp-cli` via GMLP Artifact Registry (see `sdk-reference.md`).

### 5. Deploy and Verify

1. Create PR with updated `app.yaml`
2. Escapehatch bot creates linked infra PR
3. Validate plan
4. Comment `atlantis apply`
5. Merge after `Apply complete!`

Verify in Argo CD: https://argo-cd.deliveryhero.net/applications — status should be `Synced` and `Healthy`

Verify permissions:
```bash
kubectl get role -n [your-app-namespace]
kubectl get rolebinding -n [your-app-namespace]
kubectl get iampolicymember -n [provider-app-namespace]
gcloud storage buckets get-iam-policy gs://[bucket-name]
```

## Testing

### Staging
- Test script: https://github.com/deliveryhero/gmlp-app-creation-handbook/blob/main/src/sandbox/flows/model_training_flow.py
- Environment template: https://github.com/deliveryhero/gmlp-app-creation-handbook/blob/main/.env

### Production
1. Push Git tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Wait for CI pipeline
3. Go to Production Argo Workflows UI → Workflow Templates → find your template → click Run
4. Verify results in Production UIs
