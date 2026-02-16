import { execSync } from 'node:child_process';
import { join } from 'node:path';

export async function stop(agentKey, opts) {
  const dataDir = opts?.dataDir || join(process.env.HOME, '.agentforge', agentKey);
  console.log(`\n⏹  Stopping ${agentKey}...`);
  try {
    execSync(`cd ${dataDir} && docker compose down`, { stdio: 'inherit' });
    console.log(`✅ ${agentKey} stopped.\n`);
  } catch {
    console.error(`❌ Failed to stop ${agentKey}. Is it running?\n`);
  }
}
