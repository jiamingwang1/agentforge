# AgentForge 🔥

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/jiamingwang1/agentforge)](https://github.com/jiamingwang1/agentforge/stargazers)
[![Agents](https://img.shields.io/badge/agents-5-blue)](https://github.com/jiamingwang1/agentforge#supported-ai-agents)

**Deploy AI Agents with One Command**

> We run 4 AI employees on our own infrastructure. Now you can too.

## Quick Start

\`\`\`bash
# Install
curl -fsSL https://agentforge.dev/install | sh

# Deploy OpenClaw (AI assistant)
$ agentforge deploy openclaw
🚀 AgentForge — Deploying OpenClaw

✅ Docker detected
🔧 Configuring OpenClaw...
  Domain for SSL (press Enter to skip): 
  ANTHROPIC_API_KEY: sk-ant-xxxxx

✅ Generated docker-compose.yml
✅ Generated .env
🐳 Starting OpenClaw...

✅ OpenClaw is running!
   URL: http://localhost:3000
   Data: ~/.agentforge/openclaw

# Manage
agentforge status openclaw    # check health
agentforge logs openclaw      # view logs  
agentforge update openclaw    # pull latest & restart
agentforge stop openclaw      # shut down
\`\`\`

**That's it.** Full stack deployed in under 60 seconds.

## Supported AI Agents

| Agent | What it does | Status |
|-------|-------------|--------|
| **OpenClaw** | AI employees & assistants | ✅ Ready |
| **n8n** | Workflow automation + AI | ✅ Ready |
| **Dify** | AI app builder | ✅ Ready |
| **LobeChat** | AI chat interface | ✅ Ready |
| AutoGPT | Autonomous agents | 🔜 Coming |
| CrewAI | Multi-agent teams | 🔜 Coming |

## What You Get

Each deploy includes **everything** — not just the app:

- 🐳 Docker Compose with all dependencies (PostgreSQL, Redis, etc.)
- 🔒 Auto-SSL via Caddy (when you provide a domain)
- 📝 Interactive config wizard (API keys, passwords, ports)
- 🔄 One-command updates (\`agentforge update\`)
- 📊 Health checks & auto-restart

## Why Not Coolify / CapRover / Manual Docker?

| | AgentForge | Coolify/CapRover | Manual Docker |
|---|---|---|---|
| Focus | AI Agents only | General PaaS | Everything |
| Setup | 1 command | Multi-step | Write your own |
| AI deps | Auto-configured | Manual | Manual |
| Templates | AI-optimized stacks | Generic | None |
| Learning curve | Zero | Medium | High |

We don't try to be everything. We do one thing: **deploy AI agents, fast.**

## Commands

\`\`\`
agentforge deploy <agent>   # Deploy an agent
agentforge status [agent]   # Check running agents
agentforge logs <agent>     # Tail logs
agentforge update <agent>   # Update to latest version
agentforge stop <agent>     # Stop an agent
agentforge list             # Show available agents
\`\`\`

## Install

\`\`\`bash
# One-liner
curl -fsSL https://agentforge.dev/install | sh

# Or clone
git clone https://github.com/jiamingwang1/agentforge.git
cd agentforge && npm link
\`\`\`

**Requirements:** Docker + Node.js 18+

## Pricing

- **Free** — 1 agent, community support
- **Pro \$19/mo** — 5 agents, auto-updates, email support  
- **Team \$49/mo** — Unlimited, priority support, custom templates

## Built by AI, for AI

Our team literally runs on AI agents. We're our own first users. 🐕

---

[GitHub](https://github.com/jiamingwang1/agentforge) · MIT License
