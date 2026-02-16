/**
 * AgentForge Dashboard — Web UI for managing deployed agents
 * This is the Pro feature that justifies paid plans.
 */

import http from 'node:http';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS } from './registry.js';

const PORT = parseInt(process.env.DASHBOARD_PORT || '9090');
const DATA_ROOT = join(process.env.HOME, '.agentforge');
const AUTH_TOKEN = process.env.AGENTFORGE_TOKEN || null; // Set to require auth

// === Agent Discovery ===

function getDeployedAgents() {
  const agents = [];
  if (!existsSync(DATA_ROOT)) return agents;
  
  for (const dir of readdirSync(DATA_ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name === 'backups') continue;
    const composePath = join(DATA_ROOT, dir.name, 'docker-compose.yml');
    if (!existsSync(composePath)) continue;
    
    const agentKey = dir.name;
    const agentMeta = AGENTS[agentKey] || { name: agentKey, icon: '📦' };
    
    // Get container status
    let status = 'stopped';
    let containers = [];
    try {
      const ps = execSync(
        `cd ${join(DATA_ROOT, agentKey)} && docker compose ps --format json 2>/dev/null`,
        { encoding: 'utf8', timeout: 5000 }
      ).trim();
      
      if (ps) {
        containers = ps.split('\n').filter(Boolean).map(line => {
          try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
        
        const running = containers.filter(c => c.State === 'running').length;
        const total = containers.length;
        
        if (running === total && total > 0) status = 'running';
        else if (running > 0) status = 'partial';
        else status = 'stopped';
      }
    } catch { /* ignore */ }
    
    // Read .env for port info
    let port = null;
    const envPath = join(DATA_ROOT, agentKey, '.env');
    if (existsSync(envPath)) {
      const env = readFileSync(envPath, 'utf8');
      const portMatch = env.match(/PORT=(\d+)/);
      if (portMatch) port = parseInt(portMatch[1]);
    }
    
    agents.push({
      key: agentKey,
      name: agentMeta.name || agentKey,
      icon: agentMeta.icon || '📦',
      status,
      port,
      containers: containers.map(c => ({
        name: c.Name,
        state: c.State,
        status: c.Status,
        ports: c.Ports || '',
      })),
    });
  }
  
  return agents;
}

// === Agent Actions ===

function agentAction(agentKey, action) {
  const dataDir = join(DATA_ROOT, agentKey);
  if (!existsSync(join(dataDir, 'docker-compose.yml'))) {
    return { ok: false, error: 'Agent not deployed' };
  }
  
  try {
    switch (action) {
      case 'start':
        execSync(`cd ${dataDir} && docker compose up -d`, { encoding: 'utf8', timeout: 60000 });
        return { ok: true, message: `${agentKey} started` };
      case 'stop':
        execSync(`cd ${dataDir} && docker compose down`, { encoding: 'utf8', timeout: 30000 });
        return { ok: true, message: `${agentKey} stopped` };
      case 'restart':
        execSync(`cd ${dataDir} && docker compose restart`, { encoding: 'utf8', timeout: 60000 });
        return { ok: true, message: `${agentKey} restarted` };
      case 'update':
        execSync(`cd ${dataDir} && docker compose pull && docker compose up -d --force-recreate`, { encoding: 'utf8', timeout: 120000 });
        return { ok: true, message: `${agentKey} updated` };
      case 'logs':
        const logs = execSync(`cd ${dataDir} && docker compose logs --tail=100 2>&1`, { encoding: 'utf8', timeout: 10000 });
        return { ok: true, logs };
      default:
        return { ok: false, error: `Unknown action: ${action}` };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// === System Stats ===

function getSystemStats() {
  try {
    const uptime = execSync('uptime -p 2>/dev/null || uptime', { encoding: 'utf8' }).trim();
    const disk = execSync("df -h / | tail -1 | awk '{print $3\"/\"$2\" (\"$5\" used)\"}'", { encoding: 'utf8' }).trim();
    const mem = execSync("free -h 2>/dev/null | grep Mem | awk '{print $3\"/\"$2}' || echo 'N/A'", { encoding: 'utf8' }).trim();
    const dockerVersion = execSync('docker --version 2>/dev/null || echo "not installed"', { encoding: 'utf8' }).trim();
    
    return { uptime, disk, memory: mem, docker: dockerVersion };
  } catch {
    return { uptime: 'N/A', disk: 'N/A', memory: 'N/A', docker: 'N/A' };
  }
}

// === Dashboard HTML ===

function renderDashboard(agents, stats) {
  const agentCards = agents.map(a => {
    const statusColor = a.status === 'running' ? '#10b981' : a.status === 'partial' ? '#f59e0b' : '#ef4444';
    const statusLabel = a.status === 'running' ? 'Running' : a.status === 'partial' ? 'Partial' : 'Stopped';
    const containerRows = a.containers.map(c => 
      `<div class="container-row">
        <span class="dot" style="background:${c.state === 'running' ? '#10b981' : '#ef4444'}"></span>
        <span>${c.name}</span>
        <span class="muted">${c.status || c.state}</span>
      </div>`
    ).join('');
    
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <span class="agent-icon">${a.icon}</span>
            <h3>${a.name}</h3>
          </div>
          <span class="badge" style="background:${statusColor}15;color:${statusColor}">${statusLabel}</span>
        </div>
        ${a.port ? `<div class="port">Port: ${a.port}</div>` : ''}
        ${containerRows ? `<div class="containers">${containerRows}</div>` : '<div class="muted">No containers</div>'}
        <div class="actions">
          ${a.status === 'running' ? 
            `<button onclick="action('${a.key}','restart')" class="btn btn-warn">↻ Restart</button>
             <button onclick="action('${a.key}','stop')" class="btn btn-danger">■ Stop</button>` :
            `<button onclick="action('${a.key}','start')" class="btn btn-success">▶ Start</button>`}
          <button onclick="action('${a.key}','update')" class="btn btn-primary">⬆ Update</button>
          <button onclick="showLogs('${a.key}')" class="btn">📋 Logs</button>
        </div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AgentForge Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e0e0e0;min-height:100vh}
.header{background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);padding:16px 24px;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:1.3rem;font-weight:700}.header h1 span{color:#7c3aed}
.header .refresh{background:none;border:1px solid rgba(255,255,255,0.1);color:#999;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:.85rem}
.header .refresh:hover{border-color:#7c3aed;color:#fff}
.stats-bar{display:flex;gap:24px;padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.04);flex-wrap:wrap}
.stat-item{font-size:.85rem;color:#888}.stat-item strong{color:#ccc}
.main{padding:24px;max-width:1200px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px}
.card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:24px;transition:border-color .2s}
.card:hover{border-color:rgba(124,58,237,0.2)}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.card-header div{display:flex;align-items:center;gap:10px}
.agent-icon{font-size:1.5rem}
.card h3{font-size:1.15rem;font-weight:600}
.badge{font-size:.7rem;padding:3px 10px;border-radius:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.port{font-size:.85rem;color:#888;margin-bottom:12px}
.containers{margin-bottom:16px}
.container-row{display:flex;align-items:center;gap:8px;font-size:.85rem;padding:4px 0;color:#999}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.muted{color:#555;font-size:.85rem}
.actions{display:flex;gap:8px;flex-wrap:wrap}
.btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#ccc;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:.8rem;transition:all .2s}
.btn:hover{border-color:#7c3aed;color:#fff}
.btn-primary{background:rgba(124,58,237,0.15);border-color:rgba(124,58,237,0.3);color:#a78bfa}
.btn-success{background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.3);color:#34d399}
.btn-warn{background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.3);color:#fbbf24}
.btn-danger{background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.3);color:#f87171}
.modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100;justify-content:center;align-items:center}
.modal.show{display:flex}
.modal-content{background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;max-width:700px;width:90%;max-height:80vh;overflow:auto}
.modal-content h2{margin-bottom:16px;font-size:1.1rem}
.modal-content pre{background:#0a0a0f;padding:16px;border-radius:8px;font-size:.8rem;overflow-x:auto;color:#94a3b8;line-height:1.5;max-height:50vh;overflow-y:auto}
.modal-close{float:right;background:none;border:none;color:#888;cursor:pointer;font-size:1.3rem}
.toast{position:fixed;bottom:24px;right:24px;background:#1a1a2e;border:1px solid rgba(124,58,237,0.3);padding:12px 20px;border-radius:10px;font-size:.9rem;display:none;z-index:200;animation:slideIn .3s}
@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.empty{text-align:center;padding:60px 24px;color:#555}
.empty h2{font-size:1.3rem;margin-bottom:12px;color:#888}
.empty code{background:rgba(124,58,237,0.1);padding:4px 12px;border-radius:6px;color:#a78bfa}
</style>
</head>
<body>
<div class="header">
  <h1>🔥 <span>AgentForge</span> Dashboard</h1>
  <button class="refresh" onclick="location.reload()">↻ Refresh</button>
</div>
<div class="stats-bar">
  <div class="stat-item">⏱ <strong>${stats.uptime}</strong></div>
  <div class="stat-item">💾 Disk: <strong>${stats.disk}</strong></div>
  <div class="stat-item">🧠 RAM: <strong>${stats.memory}</strong></div>
  <div class="stat-item">🐳 <strong>${stats.docker.replace('Docker version ', 'Docker ')}</strong></div>
  <div class="stat-item">📦 <strong>${agents.length} agent${agents.length !== 1 ? 's' : ''}</strong> deployed</div>
</div>
<div class="main">
  ${agents.length > 0 ? `<div class="grid">${agentCards}</div>` : 
    `<div class="empty"><h2>No agents deployed yet</h2><p>Deploy your first agent:</p><br><code>agentforge deploy openclaw</code></div>`}
</div>

<div class="modal" id="logModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2 id="logTitle">Logs</h2>
    <pre id="logContent">Loading...</pre>
  </div>
</div>
<div class="toast" id="toast"></div>

<script>
async function action(key, act) {
  showToast(\`⏳ \${act}ing \${key}...\`);
  try {
    const r = await fetch(\`/api/action?agent=\${key}&action=\${act}\`, {method:'POST'});
    const d = await r.json();
    showToast(d.ok ? \`✅ \${d.message}\` : \`❌ \${d.error}\`);
    if (d.ok) setTimeout(() => location.reload(), 1500);
  } catch(e) { showToast('❌ ' + e.message); }
}
async function showLogs(key) {
  document.getElementById('logTitle').textContent = key + ' logs';
  document.getElementById('logContent').textContent = 'Loading...';
  document.getElementById('logModal').classList.add('show');
  try {
    const r = await fetch(\`/api/action?agent=\${key}&action=logs\`, {method:'POST'});
    const d = await r.json();
    document.getElementById('logContent').textContent = d.ok ? d.logs : d.error;
  } catch(e) { document.getElementById('logContent').textContent = e.message; }
}
function closeModal() { document.getElementById('logModal').classList.remove('show'); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}
document.getElementById('logModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
</script>
</body></html>`;
}

// === HTTP Server ===

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  // Auth check
  if (AUTH_TOKEN) {
    const token = url.searchParams.get('token') || req.headers['authorization']?.replace('Bearer ', '');
    if (token !== AUTH_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized. Set AGENTFORGE_TOKEN or pass ?token=xxx' }));
      return;
    }
  }
  
  if (url.pathname === '/api/agents') {
    const agents = getDeployedAgents();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agents));
    
  } else if (url.pathname === '/api/action' && req.method === 'POST') {
    const agentKey = url.searchParams.get('agent');
    const action = url.searchParams.get('action');
    const result = agentAction(agentKey, action);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    
  } else if (url.pathname === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getSystemStats()));
    
  } else {
    // Dashboard HTML
    const agents = getDeployedAgents();
    const stats = getSystemStats();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderDashboard(agents, stats));
  }
});

export function startDashboard(port = PORT) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`\n🔥 AgentForge Dashboard running at http://localhost:${port}\n`);
  });
}

// Run directly
if (process.argv[1]?.endsWith('dashboard.js')) {
  startDashboard();
}
