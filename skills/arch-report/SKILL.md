---
name: arch-report
description: >
  Generate an architecture and mechanisms overview document for a Python ML/GenAI repository.
  Use when user asks to document repo architecture, explain how training or inference works,
  understand prompt logic, generate architecture diagrams, create system overview, explain how
  a codebase is structured, or produce an ARCHITECTURE.md file. Triggered by /arch-report command.
metadata:
  author: Mundher Al
  version: 2.0.0
---

# arch-report — Architecture & Mechanisms Overview Generator

Generates `ARCHITECTURE.md` at the repo root. Tailored for **Python ML/GenAI** codebases.

Explain at a **conceptual level** — what happens, in what order, why — but never at function/class level. No function names, class names, variable names, or code snippets.

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

**1.4 — Training mechanics** (skip if no training code):
- What data is consumed and how is it loaded/batched?
- What preprocessing or feature engineering happens before the model sees data?
- What model architecture is used? (e.g., transformer, gradient-boosted trees, CNN)
- What loss function, optimizer, and training strategy? (e.g., cross-entropy + AdamW + cosine LR schedule)
- How are experiments tracked? What metrics are logged?
- How is the trained model saved, versioned, and promoted to production?

**1.5 — Inference mechanics** (skip if no inference/serving code):
- How does a request arrive? (API endpoint, batch job, streaming consumer)
- What preprocessing happens to the input before the model sees it?
- How is the model loaded? (at startup, lazy-loaded, multiple model versions)
- What postprocessing happens to model output? (thresholds, formatting, filtering, ranking)
- How are results returned? (sync response, async callback, written to storage)
- What latency/throughput optimizations exist? (batching, caching, quantization, GPU inference)

**1.6 — Prompts and LLM logic** (skip if no prompts/chains/agents):
- Read all prompt templates and system prompts. Understand each prompt's purpose.
- What is the prompting strategy? (zero-shot, few-shot, chain-of-thought, tool-use)
- How are prompts composed? (static templates, dynamic variable injection, multi-turn)
- What chain/agent orchestration exists? (sequential chains, branching logic, retries, fallbacks)
- What guardrails or output parsing is applied to LLM responses?

**1.7 — Deployment**: Check CI/CD configs, Dockerfiles, IaC, cloud configs, ML-specific deploy (Argo, Seldon, BentoML).

## Phase 2: Write `ARCHITECTURE.md`

Use findings from Phase 1 directly. Each section maps to an exploration step — do not re-investigate.

1. **Overview** — 2-3 sentences: what it does, the ML/GenAI problem it solves, why it exists
2. **Tech Stack** — Table: Language, ML Framework, Orchestration, Tracking, Serving, Storage, Deployment, CI/CD. Only include what applies.
3. **System Components** — Bullet list of major components, one-line description each. Include a Mermaid `flowchart TD` showing how they connect. Max 15 nodes.
4. **How Training Works** — (from 1.4) Explain end-to-end: data in → preparation → model → output. Include Mermaid `flowchart LR` for training stages. Mention model type, loss, optimizer, hyperparameter strategy in plain language.
5. **How Inference Works** — (from 1.5) Explain end-to-end: request → preprocessing → model → postprocessing → response. Include Mermaid `sequenceDiagram` for the primary flow. Mention latency optimizations if any.
6. **Prompt & LLM Logic** — (from 1.6) For each major prompt/chain: what it does, strategy (few-shot, CoT, tool-use), inputs, outputs. Use a table if multiple prompts. Explain orchestration logic (chain flow, retries, fallbacks). Summarize intent — do NOT paste raw prompt text.
7. **Data Flow** — Mermaid `flowchart LR` showing how data moves end-to-end across both training and inference paths. Skip if only one path exists and it's already covered above.
8. **Deployment & Infrastructure** — (from 1.7) Training infra, serving infra, CI/CD, environments
9. **Key Design Decisions** — Architectural choices/trade-offs. Skip if nothing stands out.

Omit any section that doesn't apply.

## Phase 3: Verify

1. Re-read `ARCHITECTURE.md`
2. Every component mentioned must exist in the repo
3. Mermaid syntax must be valid
4. Mechanisms explain the "how and why", not just list steps
5. No function names, class names, or code snippets anywhere

## Rules

- Plain language a new team member can understand
- Use bullets and tables, not paragraphs
- Say "Unknown" rather than guessing
- Mermaid diagrams ≤15 nodes with clear labels
- Scale document length to repo size
