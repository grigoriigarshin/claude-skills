# GMLP Claude Plugin & MCP Servers

Collection of Claude Code plugins for GMLP development workflows. Distributed via Claude Code marketplace.

## Installation

### 1. Add marketplace
```
/plugin marketplace add deliveryhero/gmlp-claude-plugin
```

### 2. Install plugins
```
/plugin install gmlp-core@gmlp-marketplace
/plugin install gmlp-metaflow@gmlp-marketplace
/plugin install gmlp-mcp-argo@gmlp-marketplace
/plugin install gmlp-mcp-drone@gmlp-marketplace
/plugin install gmlp-mcp-jira@gmlp-marketplace
/plugin install gdp-helper@gmlp-marketplace
/plugin install gmlp-incident@gmlp-marketplace
/plugin install gmlp-project-template@gmlp-marketplace
/plugin install gmlp-autoresearch@gmlp-marketplace
```

`gmlp-metaflow` requires `gmlp-core` — always install `gmlp-core` first.

### 3. Scope options
- **User** (default): Available in all sessions
- **Project** (`--scope project`): Stored in `.claude/settings.json`, shared with team
- **Local** (`--scope local`): `.claude/settings.local.json`, not committed

### Plugin management
| Action | Command |
|---|---|
| Update all | `/plugin update` |
| Update marketplace | `/plugin marketplace update gmlp-marketplace` |
| Disable | `/plugin disable gmlp-core@gmlp-marketplace` |
| Enable | `/plugin enable gmlp-core@gmlp-marketplace` |
| Uninstall | `/plugin uninstall gmlp-core@gmlp-marketplace` |

---

## Available Plugins

| Plugin | What it provides |
|---|---|
| `gmlp-core` | Platform docs lookup, onboarding wizard, cluster connectivity, GAR packages, secrets/SA inspection |
| `gmlp-metaflow` | FlowSpec validation, flow debugging, best practices guidance |
| `gmlp-mcp-argo` | Argo Workflow debugging and failure analysis |
| `gmlp-mcp-drone` | Drone CI build and step log inspection |
| `gmlp-mcp-jira` | Jira issue creation, search, sprint management |
| `gdp-helper` | Developer Platform docs, Grafana metrics/logs, infrastructure info |
| `gmlp-incident` | Incident report review/search in Confluence (read-only) |
| `gmlp-project-template` | Project scaffolding from GMLP templates |
| `gmlp-autoresearch` | Autonomous Metaflow experimentation setup |

---

## Key Skills (slash commands)

| Plugin | Skill | Description |
|---|---|---|
| `gmlp-core` | `/gmlp-onboard` | End-to-end onboarding wizard |
| `gmlp-core` | `/connect-cluster` | Connect to GMLP K8s cluster |
| `gmlp-core` | `/install-gmlp-cli` | Install and configure GMLP CLI |
| `gmlp-core` | `/setup-app-manifest` | Verify/configure OAM `app.yaml` |
| `gmlp-core` | `/grant-gmlp-permissions` | Grant access to Metaflow/MLflow buckets |
| `gmlp-core` | `/grafana-logs` | Open Grafana Loki logs |
| `gmlp-core` | `/create-gmlp-support-ticket` | Create structured support request |
| `gmlp-metaflow` | `/flowspec-validate [file]` | Validate FlowSpec for GMLP compliance |
| `gmlp-metaflow` | `/debug-flow` | Debug failing Metaflow flow |
| `gmlp-mcp-argo` | `/diff-workflow-template` | Compare two WorkflowTemplate versions |
| `gmlp-incident` | `/review-incident <url>` | Review incident report |
| `gmlp-project-template` | `/project-init [path]` | Scaffold new project |
| `gmlp-autoresearch` | `/setup-autoresearch` | Configure autonomous experimentation |

---

## MCP Servers

The GMLP CLI ships MCP servers for documentation and Drone CI.

### Available servers

| Name | What it does | Backend |
|---|---|---|
| `gmlp-docs` | Search/read GMLP documentation | `github-mcp-server` (Docker) |
| `drone` | Inspect Drone CI builds and logs | `gmlp-drone-mcp` (uvx) |

### CLI commands
```bash
gmlp mcp list                      # check readiness
gmlp mcp config [SERVER] [--full]  # generate JSON config for MCP client
gmlp mcp start  SERVER             # launch server (used by clients)
```

### Environment variables

#### gmlp-docs
| Variable | Required | Description |
|---|---|---|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Yes | GitHub PAT with `repo` scope + SSO authorized for `deliveryhero` |
| `DOCKER_API_VERSION` | No | Defaults to `1.44` |

#### drone
| Variable | Required | Description |
|---|---|---|
| `DRONE_TOKEN` | Yes | From `drone-ci.deliveryhero.net/account` |
| `UV_INDEX` | Yes | Internal Python index URL with gcloud token |

UV_INDEX value:
```bash
export UV_INDEX="https://oauth2accesstoken:$(gcloud auth print-access-token)@europe-python.pkg.dev/dp-common-infra-5780/developer-platform-python/simple/"
```

### Configure MCP client

Paste output of `gmlp mcp config` into:
- **Claude Code**: Plugin's `.claude-plugin/plugin.json` under `mcpServers`
- **Cursor**: `~/.cursor/mcp.json`
- **Gemini CLI**: `~/.gemini/settings.json` under `mcpServers`

---

## Prerequisites

| Dependency | Required by |
|---|---|
| Docker (Colima or Desktop) | `gmlp-docs` MCP, plugins with MCP servers |
| GitHub CLI (`gh auth login`) | `gmlp-core` |
| `gcloud` CLI (authenticated) | `gmlp-mcp-argo`, `gmlp-mcp-drone`, `gmlp-mcp-jira` |
| `uvx` / `uv` | `gmlp-mcp-argo`, `gmlp-mcp-drone`, `gmlp-mcp-jira` |
| Node.js / `npx` | `gmlp-incident` |

---

## Known Limitations

- `gmlp-metaflow` requires `gmlp-core` for full functionality
- `gmlp-mcp-argo` searches last 30 days only
- `gmlp-incident` is read-only
- MCP servers connect at session start (small startup latency)
- `drone` MCP requires VPN — without it, all tools return empty results