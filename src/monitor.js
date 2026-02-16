/**
 * AgentForge Monitor — Background daemon that watches deployed agents
 * Auto-restarts crashed containers + sends webhook alerts
 * This is the killer Pro feature.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS } from './registry.js';

const DATA_ROOT = join(process.env.HOME, '.agentforge');
const CHECK_INTERVAL = parseInt(process.env.MONITOR_INTERVAL || '60') * 1000; // default 60s
const WEBHOOK_URL = process.env.AGENTFORGE_WEBHOOK || '';
const AUTO_RESTART = process.env.AGENTFORGE_AUTO_RESTART !== 'false'; // default true
const LOG_FILE = join(DATA_ROOT, 'monitor.log');

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    mkdirSync(DATA_ROOT, { recursive: true });
    const existing = existsSync(LOG_FILE) ? readFileSync(LOG_FILE, 'utf8') : '';
    // Keep last 1000 lines
    const lines = existing.split('\n').slice(-999);
    lines.push(line);
    writeFileSync(LOG_FILE, lines.join('\n'));
  } catch { /* ignore */ }
}

function getDeployedAgents() {
  if (!existsSync(DATA_ROOT)) return [];
  return readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'backups')
    .filter(d => existsSync(join(DATA_ROOT, d.name, 'docker-compose.yml')))
    .map(d => d.name);
}

function checkAndHeal(agentKey) {
  const dataDir = join(DATA_ROOT, agentKey);
  const name = AGENTS[agentKey]?.name || agentKey;

  try {
    const ps = execSync(
      `cd ${dataDir} && docker compose ps --format json 2>/dev/null`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();

    if (!ps) {
      log(`⚠️  ${name}: no containers found`);
      return { key: agentKey, status: 'no_containers', issues: ['No containers'] };
    }

    const containers = ps.split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);

    const issues = [];
    let needsRestart = false;

    for (const c of containers) {
      if (c.State !== 'running') {
        issues.push(`${c.Name} is ${c.State}`);
        needsRestart = true;
      }
      if (c.Health === 'unhealthy') {
        issues.push(`${c.Name} health check failing`);
        needsRestart = true;
      }
      // Detect restart loops
      if (c.Status && /Restarting/i.test(c.Status)) {
        issues.push(`${c.Name} restart loop`);
        needsRestart = true;
      }
    }

    if (issues.length === 0) {
      return { key: agentKey, status: 'healthy', issues: [] };
    }

    log(`🚨 ${name}: ${issues.join(', ')}`);

    // Auto-restart
    if (AUTO_RESTART && needsRestart) {
      log(`🔄 ${name}: attempting auto-restart...`);
      try {
        execSync(`cd ${dataDir} && docker compose up -d`, {
          encoding: 'utf8',
          timeout: 60000,
        });
        log(`✅ ${name}: auto-restart successful`);
        return { key: agentKey, status: 'healed', issues, healed: true };
      } catch (err) {
        log(`❌ ${name}: auto-restart failed: ${err.message}`);
        return { key: agentKey, status: 'failed', issues, healed: false };
      }
    }

    return { key: agentKey, status: 'unhealthy', issues };
  } catch (err) {
    log(`❌ ${name}: check failed: ${err.message}`);
    return { key: agentKey, status: 'error', issues: [err.message] };
  }
}

async function sendAlert(results) {
  if (!WEBHOOK_URL) return;

  const problems = results.filter(r => r.status !== 'healthy');
  if (problems.length === 0) return;

  const lines = problems.map(r => {
    const icon = r.healed ? '🔄' : '🚨';
    const action = r.healed ? '(auto-restarted)' : '(needs attention)';
    return `${icon} **${r.key}**: ${r.issues.join(', ')} ${action}`;
  });

  const payload = {
    content: `🏥 **AgentForge Monitor Alert**\n\n${lines.join('\n')}\n\n_${new Date().toISOString()}_`,
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    log('📤 Webhook alert sent');
  } catch (err) {
    log(`❌ Webhook failed: ${err.message}`);
  }
}

async function runCheck() {
  const agents = getDeployedAgents();
  if (agents.length === 0) return;

  const results = agents.map(checkAndHeal);
  const healthy = results.filter(r => r.status === 'healthy').length;
  const total = results.length;

  if (healthy < total) {
    await sendAlert(results);
  }
}

export async function startMonitor() {
  log('🏥 AgentForge Monitor started');
  log(`   Check interval: ${CHECK_INTERVAL / 1000}s`);
  log(`   Auto-restart: ${AUTO_RESTART}`);
  log(`   Webhook: ${WEBHOOK_URL ? 'configured' : 'not set'}`);
  log('');

  // Initial check
  await runCheck();

  // Periodic checks
  setInterval(runCheck, CHECK_INTERVAL);

  // Keep alive
  process.on('SIGINT', () => {
    log('Monitor stopped (SIGINT)');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    log('Monitor stopped (SIGTERM)');
    process.exit(0);
  });
}
