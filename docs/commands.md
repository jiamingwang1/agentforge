# Commands Reference

## agentforge deploy \<agent\>

Deploy an AI agent stack.

```bash
agentforge deploy openclaw
agentforge deploy n8n --port 5678 --domain n8n.example.com
agentforge deploy dify -y --env-SECRET_KEY=mysecret
```

**Options:**
| Flag | Description |
|------|-------------|
| `--port <port>` | Override default port |
| `--domain <domain>` | Set domain for auto-SSL |
| `-y, --no-interactive` | Skip prompts, use defaults |
| `--dry-run` | Show what would be generated without deploying |
| `--env-KEY=VALUE` | Set environment variables |

**What it does:**
1. Checks Docker is running
2. Generates `docker-compose.yml` from agent template
3. Generates `.env` with your configuration
4. Optionally generates `Caddyfile` for SSL (when domain provided)
5. Runs `docker compose up -d`

---

## agentforge status \[agent\]

Show status of deployed agents.

```bash
agentforge status           # all agents
agentforge status openclaw  # specific agent
```

Shows container states, ports, and uptime.

---

## agentforge logs \<agent\>

Tail logs from an agent's containers.

```bash
agentforge logs openclaw
agentforge logs n8n
```

Streams live logs. Press `Ctrl+C` to stop.

---

## agentforge update \<agent\>

Pull latest Docker images and restart.

```bash
agentforge update openclaw
```

**What it does:**
1. `docker compose pull` — downloads latest images
2. `docker compose up -d --force-recreate` — restarts with new images
3. Shows updated container status

Zero-downtime: containers are recreated one by one.

---

## agentforge stop \<agent\>

Stop a running agent.

```bash
agentforge stop openclaw
```

Runs `docker compose down`. Data volumes are preserved.

---

## agentforge backup \<agent\>

Backup agent data volumes and config.

```bash
agentforge backup openclaw
```

Creates a `.tar.gz` archive at `~/.agentforge/backups/` containing:
- All Docker volume data
- `docker-compose.yml`
- `.env`
- `Caddyfile` (if exists)

**Example output:**
```
📦 Backing up OpenClaw...
  📁 Backing up volume: data
  📁 Backing up volume: postgres

✅ Backup complete!
   File: ~/.agentforge/backups/openclaw-2026-02-16T12-00-00.tar.gz
   Size: 45M
```

---

## agentforge restore \<agent\> \<backup-file\>

Restore an agent from a backup archive.

```bash
agentforge restore openclaw ~/.agentforge/backups/openclaw-2026-02-16T12-00-00.tar.gz
```

**What it does:**
1. Stops the running agent (if any)
2. Restores `docker-compose.yml`, `.env`, and `Caddyfile`
3. Restores all Docker volume data
4. Restarts the agent

**⚠️ Warning:** This overwrites the current deployment. Back up first if you have unsaved changes.

*Pro feature.*

---

## agentforge list

Show available agent templates.

```bash
agentforge list
```

```
Available agents:
  openclaw    AI employees & assistants
  n8n         Workflow automation + AI
  dify        AI app builder
  lobechat    AI chat interface
```

---

## agentforge dashboard

Launch the web management panel.

```bash
agentforge dashboard
agentforge dashboard --port 8080
```

Opens a web UI at `http://localhost:9090` showing:
- System stats (CPU, memory, disk, Docker version)
- All deployed agents with real-time status
- One-click Start / Stop / Restart / Update
- Live log viewer
- Container-level monitoring

**Security:** Set `AGENTFORGE_TOKEN` environment variable to require authentication:

```bash
AGENTFORGE_TOKEN=mysecrettoken agentforge dashboard
```

Access with `http://localhost:9090?token=mysecrettoken`

*Pro feature.*

---

## agentforge health \[agent\]

Run health checks on deployed agents.

```bash
agentforge health           # check all
agentforge health openclaw  # check specific
```

Checks:
- Container running state
- Health check status (if configured)
- Restart loop detection
- Disk usage (warns at 80%, critical at 90%)
- Memory usage

Results are logged to `~/.agentforge/health.json` for history.

---

## agentforge doctor

Diagnose your environment before deploying.

```bash
agentforge doctor
```

Checks:
- ✅ Docker installed and running
- ✅ Docker Compose available
- ✅ User permissions (docker group)
- ✅ Disk space (>5GB free)
- ✅ Memory (>1GB available)
- ✅ Common port availability
- ✅ Internet connectivity (Docker Hub reachable)

Run this first if `deploy` fails.

---

## agentforge monitor

Start background monitoring daemon.

```bash
agentforge monitor
```

Runs continuously, checking all agents every 60 seconds:
- Detects crashed/stopped containers
- **Auto-restarts** failed agents
- Sends **webhook alerts** (Discord, Slack, etc.)

**Configuration via environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `MONITOR_INTERVAL` | `60` | Check interval in seconds |
| `AGENTFORGE_WEBHOOK` | — | Discord/Slack webhook URL for alerts |
| `AGENTFORGE_AUTO_RESTART` | `true` | Auto-restart crashed agents |

**Example with webhook:**

```bash
AGENTFORGE_WEBHOOK=https://discord.com/api/webhooks/xxx/yyy agentforge monitor
```

**Run as systemd service:**

```bash
# /etc/systemd/system/agentforge-monitor.service
[Unit]
Description=AgentForge Monitor
After=docker.service

[Service]
ExecStart=/usr/local/bin/agentforge monitor
Environment=AGENTFORGE_WEBHOOK=https://discord.com/api/webhooks/xxx
Restart=always
User=root

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now agentforge-monitor
```

*Pro feature.*
