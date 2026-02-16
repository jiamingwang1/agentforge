/**
 * AgentForge Web Management Panel
 * Real-time agent monitoring, logs, and control
 */

import { createServer } from 'node:http';
import { execSync, exec } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS } from './registry.js';

const PORT = process.env.PANEL_PORT || 9090;
const HOME = process.env.HOME || '/root';
const FORGE_DIR = join(HOME, '.agentforge');

// Get real agent status from Docker
function getAgentStatus(agentKey) {
  const dataDir = join(FORGE_DIR, agentKey);
  if (!existsSync(dataDir)) return { status: 'not_deployed', containers: [] };
  
  try {
    const out = execSync(`cd "${dataDir}" && docker compose ps --format json 2>/dev/null`, { encoding: 'utf8', timeout: 10000 });
    const containers = out.trim().split('\n').filter(Boolean).map(line => {
      try {
        const c = JSON.parse(line);
        return {
          name: c.Service || c.Name,
          state: c.State,
          status: c.Status || '',
          ports: c.Ports || '',
          health: c.Health || ''
        };
      } catch { return { name: line, state: 'unknown' }; }
    });
    const allRunning = containers.length > 0 && containers.every(c => c.state === 'running');
    return { status: allRunning ? 'running' : 'stopped', containers };
  } catch {
    return { status: 'stopped', containers: [] };
  }
}

// Get agent logs
function getAgentLogs(agentKey, lines = 50) {
  const dataDir = join(FORGE_DIR, agentKey);
  if (!existsSync(dataDir)) return 'Agent not deployed';
  try {
    return execSync(`cd "${dataDir}" && docker compose logs --tail=${lines} --no-color 2>&1`, { encoding: 'utf8', timeout: 15000 });
  } catch (e) {
    return e.message || 'Failed to get logs';
  }
}

// Get all deployed agents
function getAllAgents() {
  const results = {};
  // Only check agents that have a deploy directory
  for (const [key, info] of Object.entries(AGENTS)) {
    const dataDir = join(FORGE_DIR, key);
    if (existsSync(join(dataDir, 'docker-compose.yml'))) {
      const st = getAgentStatus(key);
      results[key] = { ...info, ...st, key };
    } else {
      results[key] = { ...info, status: 'not_deployed', containers: [], key };
    }
  }
  // Check any extra deployed agents not in registry
  if (existsSync(FORGE_DIR)) {
    for (const dir of readdirSync(FORGE_DIR)) {
      if (!results[dir] && existsSync(join(FORGE_DIR, dir, 'docker-compose.yml'))) {
        const st = getAgentStatus(dir);
        results[dir] = { name: dir, description: 'Custom agent', ...st, key: dir };
      }
    }
  }
  return results;
}

// Control agent (start/stop/restart)
function controlAgent(agentKey, action) {
  const dataDir = join(FORGE_DIR, agentKey);
  if (!existsSync(dataDir)) return { ok: false, error: 'Agent not deployed' };
  try {
    const cmd = action === 'restart' ? 'docker compose restart' :
                action === 'stop' ? 'docker compose down' :
                action === 'start' ? 'docker compose up -d' : null;
    if (!cmd) return { ok: false, error: 'Invalid action' };
    execSync(`cd "${dataDir}" && ${cmd} 2>&1`, { encoding: 'utf8', timeout: 60000 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Get system stats
function getSystemStats() {
  try {
    const uptime = execSync('uptime -p', { encoding: 'utf8' }).trim();
    const mem = execSync("free -m | awk '/Mem:/ {printf \"%d/%d MB (%.0f%%)\", $3, $2, $3/$2*100}'", { encoding: 'utf8' }).trim();
    const disk = execSync("df -h / | awk 'NR==2 {printf \"%s/%s (%s)\", $3, $2, $5}'", { encoding: 'utf8' }).trim();
    const containers = execSync('docker ps -q 2>/dev/null | wc -l', { encoding: 'utf8' }).trim();
    const cpu = execSync("top -bn1 | awk '/Cpu/ {printf \"%.1f%%\", 100-$8}'", { encoding: 'utf8', timeout: 5000 }).trim();
    return { uptime, memory: mem, disk, containers: parseInt(containers), cpu };
  } catch {
    return { uptime: 'unknown', memory: 'unknown', disk: 'unknown', containers: 0, cpu: 'unknown' };
  }
}

// HTML Panel
function renderPanel() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AgentForge Panel</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif;background:#09090b;color:#fafafa;line-height:1.5}
.nav{background:rgba(9,9,11,0.8);backdrop-filter:blur(12px);border-bottom:1px solid #27272a;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.nav h1{font-size:1.1em;font-weight:600;display:flex;align-items:center;gap:8px}
.nav .status-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block}
.nav .refresh{background:#27272a;border:1px solid #3f3f46;color:#a1a1aa;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.8em}
.nav .refresh:hover{background:#3f3f46;color:#fafafa}
.container{max-width:1200px;margin:0 auto;padding:24px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px}
.stat-card{background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px}
.stat-card .label{font-size:0.75em;color:#71717a;text-transform:uppercase;letter-spacing:0.05em}
.stat-card .value{font-size:1.3em;font-weight:600;margin-top:4px}
.agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;margin-bottom:24px}
.agent-card{background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;transition:border-color 0.2s}
.agent-card:hover{border-color:#3f3f46}
.agent-header{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #27272a}
.agent-name{font-weight:600;font-size:1em}
.agent-badge{padding:3px 10px;border-radius:20px;font-size:0.7em;font-weight:600}
.badge-running{background:rgba(34,197,94,0.15);color:#22c55e}
.badge-stopped{background:rgba(239,68,68,0.15);color:#ef4444}
.badge-notdeployed{background:rgba(113,113,122,0.15);color:#71717a}
.agent-body{padding:16px 20px}
.agent-desc{color:#a1a1aa;font-size:0.85em;margin-bottom:12px}
.agent-containers{margin-bottom:12px}
.container-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.8em}
.container-dot{width:6px;height:6px;border-radius:50%}
.dot-running{background:#22c55e}
.dot-stopped{background:#ef4444}
.agent-actions{display:flex;gap:6px;flex-wrap:wrap}
.agent-actions button{padding:6px 14px;border-radius:6px;border:1px solid #3f3f46;background:#27272a;color:#d4d4d8;font-size:0.78em;cursor:pointer;transition:all 0.15s}
.agent-actions button:hover{background:#3f3f46;color:#fafafa}
.agent-actions button.btn-danger{border-color:#7f1d1d;color:#fca5a5}
.agent-actions button.btn-danger:hover{background:#7f1d1d}
.agent-actions button.btn-primary{border-color:#1d4ed8;color:#93c5fd;background:#1e3a5f}
.agent-actions button.btn-primary:hover{background:#1d4ed8}
.log-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;justify-content:center;align-items:center;padding:20px}
.log-modal.show{display:flex}
.log-content{background:#18181b;border:1px solid #27272a;border-radius:12px;width:100%;max-width:800px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column}
.log-header{padding:16px 20px;border-bottom:1px solid #27272a;display:flex;justify-content:space-between;align-items:center}
.log-header h3{font-size:1em}
.log-close{background:none;border:none;color:#71717a;font-size:1.5em;cursor:pointer}
.log-body{padding:16px;overflow:auto;flex:1;font-family:'Fira Code','SF Mono',monospace;font-size:0.75em;line-height:1.6;color:#a1a1aa;white-space:pre-wrap;word-break:break-all}
</style>
</head>
<body>
<div class="nav">
<h1>🔥 AgentForge <span class="status-dot"></span></h1>
<button class="refresh" onclick="location.reload()">↻ Refresh</button>
</div>
<div class="container">
<div class="stats" id="stats"></div>
<div class="agents-grid" id="agents"></div>
</div>
<div class="log-modal" id="logModal" onclick="if(event.target===this)closeLogs()">
<div class="log-content">
<div class="log-header"><h3 id="logTitle">Logs</h3><button class="log-close" onclick="closeLogs()">×</button></div>
<div class="log-body" id="logBody">Loading...</div>
</div>
</div>
<script>
async function load() {
  const [agents, stats] = await Promise.all([
    fetch('/api/agents').then(r=>r.json()),
    fetch('/api/stats').then(r=>r.json())
  ]);
  renderStats(stats);
  renderAgents(agents);
}
function renderStats(s) {
  document.getElementById('stats').innerHTML = [
    stat('CPU', s.cpu),
    stat('Memory', s.memory),
    stat('Disk', s.disk),
    stat('Containers', s.containers),
    stat('Uptime', s.uptime.replace('up ',''))
  ].join('');
}
function stat(label, value) {
  return '<div class="stat-card"><div class="label">'+label+'</div><div class="value">'+value+'</div></div>';
}
function renderAgents(agents) {
  const el = document.getElementById('agents');
  el.innerHTML = Object.entries(agents).map(([key, a]) => {
    const badge = a.status === 'running' ? '<span class="agent-badge badge-running">Running</span>' :
                  a.status === 'stopped' ? '<span class="agent-badge badge-stopped">Stopped</span>' :
                  '<span class="agent-badge badge-notdeployed">Not Deployed</span>';
    const containers = (a.containers||[]).map(c =>
      '<div class="container-row"><span class="container-dot '+(c.state==='running'?'dot-running':'dot-stopped')+'"></span>'+c.name+' — '+c.state+(c.ports?' · '+c.ports:'')+'</div>'
    ).join('');
    const actions = a.status === 'running' ?
      '<button onclick="control(\\''+key+'\\',\\'restart\\')">↻ Restart</button><button class="btn-danger" onclick="control(\\''+key+'\\',\\'stop\\')">⏹ Stop</button><button onclick="showLogs(\\''+key+'\\')">📋 Logs</button>' :
      a.status === 'stopped' ?
      '<button class="btn-primary" onclick="control(\\''+key+'\\',\\'start\\')">▶ Start</button><button onclick="showLogs(\\''+key+'\\')">📋 Logs</button>' :
      '<a href="https://github.com/jiamingwang1/agentforge" target="_blank" style="color:#71717a;font-size:0.8em">Deploy via CLI →</a>';
    return '<div class="agent-card"><div class="agent-header"><span class="agent-name">'+(a.name||key)+'</span>'+badge+'</div><div class="agent-body"><div class="agent-desc">'+(a.description||'')+'</div>'+(containers?'<div class="agent-containers">'+containers+'</div>':'')+'<div class="agent-actions">'+actions+'</div></div></div>';
  }).join('');
}
async function control(key, action) {
  const btn = event.target;
  btn.textContent = '...';
  btn.disabled = true;
  await fetch('/api/control/'+key+'/'+action, {method:'POST'});
  setTimeout(load, 2000);
}
async function showLogs(key) {
  document.getElementById('logTitle').textContent = key + ' — Logs';
  document.getElementById('logBody').textContent = 'Loading...';
  document.getElementById('logModal').classList.add('show');
  const resp = await fetch('/api/logs/'+key);
  document.getElementById('logBody').textContent = await resp.text();
}
function closeLogs() { document.getElementById('logModal').classList.remove('show'); }
load();
setInterval(load, 15000);
</script>
</body>
</html>`;
}

// HTTP Server
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  if (url.pathname === '/' || url.pathname === '/panel') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderPanel());
  } else if (url.pathname === '/api/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getAllAgents()));
  } else if (url.pathname === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getSystemStats()));
  } else if (url.pathname.startsWith('/api/logs/')) {
    const key = url.pathname.split('/')[3];
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(getAgentLogs(key));
  } else if (url.pathname.startsWith('/api/control/') && req.method === 'POST') {
    const parts = url.pathname.split('/');
    const key = parts[3];
    const action = parts[4];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(controlAgent(key, action)));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 AgentForge Panel running at http://0.0.0.0:${PORT}`);
});
