# Troubleshooting

Errors grouped by category. Match the error message pattern to find the fix.

## Metaflow / Argo Workflows

### `json.decoder.JSONDecodeError` when running a flow
- **Pattern**: `JSONDecodeError: Expecting value: line 1 column 1`
- **Cause**: Not connected to VPN. Metaflow HTTP response is empty/invalid.
- **Fix**: Connect to VPN, retry.

### `Incorrect version for metaflow service` on deploy
- **Pattern**: `Incorrect version for metaflow service`
- **Cause**: Network issue (not actually a version mismatch despite the error message).
- **Fix**: Connect to VPN, retry.

### `Invalid value for '--datastore': gs`
- **Pattern**: `Invalid value for '--datastore': invalid choice: "gs"`
- **Cause**: Metaflow environment configuration not exported.
- **Fix**: `export $(cat .metaflowconfig.env)`, then retry.

### `cannot create resource workflowtemplates` permission error
- **Pattern**: `workflowtemplates.argoproj.io is forbidden`
- **Cause**: Missing Kubernetes RBAC permissions for the user.
- **Fix**: Request GMLP cluster access via [#global-mlp-support](https://slack.com/app_redirect?channel=C08E98U9U31).

### `bash: line 1: [: -le: unary operator expected` and `tar: job.tar: Cannot open`
- **Pattern**: `[: -le: unary operator expected` + `tar: job.tar: Cannot open`
- **Cause**: Code package download failed inside K8s pod. Docker user lacks write permission.
- **Fix**: Ensure Docker user has write permission to the container working directory.

### `Pod was terminated in response to imminent node shutdown`
- **Pattern**: `Pod was terminated in response to imminent node shutdown`
- **Cause**: Spot instance preemption (default on GMLP, up to 91% savings).
- **Fix options**:
  1. Add `@retry` decorator with idempotent code (recommended)
  2. Use on-demand nodes: `@kubernetes(node_selector="cloud.google.com/gke-spot=false")` or `@kubernetes(node_selector="cloud.google.com/compute-class=gmlp-performance-on-demand")`

### `AssumeRoleWithWebIdentity` AccessDenied
- **Pattern**: `AccessDenied` + `AssumeRoleWithWebIdentity`
- **Cause**: `AWS_ROLE_ARN` is hardcoded in the codebase.
- **Fix**: Remove manual `AWS_ROLE_ARN` exports from code/scripts.

---

## App Onboarding

### Argo Workflows `is forbidden` error
- **Pattern**: `workflowtaskresults.argoproj.io ... is forbidden`
- **Cause**: Service Account missing RBAC permissions (escapehatch not deployed).
- **Fix**: Complete the full PR and `atlantis apply` workflow for `app.yaml` escapehatch component.

### GCS `403 Forbidden`
- **Pattern**: `403 ... does not have storage.objects.get access`
- **Cause**: Missing IAM permissions on GCS bucket owned by another service.
- **Fix**: Create PR in `gmlp-infra` (or `dh-mlp-infra` for shared cluster) to add `externalgrant` for your app.

### Service Account Not Found
- **Pattern**: `serviceaccount "..." not found`
- **Cause**: `METAFLOW_KUBERNETES_SERVICE_ACCOUNT` doesn't match the OAM component name in `app.yaml`.
- **Fix**: Verify match: `kubectl get sa -n {namespace}`. Note: SA names differ between staging and production due to different stamps.

### `kubectl` i/o timeout
- **Pattern**: `i/o timeout` or `dial tcp ... timeout`
- **Cause**: Not connected to VPN.
- **Fix**: Connect to VPN, retry.

### Default service account permissions error
- **Pattern**: `system:serviceaccount:{namespace}:default` + `does not have` or `is forbidden`
- **Cause**: Using `default` SA instead of correct one. Wrong `METAFLOW_KUBERNETES_SERVICE_ACCOUNT`.
- **Fix**: Set `METAFLOW_KUBERNETES_SERVICE_ACCOUNT` to the correct SA. Find it: `kubectl get sa -n {namespace}`

---

## Cloud Notebooks

### `Permission Denied` when creating Cloud Notebook
- **Pattern**: `needs iam.serviceAccounts.ActAs (Service Account User) permission on VM Service Account`
- **Cause**: User lacks `iam.serviceAccounts.ActAs` on the notebook VM service account.
- **Fix**: Request `iam.serviceAccounts.ActAs` permission from IAM team (platform engineering, Datahub, or SRE). Provide your email and the exact Service Account from the error message.

### Artifact Registry `IAM_PERMISSION_DENIED` in Cloud Notebook
- **Pattern**: `IAM_PERMISSION_DENIED` in notebook terminal for artifact registry operations
- **Cause**: Notebook terminal not authenticated with user account.
- **Fix**:
  1. `gcloud auth list` — check active account
  2. If wrong: `gcloud auth login --no-browser`
  3. `gcloud config set account [YOUR_GMAIL_ADDRESS]`
  4. Retry the operation

---

## Artifact Registry

### `Failed to find credentials` error
- **Pattern**: `Failed to find credentials`
- **Cause**: Authentication plugin not installed.
- **Fix**: `pip install keyrings.google-artifactregistry-auth` — verify with `pip show keyrings.google-artifactregistry-auth`

---

## Langfuse

### `302` or `401` redirects from Langfuse SDK
- **Pattern**: SDK silently fails, logs show `302` or `401` responses
- **Cause**: Langfuse sits behind Cloudflare. Local SDKs cannot authenticate via Okta web screen without proxy.
- **Fix**: Start `gmlp-proxy` locally before making SDK calls. Verify proxy is running.

---

## MCP Servers

### `gmlp-docs requires GITHUB_PERSONAL_ACCESS_TOKEN`
- **Fix (Claude Code)**: Auto-inserted if unset. Otherwise: `export GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token)`
- `gmlp mcp list` also flags values that are literal `${VAR:-}` placeholders or unexecuted `$(...)`.

### `docker not found on PATH` / `docker daemon not reachable`
- **Cause**: `gmlp-docs` server runs in Docker container.
- **Fix**: Install Docker Desktop or Colima. Start with `colima start`. Verify: `docker info`.

### `GITHUB_PERSONAL_ACCESS_TOKEN is invalid or expired`
- **Fix**: `export GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token)` or generate new PAT at github.com/settings/tokens.

### `uvx not found on PATH`
- **Cause**: `drone` MCP server requires `uvx`.
- **Fix**: `curl -LsSf https://astral.sh/uv/install.sh | sh` — verify: `uvx --version`.

### `UV_INDEX not reachable`
- **Cause**: VPN disconnected or stale gcloud token.
- **Fix**: Connect VPN + `gcloud auth print-access-token`. Set: `export UV_INDEX="https://oauth2accesstoken:$(gcloud auth print-access-token)@europe-python.pkg.dev/dp-common-infra-5780/developer-platform-python/simple/"`

### `DRONE_TOKEN is invalid or expired` / `drone server not reachable`
- **Fix**: VPN issue or stale token. Connect VPN. Copy fresh token from `drone-ci.deliveryhero.net/account`.

### Server starts but assistant says it has no tools
- **Fix**: Run `gmlp mcp start <server>` directly in terminal. If it exits with error, fix the underlying cause before retrying from MCP client.

---

## Harbor Images

### Debugging container images

```bash
# Start Docker (macOS with Colima)
colima start

# Pull image
docker pull harbor.deliveryhero.net/container/deliveryhero/<repo>:<tag>

# Start interactive shell
docker run -it --entrypoint /bin/bash harbor.deliveryhero.net/container/deliveryhero/<repo>:<tag>

# Debug inside container
pip list          # List Python packages
env               # View environment variables
python --version  # Check Python version
```

If `/bin/bash` not available, try `/bin/sh`.
