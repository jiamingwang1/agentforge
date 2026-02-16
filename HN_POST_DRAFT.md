# Hacker News — Show HN Post

## Title
Show HN: AgentForge – Deploy AI agents (OpenClaw, n8n, Dify) with one command

## URL
https://github.com/jiamingwang1/agentforge

## Text (optional, for text posts)

We deploy AI agents on VPS for clients and got tired of the repetitive Docker + reverse proxy + SSL setup. So we built AgentForge — an open-source CLI that deploys AI agent stacks with a single command.

    curl -fsSL https://raw.githubusercontent.com/jiamingwang1/agentforge/main/install.sh | sh
    agentforge deploy openclaw

It handles Docker setup, interactive config for API keys, Caddy reverse proxy with auto SSL, and health checks. Supports OpenClaw, n8n, Dify, LobeChat, with CrewAI coming next.

Not a general PaaS like Coolify — this is specifically for AI agents. Knows about API keys, model configs, and the exact stack each agent needs.

CLI commands: deploy, status, logs, update, backup, stop, list.

Non-interactive mode for CI: agentforge deploy openclaw -y --env-ANTHROPIC_API_KEY=sk-xxx

MIT licensed. What AI agent would you want one-click deploy for?
