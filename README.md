<p align="center">
  <img src="https://img.shields.io/badge/agents-5-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/deploy_time-<60s-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/config_files-0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge" />
</p>

# 🔥 AgentForge

**Deploy AI agents in seconds, not hours.**

Stop fighting with Docker configs, database setup, and reverse proxies. One command deploys a production-ready AI agent on your own server.

```bash
curl -fsSL https://raw.githubusercontent.com/jiamingwang1/agentforge/main/install.sh | sh
agentforge deploy n8n
# ✅ n8n running at http://localhost:5678 in 48 seconds
```

## The Problem

Deploying AI agents manually means:
- 2-4 hours reading Docker docs
- Debugging port conflicts & networking
- Configuring databases, Redis, environment variables
- Setting up reverse proxy & SSL
- Different process for every agent

**AgentForge reduces this to one command.**

## Supported Agents

| Agent | Description | Command |
|-------|-------------|---------|
| 🦞 **OpenClaw** | AI Personal Assistant | `agentforge deploy openclaw` |
| ⚡ **n8n** | Workflow Automation | `agentforge deploy n8n` |
| 🤖 **Dify** | AI App Platform | `agentforge deploy dify` |
| 💬 **LobeChat** | AI Chat Interface | `agentforge deploy lobechat` |
| 🧠 **CrewAI** | Multi-Agent Framework | `agentforge deploy crewai` |

## CLI Commands

```
agentforge deploy <agent>    Deploy an AI agent (interactive .env wizard)
agentforge status [agent]    Show agent status & container health
agentforge logs <agent>      Stream real-time container logs
agentforge stop <agent>      Stop and remove an agent
agentforge update <agent>    Pull latest images and restart
agentforge backup <agent>    Full backup (config + volumes + data)
agentforge restore <agent>   Restore from backup
agentforge list              List all available agents
agentforge dashboard         Launch Web management panel (Pro)
agentforge health            Run health checks with optional webhook alerts
agentforge doctor            Diagnose environment (Docker/ports/disk/memory)
agentforge monitor           Background health monitor + auto-restart
```

## Web Dashboard (Pro)

Real-time monitoring of all your deployed agents from a single browser tab:

- 📊 System metrics — CPU, memory, disk, container count
- 🟢 Agent status — running, stopped, error states  
- 🎮 One-click controls — start, stop, restart
- 📋 Live logs — tail container output in real-time
- 🔐 Token authentication
- 🔄 Auto-refresh every 15 seconds

```bash
agentforge dashboard  # Launches at http://localhost:9090
```

## How It Works

1. **Install** — One curl command, no dependencies beyond Docker
2. **Deploy** — Choose an agent, answer a few questions (API keys, ports)
3. **Done** — Agent is running with database, networking, health checks configured

All data stays on YOUR server. AgentForge never phones home.

## Pricing

| | Free | Pro ($19/mo) | Team ($49/mo) |
|---|---|---|---|
| CLI commands | ✅ All | ✅ All | ✅ All |
| Deploy agents | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| Backup & restore | ✅ | ✅ | ✅ |
| Web Dashboard | ❌ | ✅ | ✅ |
| Auto SSL (Caddy) | ❌ | ✅ | ✅ |
| Health monitoring | ❌ | ✅ | ✅ |
| Auto-restart | ❌ | ✅ | ✅ |
| Multiple servers | ❌ | ❌ | ✅ |
| Custom templates | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

## Requirements

- Linux server (Ubuntu 20.04+, Debian 11+)
- Docker & Docker Compose v2
- 2GB+ RAM recommended

## FAQ

**How is this different from Coolify/CapRover?**  
Those are general-purpose PaaS. AgentForge is purpose-built for AI agents — pre-configured templates with databases, ports, and health checks included. Zero config, one command.

**Is my data safe?**  
100% self-hosted. Everything runs on your server. No telemetry, no phone-home, no data collection.

**Can I add my own agent templates?**  
Yes! Add a `docker-compose.yml` and `.env.template` to the templates folder.

## Links

- 🌐 [Website](http://96.30.205.225:8082/)
- 🏢 [XingDao](https://xingdao.pro)
- 📦 [npm](https://www.npmjs.com/package/agentforge)

## License

MIT © [XingDao](https://xingdao.pro)
