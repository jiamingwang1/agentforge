# Reddit Post Draft — r/selfhosted

## Title
I built a CLI tool that deploys AI agents (OpenClaw, n8n, Dify) with one command

## Body

Hey r/selfhosted 👋

I've been deploying AI agents on VPS for clients and got tired of the repetitive Docker + reverse proxy + SSL + database setup every single time. So I built **AgentForge** — an open-source CLI that deploys AI agents with a single command.

### How it works

```bash
git clone https://github.com/jiamingwang1/agentforge.git
cd agentforge && npm install
node src/cli.js deploy openclaw
```

Or non-interactive for scripts/CI:
```bash
agentforge deploy openclaw -y --env-ANTHROPIC_API_KEY=sk-xxx
```

Deploys in under 60 seconds on a fresh VPS (tested on Ubuntu 22.04/24.04). With cached images, it's under 1 second.

It handles:
- 🐳 Docker detection (installs if missing)
- 🔧 Interactive config wizard for API keys and settings
- 🔒 Caddy reverse proxy with automatic SSL (when you provide a domain)
- 🚀 Full stack deploy with docker compose (app + DB + cache)
- 📊 Health checks and auto-restart

### Supported agents

| Agent | What it does |
|-------|-------------|
| **OpenClaw** | AI employee / personal assistant |
| **n8n** | Workflow automation (self-hosted Zapier) |
| **Dify** | AI application platform |
| **LobeChat** | AI chat application |
| **CrewAI** | Multi-agent framework (coming soon) |

### CLI commands

```
agentforge deploy <agent>    # Deploy
agentforge status            # Health check
agentforge logs <agent>      # View logs  
agentforge update <agent>    # Pull latest + restart
agentforge backup <agent>    # Backup data + config
agentforge stop <agent>      # Stop
agentforge list              # Available agents
```

### Why not Coolify/CapRover/Portainer?

Those are general-purpose PaaS tools (and they're great). AgentForge is specifically for **AI agents** — it knows about API keys, model configs, vector databases, and the specific stack each agent needs. Think `npx create-react-app` but for AI agents.

### Links

- **GitHub**: https://github.com/jiamingwang1/agentforge
- **Landing page**: https://jiamingwang1.github.io/agentforge/
- Open source, MIT licensed

**What AI agent do you wish had a one-click deploy?** We're adding more templates and would love to know what the community needs.

---

*Been building this for our own use deploying AI agents for clients. Decided to open source it.*
