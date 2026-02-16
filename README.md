# AgentForge 🔥

**Deploy AI Agents with One Command**

```bash
curl -fsSL https://raw.githubusercontent.com/jiamingwang1/agentforge/main/install.sh | bash
agentforge deploy openclaw
```

That's it. Full AI agent stack — running in under 2 minutes.

## Why AgentForge?

Deploying AI agents sucks. You need Docker, reverse proxy, SSL, databases, API keys, health checks... Most people give up before they start.

AgentForge handles all of it:
- 🐳 **Auto Docker setup** — installs Docker if missing
- 🔧 **Interactive config wizard** — walks you through API keys and settings
- 🔒 **Automatic SSL** — Caddy reverse proxy with Let's Encrypt
- 🚀 **One command deploy** — full stack with `docker compose`
- 📊 **Health checks** — built-in monitoring and auto-restart

## Supported AI Agents

| Agent | What it does | Status |
|-------|-------------|--------|
| **[OpenClaw](https://openclaw.ai)** | AI Employee / Personal Assistant | 🟢 Ready |
| **[n8n](https://n8n.io)** | Workflow Automation (self-hosted Zapier) | 🟢 Ready |
| **[Dify](https://dify.ai)** | AI Application Platform | 🟢 Ready |
| **[LobeChat](https://lobehub.com)** | AI Chat Application | 🟢 Ready |

## Quick Start

### Install
```bash
curl -fsSL https://raw.githubusercontent.com/jiamingwang1/agentforge/main/install.sh | bash
```

### Deploy an agent
```bash
agentforge deploy openclaw     # AI employee
agentforge deploy n8n          # Workflow automation
agentforge deploy dify         # AI app platform
agentforge deploy lobechat     # AI chat
```

### Manage
```bash
agentforge list                # See available agents
agentforge status              # Check running agents
agentforge logs openclaw       # View logs
agentforge stop openclaw       # Stop an agent
```

## How is this different from Coolify/CapRover?

Those are **general-purpose PaaS** tools (and they're great!). AgentForge is built specifically for **AI agents**:

| | AgentForge | Coolify/CapRover | Manual Docker |
|---|---|---|---|
| **Focus** | AI agents only | Any app | Anything |
| **Learning curve** | 1 command | Understand PaaS | Docker expertise |
| **AI dependencies** | Auto-configured | Manual | Manual |
| **Templates** | AI-optimized | Generic | None |

Think `npx create-react-app` but for AI agents.

## Architecture

```
AgentForge CLI
├── Agent Registry      — curated list of AI agent templates
├── Config Wizard       — interactive setup for API keys, domains
├── Compose Generator   — generates docker-compose with all deps
├── Deploy Engine       — runs containers, health checks
└── Management          — status, logs, updates (coming soon)
```

Each agent template includes:
- `docker-compose.yml` — full stack (app + DB + cache + reverse proxy)
- `.env.template` — all config options with descriptions
- `Caddyfile.template` — automatic SSL reverse proxy

## Roadmap

- [x] CLI tool (`deploy`, `list`, `status`, `logs`, `stop`)
- [x] 4 agent templates (OpenClaw, n8n, Dify, LobeChat)
- [x] Automatic SSL with Caddy
- [x] Interactive config wizard
- [ ] `agentforge update` — one-command updates
- [ ] Web management panel
- [ ] More agents (CrewAI, AutoGPT, LangGraph)
- [ ] Backup & restore

## Contributing

PRs welcome! To add a new agent template:

1. Create `templates/<agent-name>/docker-compose.yml`
2. Create `templates/<agent-name>/.env.template`
3. Create `templates/<agent-name>/Caddyfile.template`
4. Add entry to `src/registry.js`

## License

MIT

---

*Built by a team that runs 4 AI employees. We use AgentForge ourselves every day.* 🐕
