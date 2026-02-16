import { spawn } from 'node:child_process';
import { join } from 'node:path';

export async function logs(agentKey, opts) {
  const dataDir = opts?.dataDir || join(process.env.HOME, '.agentforge', agentKey);
  const child = spawn('docker', ['compose', 'logs', '-f', '--tail', '100'], {
    cwd: dataDir, stdio: 'inherit'
  });
  child.on('error', () => console.error(`❌ No logs found for ${agentKey}`));
}
