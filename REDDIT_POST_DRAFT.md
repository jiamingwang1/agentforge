# Reddit Post Draft — r/selfhosted

## Title
I built a CLI tool that deploys AI agents (OpenClaw, n8n, Dify) with one command

## Body

Hey r/selfhosted 👋

I've been self-hosting AI agents for clients and got tired of the repetitive Docker + reverse proxy + SSL setup every time. So I built **AgentForge** — a CLI tool that deploys AI agents with a single command.

### What it does

```bash
curl -fsSL https://agentforge.dev/install.sh | bash
agentforge deploy openclaw
```

That's it. It:
- 🐳 Checks Docker (installs if missing)
- 🔧 Walks you through config (API keys, domain)
- 🔒 Sets up Caddy reverse proxy with automatic SSL (if you provide a domain)
- 🚀 Spins up the full stack with `docker compose`

### Supported agents

| Agent | What it does |
|-------|-------------|
| **OpenClaw** | AI employee / personal assistant |
| **n8n** | Workflow automation (like Zapier, self-hosted) |
| **Dify** | AI application platform |
| **LobeChat** | AI chat application |

### Why not just use Coolify/CapRover/Portainer?

Those are general-purpose PaaS tools (and they're great). AgentForge is specifically for **AI agents** — it knows about API keys, model configs, and the specific stack each agent needs. Think of it as `npx create-react-app` but for AI agents.

### What's next

- `agentforge update` — one-command updates for deployed agents
- `agentforge status` — health dashboard
- More agents (CrewAI, AutoGPT)
- Web management panel

### Links

- GitHub: https://github.com/jiamingwang1/agentforge
- It's open source, MIT licensed

Would love feedback — what agents would you want supported? What's missing?

---

*Built this over a weekend with my CTO. We're using it ourselves to deploy our own AI agents on VPS.*
