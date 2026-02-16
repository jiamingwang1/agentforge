import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { AGENTS } from './registry.js';

export async function status(agentKey) {
  if (agentKey) {
    const dataDir = join(process.env.HOME, '.agentforge', agentKey);
    try {
      const out = execSync(`cd ${dataDir} && docker compose ps --format json 2>/dev/null`, { encoding: 'utf8' });
      console.log(`\n📊 ${AGENTS[agentKey]?.name || agentKey} Status:\n`);
      const lines = out.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const c = JSON.parse(line);
          console.log(`  ${c.Service || c.Name}  ${c.State}  ${c.Ports || ''}`);
        } catch { console.log(`  ${line}`); }
      }
    } catch {
      console.log(`\n${agentKey}: not running\n`);
    }
  } else {
    console.log('\n📊 All Agents:\n');
    for (const key of Object.keys(AGENTS)) {
      const dataDir = join(process.env.HOME, '.agentforge', key);
      try {
        execSync(`cd "${dataDir}" 2>/dev/null && docker compose ps -q 2>/dev/null`, { encoding: 'utf8', shell: '/bin/bash', stdio: ['pipe', 'pipe', 'pipe'] });
        console.log(`  ✅ ${key}`);
      } catch {
        console.log(`  ⬚  ${key}`);
      }
    }
    console.log();
  }
}
