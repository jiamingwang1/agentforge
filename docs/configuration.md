# Configuration

## Data Directory

All agent data is stored under `~/.agentforge/`:

```
~/.agentforge/
├── openclaw/
│   ├── docker-compose.yml
│   ├── .env
│   └── Caddyfile
├── n8n/
│   ├── docker-compose.yml
│   └── .env
├── backups/
│   └── openclaw-2026-02-16T12-00-00.tar.gz
├── health.json
└── monitor.log
```

Override with `--data <dir>` flag.

## Environment Variables

### Per-agent config

Set during `deploy` interactive wizard, or via `--env-KEY=VALUE`:

```bash
agentforge deploy openclaw --env-ANTHROPIC_API_KEY=sk-ant-xxx --env-PORT=3001
```

Edit after deployment:
```bash
nano ~/.agentforge/openclaw/.env
agentforge restart openclaw
```

### Global config

| Variable | Description |
|----------|-------------|
| `AGENTFORGE_TOKEN` | Auth token for dashboard |
| `AGENTFORGE_WEBHOOK` | Webhook URL for monitor alerts |
| `AGENTFORGE_AUTO_RESTART` | Enable/disable auto-restart (`true`/`false`) |
| `MONITOR_INTERVAL` | Health check interval in seconds (default: 60) |
| `DASHBOARD_PORT` | Dashboard port (default: 9090) |

## SSL / HTTPS

When you provide a `--domain` during deploy, AgentForge generates a Caddyfile that automatically provisions Let's Encrypt SSL certificates.

```bash
agentforge deploy openclaw --domain ai.example.com
```

**Requirements:**
- Domain DNS must point to your server's IP
- Ports 80 and 443 must be open
- Caddy handles certificate renewal automatically

Without a domain, agents are accessible via `http://localhost:<port>`.

## Custom Docker Compose

After deployment, you can edit the generated `docker-compose.yml`:

```bash
nano ~/.agentforge/openclaw/docker-compose.yml
docker compose -f ~/.agentforge/openclaw/docker-compose.yml up -d
```

AgentForge won't overwrite your changes unless you run `deploy` again.

## Ports

Default ports for each agent:

| Agent | Default Port |
|-------|-------------|
| OpenClaw | 3000 |
| n8n | 5678 |
| Dify | 3000 |
| LobeChat | 3210 |
| Dashboard | 9090 |

Override with `--port <port>` during deploy.
