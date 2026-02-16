# Getting Started

## Prerequisites

- **Linux** (Ubuntu 20.04+, Debian 11+, CentOS 8+) or **macOS**
- **Docker** 20.10+ with Docker Compose v2 (your user must be in the `docker` group — see Troubleshooting)
- **Node.js** 18+
- At least **2GB RAM** and **10GB disk** free

Run `agentforge doctor` after install to verify your environment.

## Installation

### One-liner (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/jiamingwang1/agentforge/main/install.sh | sh
```

### From source

```bash
git clone https://github.com/jiamingwang1/agentforge.git
cd agentforge
npm link
```

### Verify

```bash
agentforge --help
agentforge doctor
```

## Your First Deployment

```bash
agentforge deploy openclaw
```

The wizard will ask for:
1. **Domain** (optional) — for auto-SSL via Caddy
2. **API keys** — depends on the agent (e.g., ANTHROPIC_API_KEY for OpenClaw)
3. **Port** — defaults are sensible, override with `--port`

That's it. Your agent is running.

## Non-interactive Mode

For scripts and CI/CD:

```bash
agentforge deploy openclaw -y \
  --port 3001 \
  --env-ANTHROPIC_API_KEY=sk-ant-xxx
```

## What Gets Created

Each deployment creates a directory at `~/.agentforge/<agent>/` containing:

```
~/.agentforge/openclaw/
├── docker-compose.yml    # Generated compose file
├── .env                  # Environment variables
└── Caddyfile             # Reverse proxy config (if domain set)
```

All data is stored in Docker volumes. Use `agentforge backup` to save them.

## Troubleshooting

### Permission denied on Docker

If you see `permission denied` errors:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER
# Log out and back in, or run:
newgrp docker
```

### Port already in use

```bash
# Check what's using the port
sudo lsof -i :3000
# Deploy with a different port
agentforge deploy openclaw --port 3001
```

### Containers won't start

```bash
# Run the environment check
agentforge doctor
# Check logs for errors
agentforge logs openclaw
```

### Slow downloads / timeouts

Docker image pulls can be slow on first deploy. If they timeout, just run `agentforge deploy` again — Docker resumes where it left off.

## Next Steps

- [Commands Reference](./commands.md) — all 11 commands explained
- [Configuration](./configuration.md) — customize your deployments
- [Agents Guide](./agents.md) — detailed info on each supported agent
