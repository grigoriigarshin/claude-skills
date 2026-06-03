# Langfuse on GMLP

LLM observability layer for Delivery Hero. Captures traces, observations, scores, and prompts for debugging agents, measuring quality, and tracking cost.

## When to Use Langfuse vs MLflow

| Need | Tool |
|---|---|
| Track scikit-learn / XGBoost / classical ML runs | MLflow Tracking |
| Track LLM calls, prompts, agent traces | **Langfuse** |
| Manage trained model artifacts and lineage | MLflow Registry |

---

## Network Access

Langfuse sits behind Cloudflare. Local SDKs cannot authenticate via Okta web screen. The SDK will silently fail with `302` or `401` redirects without proper proxy config.

**Fix**: Use `gmlp-proxy` and ensure it is running locally before SDK calls.

---

## Instance URLs

See `clusters-and-namespaces.md` → "Langfuse Instance URLs" for per-vertical URLs.

Login: Click **Sign in with Okta** (username/password sign-up is disabled).

---

## Organization & Project Setup

Each instance has one pre-created organization per vertical (e.g., `GMLP Logistics`). First Okta login auto-provisions you as a member.

**Rules:**
- Create use cases as **Projects** inside the pre-assigned organization
- Do NOT create new organizations
- Project naming convention: `[use-case]-[environment]`
- Each project has isolated API credentials, prompt repos, datasets, and traces

If you don't see your org after login: ask in [#global-mlp-support](https://deliveryhero.enterprise.slack.com/archives/C08E98U9U31).

---

## API Keys

1. In project → **Settings → API Keys → Create new API keys**
2. You get:
   - `pk-lf-...` (public key — safe in code)
   - `sk-lf-...` (secret key — store in secret manager)
3. Secret is only shown once

---

## Known Limitations

### Batch Export Download via UI

UI shows export as **Failed** because Langfuse can't generate a signed download URL. The CSV/JSON is actually written to GCS.

**Workaround**: Download directly from GCS bucket:

| Vertical | Staging Bucket |
|---|---|
| Logistics | `gs://gmlp-logistics-langfuse-35t3-storage/-/batch-export/` |
| QCommerce | `gs://gmlp-qc-langfuse-nuts-storage/-/batch-export/` |
| Vendor | `gs://gmlp-vendor-langfuse-0580-storage/-/batch-export/` |

Files: `<timestamp>-lf-traces-export-<project-id>.csv` (expire after 14 days).

Each failed export retries with exponential backoff (~6s, 10s, 20s, 40s) — expect ~8 duplicate files per UI click.

### No Email Notifications

SMTP env vars aren't configured. No emails go out for batch export completion.

---

## POC Migration

If you used `gmlp-langfuse-test.deliveryhero.io`, follow the POC → MVP migration guide to move traces, datasets, and references to your vertical's dedicated instance.