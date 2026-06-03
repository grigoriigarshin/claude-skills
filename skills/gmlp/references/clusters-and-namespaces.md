# Clusters, Namespaces & Service URLs

## Cluster Connection Commands

Install kubectl: `gcloud components install kubectl`

VPN required for all cluster operations.

### Shared Cluster
```bash
gcloud container clusters get-credentials definite-serval --region us-east1 --project global-mlp-stg-2182
```

### Dedicated Clusters

| Vertical | Cluster name | GCP Project |
|---|---|---|
| QCommerce | `sharp-roughy` | `gmlp-qc-stg-7461` |
| Consumer | `super-grouper` | `gmlp-consumer-stg-8442` |
| FinTech | `improved-cattle` | `gmlp-fintech-stg-4079` |
| Logistics | `decent-chipmunk` | `gmlp-logistics-stg-8782` |
| Glovo | `climbing-duckling` | `gmlp-glovo-stg-0601` |
| Talabat | `grand-louse` | `gmlp-talabat-stg-3460` |
| Vendor | `busy-puma` | `gmlp-vendor-stg-8346` |

Command pattern: `gcloud container clusters get-credentials {cluster_name} --region us-east1 --project {project}`

Verify: `kubectl get pods -n <namespace>` (VPN required)

### Cloud Notebook Cluster Connection

From Cloud Notebooks, use the `--internal-ip` flag:

```bash
# Shared cluster
gcloud container clusters get-credentials definite-serval --region us-east1 --project global-mlp-stg-2182 --internal-ip

# Dedicated clusters — same commands as above but add --internal-ip
```

### Discovering Production Cluster Details

Production cluster names are not listed above. Use these commands to discover them:

```bash
# Find the cluster name for a production GCP project
gcloud container clusters list --project {gcp_project} --format="value(name)"

# Find service accounts in a namespace
kubectl get sa -n {namespace} --no-headers -o custom-columns=NAME:.metadata.name
```

Production GCP projects follow the pattern `gmlp-{vertical}-prod-{id}`. Known production projects are listed in the "GCP Service Accounts — Dedicated Clusters — Production" section below.

### Known Production Cluster Names

| Vertical | Cluster Name | GCP Project |
|---|---|---|
| Shared | `moved-fish` | `global-mlp-prod-3715` |
| QCommerce | `holy-herring` | `gmlp-qc-prod-9277` |
| Consumer | `liberal-sturgeon` | `gmlp-consumer-prod-7194` |
| Logistics | `crisp-chicken` | `gmlp-logistics-prod-6592` |
| Glovo | `trusting-trout` | `gmlp-glovo-prod-7237` |
| Talabat | `glad-urchin` | `gmlp-talabat-prod-0928` |

---

## Staging to Production Migration

When switching a `.metaflowconfig.env` from staging to production, apply these changes:

### 1. Determine the production stamp

Look up the production stamp for the vertical in the Environment Stamps table below. The stamp is the short identifier embedded in resource names (e.g., `nuts` → `r3c2` for QC).

### 2. Values that change

| Variable | Change |
|---|---|
| `METAFLOW_SERVICE_URL` | Replace staging stamp with production stamp; external URLs also drop `-stg` (see Service URLs below) |
| `METAFLOW_DATASTORE_SYSROOT_GS` | Replace staging stamp with production stamp in bucket name |
| `METAFLOW_KUBERNETES_SERVICE_ACCOUNT` | Replace staging stamp with production stamp |
| `METAFLOW_SERVICE_INTERNAL_URL` | Replace staging stamp with production stamp (see Internal URL pattern in `metaflow-config.md`) |
| `METAFLOW_ARGO_EVENTS_SERVICE_ACCOUNT` | Same as `METAFLOW_KUBERNETES_SERVICE_ACCOUNT` |
| `METAFLOW_ARGO_WORKFLOWS_UI_URL` | Use production URL from Service URLs section below |
| `METAFLOW_KUBERNETES_SECRETS` | Replace staging stamp with production stamp |

### 3. Values that stay the same

The following variables stay the same (except for updating the slack channel to prod if desired):
- `METAFLOW_KUBERNETES_NAMESPACE`
- `METAFLOW_KUBERNETES_CONTAINER_REGISTRY`
- `METAFLOW_ARGO_EVENTS_WEBHOOK_URL`
- `METAFLOW_ARGO_EVENTS_EVENT_BUS`
- `METAFLOW_ARGO_EVENTS_EVENT_SOURCE`
- `METAFLOW_ARGO_EVENTS_EVENT`
- `METAFLOW_ARTIFACT_LOCALROOT`
- `METAFLOW_DEFAULT_PACKAGE_SUFFIXES`
- `METAFLOW_KUBERNETES_LABELS`

### 4. Connect to the production cluster

```bash
# Discover the production cluster name
gcloud container clusters list --project {prod_gcp_project} --format="value(name)"
# Connect
gcloud container clusters get-credentials {cluster_name} --region us-east1 --project {prod_gcp_project}
```

---

## Namespaces & K8s Service Accounts

### Shared Cluster

| Entity | Namespace | K8s Service Account |
|---|---|---|
| Consumer | `gmlp-user-consumer` | `gmlp-user-consumer-mdai-http-svc` |
| QCommerce | `gmlp-user-qc` | `gmlp-user-qc-mdai-http-svc` |
| Pandora | `gmlp-user-pandora` | `gmlp-user-pandora-mdai-http-svc` |
| Glovo | `gmlp-user-glovo` | `gmlp-user-glovo-mdai-http-svc` |
| Talabat | `gmlp-user-talabat` | `gmlp-user-talabat-mdai-http-svc` |
| GIS | `gmlp-user-gis` | `gmlp-user-gis-mdai-http-svc` |
| Vendor | `gmlp-user-vendor` | `gmlp-user-vendor-mdai-http-svc` |
| FinTech | `gmlp-user-fintech` | `gmlp-user-fintech-mdai-http-svc` |
| eFood | `gmlp-user-efood` | `gmlp-user-efood-mdai-http-svc` |
| PeYa | `gmlp-user-peya` | `gmlp-user-peya-mdai-http-svc` |

### Dedicated Clusters

| Entity | Namespace | K8s Service Account |
|---|---|---|
| QCommerce | `gmlp-qc-user` | `gmlp-qc-user-nuts-http-svc` |
| Consumer | `gmlp-consumer-user` | `gmlp-consumer-user-8h80-http-svc` |
| FinTech | `gmlp-fintech-user` | `gmlp-fintech-user-v58i-http-svc` |
| Logistics | `gmlp-logistics-user` | `gmlp-logistics-user-35t3-http-svc` |
| Glovo | `gmlp-glovo-user` | `gmlp-glovo-user-l7e5-http-svc` |
| Talabat | `gmlp-talabat-user` | `gmlp-talabat-user-wtcg-http-svc` |
| Vendor | `gmlp-vendor-user` | `gmlp-vendor-user-0580-http-svc` |

---

## Environment Stamps

Stamps are short identifiers embedded in resource names (GCS buckets, service accounts, internal URLs).

| Environment | Stamp |
|---|---|
| Shared Staging | `mdai` |
| Shared Production | `8hs7` |
| QC Dedicated Staging | `nuts` |
| QC Dedicated Production | `r3c2` |
| Consumer Dedicated Staging | `8h80` |
| Consumer Dedicated Production | `ig0b` |
| FinTech Dedicated Staging | `v58i` |
| Logistics Dedicated Staging | `35t3` |
| Logistics Dedicated Production | `ufbx` |
| Glovo Dedicated Staging | `l7e5` |
| Glovo Dedicated Production | `h44r` |
| Talabat Dedicated Staging | `wtcg` |
| Talabat Dedicated Production | `ct27` |
| Vendor Dedicated Staging | `0580` |

---

## Service URLs

### Shared Cluster

| Service | Staging | Production |
|---|---|---|
| Metaflow | `https://gmlp-metaflow-stg.deliveryhero.io/` | `https://gmlp-metaflow.deliveryhero.io/` |
| Argo Workflows | `https://gmlp-argo-workflows-stg.deliveryhero.io/` | `https://gmlp-argo-workflows.deliveryhero.io/` |
| MLflow | `https://gmlp-mlflow-stg.deliveryhero.io/` | `https://gmlp-mlflow.deliveryhero.io/` |

### Dedicated Clusters — Staging

| Vertical | Metaflow | Argo | MLflow |
|---|---|---|---|
| QC | `https://gmlp-qc-metaflow-stg.deliveryhero.io/` | `https://gmlp-qc-argo-workflows-stg.deliveryhero.io/` | `https://gmlp-qc-mlflow-stg.deliveryhero.io/` |
| Consumer | `https://gmlp-consumer-metaflow-stg.deliveryhero.io/` | `https://gmlp-consumer-argo-workflows-stg.deliveryhero.io/` | `https://gmlp-consumer-mlflow-stg.deliveryhero.io/` |
| Logistics | `https://gmlp-logistics-metaflow-stg.deliveryhero.io/` | `https://gmlp-logistics-argo-workflows-stg.deliveryhero.io/` | `https://gmlp-logistics-mlflow-stg.deliveryhero.io/` |
| Glovo | `https://gmlp-glovo-metaflow-stg.deliveryhero.io/` | `https://gmlp-glovo-argo-workflows-stg.deliveryhero.io/` | `https://gmlp-glovo-mlflow-stg.deliveryhero.io/` |
| FinTech | `https://gmlp-fintech-metaflow-stg.deliveryhero.io/` | `https://gmlp-fintech-argo-workflows-stg.deliveryhero.io/` | `https://gmlp-fintech-mlflow-stg.deliveryhero.io/` |
| Talabat | `https://gmlp-talabat-metaflow-stg.deliveryhero.io/` | `https://gmlp-talabat-argo-workflows-stg.deliveryhero.io/` | `https://gmlp-talabat-mlflow-stg.deliveryhero.io/` |
| Vendor | `https://gmlp-vendor-metaflow-stg.deliveryhero.io/` | `https://gmlp-vendor-argo-workflows-stg.deliveryhero.io/` | `https://gmlp-vendor-mlflow-stg.deliveryhero.io/` |

### Dedicated Clusters — Production

URL pattern: remove `-stg` from the staging URL. Examples:
- QC Metaflow Production: `https://gmlp-qc-metaflow.deliveryhero.io/`
- Consumer Argo Production: `https://gmlp-consumer-argo-workflows.deliveryhero.io/`

### Langfuse Instance URLs (Staging)

| Vertical | URL |
|---|---|
| Logistics | `https://gmlp-logistics-langfuse-stg.deliveryhero.io` |
| QCommerce | `https://gmlp-qc-langfuse-stg.deliveryhero.io` |
| Vendor | `https://gmlp-vendor-langfuse-stg.deliveryhero.io` |

### Cloud Notebook Service URLs

Cloud Notebooks use different gateway URLs than VPN external URLs. These are auto-configured in `flow.env` when using a container image.

**Shared Cluster:**

| Service | URI |
|---|---|
| Metaflow | `https://gmlp-metaflow-mdai-metadata-svc-gw.us-east1.int-1734708406dncs.gcp.dhplatform.cloud/metaflow-metadata` |
| MLflow | `https://gmlp-mlflow-mdai-mlflow-svc-gw.us-east1.int-1734708406dncs.gcp.dhplatform.cloud/` |

**Dedicated Clusters — Metaflow:**

| Vertical | Metaflow Service URL |
|---|---|
| QCommerce | `https://gmlp-qc-metaflow-nuts-metadata-svc-gw.us-east1.int-1754490571iioz.gcp.dhplatform.cloud/metaflow-metadata` |
| Consumer | `https://gmlp-consumer-metaflow-8h80-metadata-svc-gw.us-east1.int-1753174129alcq.gcp.dhplatform.cloud/metaflow-metadata` |
| FinTech | `https://gmlp-fintech-metaflow-v58i-metadata-svc-gw.us-east1.int-1751294745lxsz.gcp.dhplatform.cloud/metaflow-metadata` |
| Logistics | `https://gmlp-logistics-metaflow-35t3-metadata-svc-gw.us-east1.int-1752655937tgph.gcp.dhplatform.cloud/metaflow-metadata` |
| Glovo | `https://gmlp-glovo-metaflow-l7e5-metadata-svc-gw.us-east1.int-1761149177irqc.gcp.dhplatform.cloud/metaflow-metadata` |

**Dedicated Clusters — MLflow:**

| Vertical | MLflow Service URI |
|---|---|
| QCommerce | `https://gmlp-qc-mlflow-nuts-mlflow-svc-gw.us-east1.int-1754490571iioz.gcp.dhplatform.cloud/` |
| Consumer | `https://gmlp-consumer-mlflow-8h80-mlflow-svc-gw.us-east1.int-1753174129alcq.gcp.dhplatform.cloud/` |
| Logistics | `https://gmlp-logistics-mlflow-35t3-mlflow-svc-gw.us-east1.int-1752655937tgph.gcp.dhplatform.cloud/` |
| Glovo | `https://gmlp-glovo-mlflow-l7e5-mlflow-svc-gw.us-east1.int-1761149177irqc.gcp.dhplatform.cloud/` |

---

## Slack Notification Channels

For Argo Workflow failure alerts. Can use custom channel instead (ensure GMLP Bot app is added).

| Entity | Staging | Production |
|---|---|---|
| Consumer | `#gmlp-consumer-stg-notifications` | `#gmlp-consumer-prod-notifications` |
| QCommerce | `#gmlp-qc-stg-notifications` | `#gmlp-qc-prod-notifications` |
| Pandora | `#gmlp-pandora-stg-notifications` | `#gmlp-pandora-prod-notifications` |
| Logistics | `#gmlp-logistics-stg-notifications` | `#gmlp-logistics-prod-notifications` |
| GIS | `#gmlp-gis-stg-notifications` | `#gmlp-gis-prod-notifications` |
| FinTech | `#gmlp-fintech-stg-notifications` | `#gmlp-fintech-prod-notifications` |
| Glovo | `#gmlp-glovo-stg-notifications` | `#gmlp-glovo-prod-notifications` |
| Vendor | `#gmlp-vendor-stg-notifications` | `#gmlp-vendor-prod-notifications` |
| eFood | `#gmlp-efood-stg-notifications` | `#gmlp-efood-prod-notifications` |
| Talabat | `#gmlp-talabat-stg-notifications` | `#gmlp-talabat-prod-notifications` |

Configure via: `METAFLOW_KUBERNETES_LABELS=slack_alerts_channel={channel-name-without-hash}`

---

## Backend Applications (Developer Portal)

### Shared Cluster
Pattern: `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-{entity}`

| Entity | URL |
|---|---|
| Consumer | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-consumer` |
| QCommerce | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-qc` |
| Pandora | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-pandora` |
| FinTech | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-fintech` |
| Glovo | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-glovo` |
| Talabat | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-talabat` |
| Vendor | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-vendor` |
| GIS | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-gis` |
| eFood | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-user-efood` |

### Dedicated Clusters
Pattern: `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-{vertical}-user`

| Entity | URL |
|---|---|
| Consumer | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-consumer-user` |
| QCommerce | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-qc-user` |
| FinTech | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-fintech-user` |
| Logistics | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-logistics-user` |
| Glovo | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-glovo-user` |
| Talabat | `https://dev.deliveryhero.net/catalog/default/backendapp/gmlp-talabat-user` |

---

## GCP Service Accounts

For accessing entity cloud resources (BigQuery, GCS buckets).

### Shared Cluster — Staging (project: `global-mlp-stg-2182`)

| Entity | Service Account |
|---|---|
| Consumer | `oam-308b4d6ae222569b0fdc12fadd@global-mlp-stg-2182.iam.gserviceaccount.com` |
| QCommerce | `oam-b416dd5c6de68aa316992287e3@global-mlp-stg-2182.iam.gserviceaccount.com` |
| Pandora | `oam-725ea564ffbc8e09bbafa6a19c@global-mlp-stg-2182.iam.gserviceaccount.com` |
| Glovo | `oam-7055502314038626615a40fb46@global-mlp-stg-2182.iam.gserviceaccount.com` |
| Talabat | `oam-4cc16d3024bf553081fc552433@global-mlp-stg-2182.iam.gserviceaccount.com` |
| GIS | `oam-b1b5004c971f4e4e4596ad8a36@global-mlp-stg-2182.iam.gserviceaccount.com` |
| Vendor | `oam-fdc7cb09ec69b4630c0d34cb0d@global-mlp-stg-2182.iam.gserviceaccount.com` |
| FinTech | `oam-815f6c27bc010a3b5f53f91367@global-mlp-stg-2182.iam.gserviceaccount.com` |
| eFood | `oam-aca54765a24139533d5ea43234@global-mlp-stg-2182.iam.gserviceaccount.com` |

### Shared Cluster — Production (project: `global-mlp-prod-3715`)

| Entity | Service Account |
|---|---|
| Consumer | `oam-b657a78ee58bde781bb4cca0ad@global-mlp-prod-3715.iam.gserviceaccount.com` |
| QCommerce | `oam-42d9db1ebb95f67800ab8e729c@global-mlp-prod-3715.iam.gserviceaccount.com` |
| Pandora | `oam-e34880084ff303a3fbec67d526@global-mlp-prod-3715.iam.gserviceaccount.com` |
| Glovo | `oam-e627d803aa12923852911d1f06@global-mlp-prod-3715.iam.gserviceaccount.com` |
| Talabat | `oam-598f140f10b1e742745449eb0d@global-mlp-prod-3715.iam.gserviceaccount.com` |
| GIS | `oam-838f6dd1b62d9905eb2fbec238@global-mlp-prod-3715.iam.gserviceaccount.com` |
| Vendor | `oam-e4b5896395b83e46df45cef288@global-mlp-prod-3715.iam.gserviceaccount.com` |
| FinTech | `oam-bbc349821f764ed0b073547318@global-mlp-prod-3715.iam.gserviceaccount.com` |
| eFood | `oam-0e5b08d02b3604b0d64f69ccb3@global-mlp-prod-3715.iam.gserviceaccount.com` |

### Dedicated Clusters — Staging

| Entity | Service Account |
|---|---|
| QCommerce | `oam-f1e019f7ea382906b7d843a64b@gmlp-qc-stg-7461.iam.gserviceaccount.com` |
| Consumer | `oam-4343cb86c9efb2268d94c4e76a@gmlp-consumer-stg-8442.iam.gserviceaccount.com` |
| FinTech | `oam-192c181adfaf5809d456a9c3c3@gmlp-fintech-stg-4079.iam.gserviceaccount.com` |
| Logistics | `oam-68d9daf50b707e3d25ad10639e@gmlp-logistics-stg-8782.iam.gserviceaccount.com` |
| Glovo | `oam-7d38b5464c0c12d603d193a75d@gmlp-glovo-stg-0601.iam.gserviceaccount.com` |
| Talabat | `oam-7d6338dab3521fb3acdf5ca01b@gmlp-talabat-stg-3460.iam.gserviceaccount.com` |

### Dedicated Clusters — Production

| Entity | Service Account |
|---|---|
| QCommerce | `oam-c156b7f95a87aa10fc19ed867d@gmlp-qc-prod-9277.iam.gserviceaccount.com` |
| Consumer | `oam-fb84b9a40dcacdd826ee71956a@gmlp-consumer-prod-7194.iam.gserviceaccount.com` |
| Logistics | `oam-bcea5cb6dc0ae262ffd91a0b26@gmlp-logistics-prod-6592.iam.gserviceaccount.com` |
| Glovo | `oam-2aec69ce750a2287d6a435535c@gmlp-glovo-prod-7237.iam.gserviceaccount.com` |
| Talabat | `oam-e6fe10876ea95b8b1310c9ad56@gmlp-talabat-prod-0928.iam.gserviceaccount.com` |
