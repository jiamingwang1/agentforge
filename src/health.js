/**
 * AgentForge Health Check — Monitor deployed agents and alert on issues
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS } from './registry.js';

const DATA_ROOT = join(process.env.HOME, '.agentforge');
const HEALTH_LOG = join(DATA_ROOT, 'health.json');

function getDeployedAgentKeys() {
  if (!existsSync(DATA_ROOT)) return [];
  return readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'backups')
    .filter(d => existsSync(join(DATA_ROOT, d.name, 'docker-compose.yml')))
    .map(d => d.name);
}

function checkAgent(agentKey) {
  const dataDir = join(DATA_ROOT, agentKey);
  const result = {
    key: agentKey,
    name: AGENTS[agentKey]?.name || agentKey,
    timestamp: new Date().toISOString(),
    healthy: false,
    containers: [],
    issues: [],
  };

  try {
    const ps = execSync(
      `cd ${dataDir} && docker compose ps --format json 2>/dev/null`,
      { encoding: 'utf8', timeout: 10000 }
    ).trim();

    if (!ps) {
      result.issues.push('No containers found — agent may not be deployed');
      return result;
    }

    const containers = ps.split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    let allHealthy = true;
    for (const c of containers) {
      const cInfo = {
        name: c.Name,
        state: c.State,
        status: c.Status || '',
        healthy: c.State === 'running',
      };

      if (c.State !== 'running') {
        allHealthy = false;
        result.issues.push(`Container ${c.Name} is ${c.State}`);
      }

      // Check for restart loops
      if (c.Status && /Restarting/i.test(c.Status)) {
        allHealthy = false;
        result.issues.push(`Container ${c.Name} is in restart loop`);
      }

      // Check health status if available
      if (c.Health === 'unhealthy') {
        allHealthy = false;
        result.issues.push(`Container ${c.Name} health check failing`);
      }

      result.containers.push(cInfo);
    }

    result.healthy = allHealthy && containers.length > 0;

    // Check disk usage
    try {
      const diskUsage = execSync("df / --output=pcent | tail -1", { encoding: 'utf8' }).trim().replace('%', '');
      if (parseInt(diskUsage) > 90) {
        result.issues.push(`Disk usage critical: ${diskUsage}%`);
        result.healthy = false;
      } else if (parseInt(diskUsage) > 80) {
        result.issues.push(`Disk usage warning: ${diskUsage}%`);
      }
    } catch { /* ignore */ }

    // Check memory
    try {
      const memInfo = execSync("free | grep Mem | awk '{printf \"%.0f\", $3/$2*100}'", { encoding: 'utf8' }).trim();
      if (parseInt(memInfo) > 90) {
        result.issues.push(`Memory usage critical: ${memInfo}%`);
        result.healthy = false;
      }
    } catch { /* ignore */ }

  } catch (err) {
    result.issues.push(`Health check error: ${err.message}`);
  }

  return result;
}

export async function healthCheck(agentKey, opts = {}) {
  const keys = agentKey ? [agentKey] : getDeployedAgentKeys();

  if (keys.length === 0) {
    console.log('No deployed agents found.\n');
    return;
  }

  console.log('\n🏥 AgentForge Health Check\n');
  console.log('─'.repeat(50));

  const results = [];
  let allHealthy = true;

  for (const key of keys) {
    const result = checkAgent(key);
    results.push(result);

    const icon = result.healthy ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${key})`);
    
    for (const c of result.containers) {
      const cIcon = c.healthy ? '  🟢' : '  🔴';
      console.log(`${cIcon} ${c.name} — ${c.state}`);
    }

    if (result.issues.length > 0) {
      allHealthy = false;
      for (const issue of result.issues) {
        console.log(`  ⚠️  ${issue}`);
      }
    }
    console.log('');
  }

  console.log('─'.repeat(50));
  if (allHealthy) {
    console.log('✅ All agents healthy!\n');
  } else {
    console.log('⚠️  Some agents have issues. Run `agentforge logs <agent>` for details.\n');
  }

  // Save health log
  try {
    mkdirSync(DATA_ROOT, { recursive: true });
    let history = [];
    if (existsSync(HEALTH_LOG)) {
      try {
        history = JSON.parse(readFileSync(HEALTH_LOG, 'utf8'));
      } catch { history = []; }
    }
    history.push({ timestamp: new Date().toISOString(), results });
    // Keep last 100 entries
    if (history.length > 100) history = history.slice(-100);
    writeFileSync(HEALTH_LOG, JSON.stringify(history, null, 2));
  } catch { /* ignore */ }

  // Return for programmatic use
  return { allHealthy, results };
}

// === Webhook alerting ===

export async function alertWebhook(webhookUrl, results) {
  if (!webhookUrl) return;
  
  const unhealthy = results.filter(r => !r.healthy);
  if (unhealthy.length === 0) return;

  const message = unhealthy.map(r => 
    `❌ **${r.name}**: ${r.issues.join(', ')}`
  ).join('\n');

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 **AgentForge Health Alert**\n\n${message}`,
      }),
    });
    if (!resp.ok) console.error('Webhook alert failed:', resp.status);
  } catch (err) {
    console.error('Webhook alert error:', err.message);
  }
}
