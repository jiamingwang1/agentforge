# Supported Agents

## OpenClaw

AI employees and assistants powered by Claude.

```bash
agentforge deploy openclaw
```

**Stack:** OpenClaw container
**Default port:** 3000
**Access URL:** `http://your-server:3000`
**Memory:** ~1GB RAM
**Required config:** `ANTHROPIC_API_KEY`

OpenClaw lets you run AI assistants that can use tools, browse the web, manage files, and more. Think of it as having AI employees on your own infrastructure.

---

## n8n

Workflow automation with AI capabilities.

```bash
agentforge deploy n8n
```

**Stack:** n8n + PostgreSQL + Redis
**Default port:** 5678
**Access URL:** `http://your-server:5678`
**Memory:** ~2GB RAM
**Required config:** None (uses defaults)

n8n is a workflow automation tool that connects 400+ apps. With AI nodes, you can build intelligent automation workflows — summarize emails, classify tickets, generate content, etc.

---

## Dify

Open-source AI application builder.

```bash
agentforge deploy dify
```

**Stack:** Dify API + Web + Worker + PostgreSQL + Redis + Weaviate
**Default port:** 3000 (⚠️ conflicts with OpenClaw — use `--port 3100` if both are deployed)
**Access URL:** `http://your-server:3000` (or your custom port)
**Memory:** ~4GB RAM
**Required config:** `SECRET_KEY`

Dify lets you build AI-powered applications with a visual workflow editor. Create chatbots, AI assistants, and content generation tools with drag-and-drop.

**Note:** Dify has a complex stack (5+ services). Requires at least 4GB RAM.

---

## LobeChat

Modern AI chat interface.

```bash
agentforge deploy lobechat
```

**Stack:** LobeChat container
**Default port:** 3210
**Access URL:** `http://your-server:3210`
**Memory:** ~512MB RAM
**Required config:** API keys for your preferred LLM provider

LobeChat is a beautiful, feature-rich AI chat interface supporting multiple providers (OpenAI, Anthropic, local models). Includes plugin system, file upload, and multi-modal support.

---

## Coming Soon

- **AutoGPT** — Autonomous AI agents
- **CrewAI** — Multi-agent team orchestration

Want a specific agent? [Open an issue](https://github.com/jiamingwang1/agentforge/issues).
