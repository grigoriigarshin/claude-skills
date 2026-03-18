---
name: arch-report
description: Generate a high-level architecture overview document for a Python ML/GenAI repository. Use when user asks to document repo architecture, generate architecture diagrams, create system overview, explain how a codebase is structured, or produce an ARCHITECTURE.md file. Triggered by /arch-report command.
metadata:
  author: Mundher Al
  version: 1.0.0
---

# arch-report — Architecture Overview Generator

Generates `ARCHITECTURE.md` at the repo root. Tailored for **Python ML/GenAI** codebases. Focus on **system-level understanding** — NOT code-level details (no classes, functions, or line-by-line).

## Phase 1: Explore

Build a mental model before writing anything.

**1.1 — Project purpose**: Read `README.md`, `CLAUDE.md`, `docs/`, `pyproject.toml`, `setup.py`.

**1.2 — Tech stack**: Scan dependency files for:
- ML frameworks: `torch`, `tensorflow`, `scikit-learn`, `xgboost`, `jax`
- GenAI/LLM: `langchain`, `llama-index`, `openai`, `anthropic`, `transformers`, `vllm`
- Orchestration: `metaflow`, `airflow`, `prefect`, `dagster`, `kubeflow`
- Experiment tracking: `mlflow`, `wandb`, `dvc`
- Serving: `fastapi`, `flask`, `bentoml`, `triton`, `ray[serve]`, `litserve`
- Vector DBs: `chromadb`, `pinecone`, `qdrant`, `pgvector`
- Feature stores: `feast`, `tecton`
- Data: `pandas`, `polars`, `pyspark`, `dask`
- Storage/DB: `boto3`, `google-cloud-storage`, `sqlalchemy`, `redis`

**1.3 — Components**: Explore directory structure. Look for:
- `pipelines/`, `flows/`, `dags/` — orchestration
- `models/`, `training/`, `inference/` — model lifecycle
- `features/`, `data/`, `preprocessing/` — data pipeline
- `serving/`, `api/`, `endpoints/` — model serving
- `prompts/`, `chains/`, `agents/` — LLM/GenAI patterns
- `Dockerfile`, `k8s/`, `terraform/`, `helm/` — infrastructure

**1.4 — Trace the pipeline**: Identify which pattern the repo follows:
- Training: Data → Preprocessing → Feature engineering → Training → Evaluation → Registry
- Inference: Request → Preprocessing → Model → Prediction → Response
- RAG: Ingestion → Chunking → Embedding → Vector store → Retrieval → LLM → Response
- Agent: Input → Routing → Tool selection → Execution → Response

**1.5 — Deployment**: Check CI/CD configs, Dockerfiles, IaC, cloud configs, ML-specific deploy (Argo, Seldon, BentoML).

## Phase 2: Write `ARCHITECTURE.md`

Sections to include:

1. **Overview** — 2-3 sentences: what it does, the ML/GenAI problem it solves, why it exists
2. **Tech Stack** — Table with categories: Language, ML Framework, Orchestration, Tracking, Serving, Storage, Deployment, CI/CD. Only include what applies.
3. **System Components** — Bullet list of major components, one-line description each
4. **Architecture Diagram** — Mermaid `flowchart TD` showing how components connect. Max 15 nodes.
5. **Pipeline Flow** — Describe the ML/GenAI pipeline end-to-end. Include a Mermaid `sequenceDiagram` for the primary flow.
6. **Deployment & Infrastructure** — Training infra, serving infra, CI/CD, environments
7. **Key Design Decisions** — Architectural choices/trade-offs. Skip if nothing stands out.

## Phase 3: Verify

1. Re-read `ARCHITECTURE.md`
2. Every component mentioned must exist in the repo
3. Mermaid syntax must be valid
4. No code-level details (no class/function names)

## Rules

- HIGH-LEVEL only — no function names, class names, or code snippets
- Plain language a new team member can understand
- Use bullets and tables, not paragraphs
- Say "Unknown" rather than guessing
- Mermaid diagrams ≤15 nodes with clear labels
- Scale document length to repo size
