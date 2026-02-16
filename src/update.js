/**
 * Update Engine — pull latest images and restart agent
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS } from './registry.js';

function getDataDir(agentKey) {
  return join(process.env.HOME, '.agentforge', agentKey);
}

export async function update(agentKey, opts) {
  const agent = AGENTS[agentKey];
  if (!agent) {
    console.error(`❌ Unknown agent: ${agentKey}`);
    process.exit(1);
  }

  const dataDir = getDataDir(agentKey);
  const composePath = join(dataDir, 'docker-compose.yml');

  if (!existsSync(composePath)) {
    console.error(`❌ ${agent.name} is not deployed. Run 'agentforge deploy ${agentKey}' first.`);
    process.exit(1);
  }

  console.log(`\n🔄 Updating ${agent.name}...\n`);

  try {
    // Pull latest images
    console.log('📥 Pulling latest images...');
    execSync(`cd ${dataDir} && docker compose pull`, { stdio: 'inherit' });

    // Restart with new images
    console.log('\n🔄 Restarting with updated images...');
    execSync(`cd ${dataDir} && docker compose up -d --force-recreate`, { stdio: 'inherit' });

    // Show status
    console.log(`\n✅ ${agent.name} updated successfully!`);
    
    // Show running containers
    const ps = execSync(`cd ${dataDir} && docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"`, { encoding: 'utf8' });
    console.log('\n' + ps);

    // Check if healthy
    console.log(`   agentforge status ${agentKey}  — check health`);
    console.log(`   agentforge logs ${agentKey}    — view logs\n`);
  } catch (err) {
    console.error(`\n❌ Update failed. Check logs: agentforge logs ${agentKey}`);
    process.exit(1);
  }
}
