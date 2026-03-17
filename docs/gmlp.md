# GMLP Skill

**Global Machine Learning Platform** — Delivery Hero's internal ML platform.

## Purpose

This skill gives Claude Code deep knowledge of GMLP so it can help engineers with:

- Setting up and configuring Metaflow workflows (local and Kubernetes runs)
- MLflow experiment tracking and model registry
- Deploying scheduled flows with Argo Workflows and DroneCI
- Navigating GMLP's GKE clusters (shared and dedicated per vertical)
- App onboarding via Developer Portal and `gmlp-infra` repo
- TTM (time-to-market) tracking with `gmlp_id`
- GMLP SDK packages (`gmlp_metaflow`, `gmlp_cli`, serving tools)
- Troubleshooting common errors (VPN issues, GCS permissions, pod terminations)

## Topics Covered

| Topic | Reference File | What It Covers |
|-------|---------------|----------------|
| Clusters & Namespaces | `clusters-and-namespaces.md` | GKE cluster stamps, namespace patterns, service accounts, `get-credentials` commands |
| Metaflow Config | `metaflow-config.md` | `.metaflowconfig.env` variables for local and K8s runs, cost labels, secrets |
| MLflow | `mlflow-guide.md` | Tracking URIs, experiment setup, model registry, nested runs, model promotion |
| SDK & CLI | `sdk-reference.md` | `gmlp_cli`, `@kubernetes_optional`, `@schedule_optional`, Argo deploy, Artifact Registry |
| Advanced Topics | `advanced-topics.md` | GPU usage, node selection, cross-cloud (AWS), Drone CI, Dockerfiles, debugging, retries |
| App Onboarding | `app-onboarding.md` | Developer Portal setup, `app.yaml`, namespace creation, CI/CD, IAM grants |
| TTM Tracking | `ttm-tracking.md` | `gmlp_id`, lifecycle stages, dashboards, tagging MLflow runs |
| Troubleshooting | `troubleshooting.md` | Common errors and fixes — VPN, permissions, pod issues, image registry |

## Trigger Keywords

The skill activates when a user mentions terms like: Metaflow, MLflow, GMLP, Kubernetes clusters, `metaflowconfig.env`, Argo Workflows, `gmlp_cli`, GPU usage, cross-cloud, app onboarding, TTM tracking, `gmlp_id`, or common GMLP error messages (`JSONDecodeError`, `403 Forbidden`, pod termination).

## Installation

Symlink the skill into your personal or project skills directory:

```bash
# Personal (all projects)
ln -s ~/claude-skills/skills/gmlp ~/.claude/skills/gmlp

# Or project-specific
mkdir -p .claude/skills
ln -s ~/claude-skills/skills/gmlp .claude/skills/gmlp
```

See the [main README](../README.md) for full installation instructions.
