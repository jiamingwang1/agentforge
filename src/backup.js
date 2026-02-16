/**
 * Backup Engine — backup agent data volumes
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS } from './registry.js';

function getDataDir(agentKey) {
  return join(process.env.HOME, '.agentforge', agentKey);
}

function getBackupDir() {
  const dir = join(process.env.HOME, '.agentforge', 'backups');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function backup(agentKey, opts) {
  const agent = AGENTS[agentKey];
  if (!agent) {
    console.error(`❌ Unknown agent: ${agentKey}`);
    process.exit(1);
  }

  const dataDir = getDataDir(agentKey);
  if (!existsSync(join(dataDir, 'docker-compose.yml'))) {
    console.error(`❌ ${agent.name} is not deployed.`);
    process.exit(1);
  }

  const backupDir = getBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = join(backupDir, `${agentKey}-${timestamp}.tar.gz`);

  console.log(`\n📦 Backing up ${agent.name}...\n`);

  try {
    // Get volume names
    const volumes = execSync(
      `cd ${dataDir} && docker compose config --volumes`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    if (volumes.length === 0) {
      console.log('⚠️  No volumes to backup.');
      return;
    }

    // Get project name
    const project = execSync(
      `cd ${dataDir} && docker compose config --format json 2>/dev/null | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).name)}catch{console.log('agentforge')}})"`,
      { encoding: 'utf8' }
    ).trim() || agentKey;

    // Backup each volume
    const tmpDir = join(backupDir, `tmp-${timestamp}`);
    mkdirSync(tmpDir, { recursive: true });

    for (const vol of volumes) {
      const fullVolName = `${project}_${vol}`;
      console.log(`  📁 Backing up volume: ${vol}`);
      try {
        execSync(
          `docker run --rm -v ${fullVolName}:/data -v ${tmpDir}:/backup alpine tar czf /backup/${vol}.tar.gz -C /data .`,
          { stdio: 'pipe' }
        );
      } catch {
        console.log(`  ⚠️  Could not backup ${vol} (may not exist yet)`);
      }
    }

    // Also backup compose + env files
    execSync(`cp ${dataDir}/docker-compose.yml ${tmpDir}/`, { stdio: 'pipe' });
    if (existsSync(join(dataDir, '.env'))) {
      execSync(`cp ${dataDir}/.env ${tmpDir}/`, { stdio: 'pipe' });
    }
    if (existsSync(join(dataDir, 'Caddyfile'))) {
      execSync(`cp ${dataDir}/Caddyfile ${tmpDir}/`, { stdio: 'pipe' });
    }

    // Create final archive
    execSync(`cd ${tmpDir} && tar czf ${backupFile} .`, { stdio: 'pipe' });
    execSync(`rm -rf ${tmpDir}`, { stdio: 'pipe' });

    const size = execSync(`du -sh ${backupFile}`, { encoding: 'utf8' }).split('\t')[0];
    console.log(`\n✅ Backup complete!`);
    console.log(`   File: ${backupFile}`);
    console.log(`   Size: ${size}`);
    console.log(`   Volumes: ${volumes.join(', ')}\n`);
  } catch (err) {
    console.error(`\n❌ Backup failed: ${err.message}`);
    process.exit(1);
  }
}

export async function restore(agentKey, backupPath, opts) {
  const agent = AGENTS[agentKey];
  if (!agent) {
    console.error(`❌ Unknown agent: ${agentKey}`);
    process.exit(1);
  }

  if (!existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  console.log(`\n🔄 Restoring ${agent.name} from backup...\n`);
  console.log(`   ⚠️  This will overwrite current data!`);
  console.log(`   Backup: ${backupPath}\n`);

  // TODO: implement restore logic
  console.log('   Restore functionality coming in next release.\n');
}
