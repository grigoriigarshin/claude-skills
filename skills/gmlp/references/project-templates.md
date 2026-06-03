# Project Templates

Copier-based project scaffolding system for standardized ML projects on GMLP.

## Prerequisites

1. App onboarded to GDP via GMLP Automation Template (provides DevPortal app, GitHub repo, DroneCI activation, deployment destinations)
2. Git repo initialized with remote: `git init && git remote add origin https://github.com/deliveryhero/<repo>.git`
3. GMLP CLI with `project` extra installed

### Install CLI with project extra

```bash
# Poetry
poetry add "gmlp-cli[project]" --source gmlp-pypi

# UV
uv add "gmlp-cli[project]"
```

---

## Available Templates

| Template | Purpose |
|---|---|
| `inference-serving-app` | FastAPI-based inference service |
| `training-template` | Metaflow-based training pipelines |
| `minimal` | Shared foundation with Poetry |
| `minimal-uv` | Shared foundation with UV |

Every project needs `minimal` or `minimal-uv` as foundation (applied automatically last).

---

## CLI Commands

### Create a project
```bash
gmlp project init --template-name <template> --output-dir <dir> [--platform <platform>] [--use-uv] [--defaults]
```

### Update existing project
```bash
gmlp project update --output-dir <dir> [--git-ref <tag>] [--defaults]
```

### Combine templates
```bash
gmlp project init \
  --template-name training-template \
  --template-name inference-serving-app \
  --output-dir my-ml-project \
  --platform consumer
```

### Options

| Option | Description | Default |
|---|---|---|
| `--template-name` | Template to apply (repeatable) | Required |
| `--output-dir` | Output directory | Required |
| `--defaults` | Non-interactive mode | `false` |
| `--overwrite` | Overwrite existing files | `false` |
| `--git-ref` | Template repo branch/tag/commit | `main` |
| `--platform` | Team platform for cluster config | `shared` |
| `--use-uv` | Use UV instead of Poetry | `false` |

---

## Available Platforms

| Platform | Staging UID | Production UID | App Prefix |
|---|---|---|---|
| `shared` | `mdai` | `8hs7` | `gmlp` |
| `consumer` | `8h80` | `ig0b` | `gmlp-consumer` |
| `logistics` | `35t3` | `ufbx` | `gmlp-logistics` |
| `qc` | `nuts` | `r3c2` | `gmlp-qc` |
| `glovo` | `l7e5` | `h44r` | `gmlp-glovo` |
| `talabat` | `wtcg` | `ct27` | `gmlp-talabat` |
| `fintech` | `v58i` | N/A | `gmlp-fintech` |
| `vendor` | `0580` | N/A | `gmlp-vendor` |

`--platform` auto-fills cluster connection variables (stamps, project IDs, cluster names, regions).

---

## Per-Platform Cluster Details

See `clusters-and-namespaces.md` for GCP projects, cluster names, and connection commands per platform and environment.

---

## Key Configuration Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `repository_name` | `str` | `my_repository` | Harbor image namespace, kubeconfig |
| `app_name` | `str` | `my-app` | K8s namespace, SA name, `dh_app` label |
| `package_name` | `str` | `my_package` | Source directory, Python module |
| `python_version` | `str` | `3.11.9` | Python version |
| `poetry_version` | `str` | `2.1.1` | Poetry version (minimal only) |
| `uv_version` | `str` | `0.10.8` | UV version (minimal-uv only) |
| `dh_platform` | `str` | `consumer` | Platform label |
| `dh_tribe` | `str` | `shared` | Tribe label |
| `dh_squad` | `str` | `shared` | Squad label |
| `use_mypy` | `bool` | `true` | Enable mypy in CI |
| `use_sqlfluff` | `bool` | `true` | Enable sqlfluff in CI |

---

## Generated Project Structure

```
my-project/
├── .copier-answers.yml          # Template config
├── .drone.yml                   # CI/CD pipeline
├── .gdp/                        # GDP deployment config
├── .metaflow.env                # Metaflow staging config
├── .metaflow.prod.env           # Metaflow production config
├── pyproject.toml
├── justfile                     # Project tasks
├── src/<package_name>/
│   ├── app.py                   # FastAPI app (serving)
│   ├── models/                  # Model implementations (serving)
│   └── flows/                   # Metaflow workflows (training)
├── tests/
└── dockerfiles/
```

Config stored in `.copier-answers.yml` — do not delete (needed for `gmlp project update`).