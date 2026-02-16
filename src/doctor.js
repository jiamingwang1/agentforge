/**
 * AgentForge Doctor — Diagnose environment issues before deployment
 * Checks: Docker, Compose, ports, disk, memory, permissions
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const checks = [];

function check(name, fn) {
  try {
    const result = fn();
    checks.push({ name, ...result });
  } catch (err) {
    checks.push({ name, ok: false, message: err.message });
  }
}

export async function doctor() {
  checks.length = 0;
  console.log('\n🩺 AgentForge Doctor — Environment Diagnosis\n');
  console.log('─'.repeat(50));

  // 1. Docker installed
  check('Docker installed', () => {
    try {
      const version = execSync('docker --version', { encoding: 'utf8' }).trim();
      return { ok: true, message: version };
    } catch {
      return { ok: false, message: 'Docker not found. Install: https://docs.docker.com/get-docker/' };
    }
  });

  // 2. Docker running
  check('Docker daemon running', () => {
    try {
      execSync('docker info 2>/dev/null', { encoding: 'utf8', timeout: 5000 });
      return { ok: true, message: 'Docker daemon is active' };
    } catch {
      return { ok: false, message: 'Docker daemon not running. Start with: sudo systemctl start docker' };
    }
  });

  // 3. Docker Compose
  check('Docker Compose available', () => {
    try {
      const version = execSync('docker compose version', { encoding: 'utf8' }).trim();
      return { ok: true, message: version };
    } catch {
      try {
        const version = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
        return { ok: true, message: `${version} (legacy)` };
      } catch {
        return { ok: false, message: 'Docker Compose not found' };
      }
    }
  });

  // 4. User permissions
  check('Docker permissions', () => {
    try {
      execSync('docker ps 2>/dev/null', { encoding: 'utf8', timeout: 5000 });
      return { ok: true, message: 'Current user can run Docker' };
    } catch {
      return { ok: false, message: 'Permission denied. Add user to docker group: sudo usermod -aG docker $USER' };
    }
  });

  // 5. Disk space
  check('Disk space (>5GB free)', () => {
    try {
      const df = execSync("df -BG / | tail -1 | awk '{print $4}'", { encoding: 'utf8' }).trim().replace('G', '');
      const freeGB = parseInt(df);
      if (freeGB < 2) return { ok: false, message: `Only ${freeGB}GB free — need at least 5GB` };
      if (freeGB < 5) return { ok: true, message: `${freeGB}GB free ⚠️ (low, recommend 10GB+)`, warn: true };
      return { ok: true, message: `${freeGB}GB free` };
    } catch {
      return { ok: true, message: 'Could not check disk space' };
    }
  });

  // 6. Memory
  check('Memory (>1GB free)', () => {
    try {
      const free = execSync("free -m | grep Mem | awk '{print $7}'", { encoding: 'utf8' }).trim();
      const freeMB = parseInt(free);
      if (freeMB < 512) return { ok: false, message: `Only ${freeMB}MB available — agents may crash` };
      if (freeMB < 1024) return { ok: true, message: `${freeMB}MB available ⚠️ (low for multiple agents)`, warn: true };
      return { ok: true, message: `${freeMB}MB available` };
    } catch {
      return { ok: true, message: 'Could not check memory' };
    }
  });

  // 7. Common ports
  check('Port availability', () => {
    const portsToCheck = [3000, 3001, 5678, 8080, 8443, 9090];
    const occupied = [];
    for (const port of portsToCheck) {
      try {
        const result = execSync(`ss -tlnp 2>/dev/null | grep ':${port} ' || true`, { encoding: 'utf8' }).trim();
        if (result) occupied.push(port);
      } catch { /* ignore */ }
    }
    if (occupied.length > 0) {
      return { ok: true, message: `Ports in use: ${occupied.join(', ')} (agents will use alternative ports)`, warn: true };
    }
    return { ok: true, message: 'Common ports available' };
  });

  // 8. Data directory
  check('Data directory', () => {
    const dataDir = join(process.env.HOME, '.agentforge');
    if (existsSync(dataDir)) {
      return { ok: true, message: `${dataDir} exists` };
    }
    return { ok: true, message: `${dataDir} will be created on first deploy` };
  });

  // 9. Internet connectivity
  check('Internet connectivity', () => {
    try {
      execSync('curl -sf --max-time 5 https://registry.hub.docker.com/v2/ >/dev/null 2>&1', { timeout: 8000 });
      return { ok: true, message: 'Docker Hub reachable' };
    } catch {
      return { ok: false, message: 'Cannot reach Docker Hub — check internet/firewall' };
    }
  });

  // Print results
  let failures = 0;
  let warnings = 0;
  for (const c of checks) {
    const icon = c.ok ? (c.warn ? '⚠️' : '✅') : '❌';
    console.log(`${icon} ${c.name}`);
    console.log(`   ${c.message}`);
    if (!c.ok) failures++;
    if (c.warn) warnings++;
  }

  console.log('\n' + '─'.repeat(50));
  if (failures === 0 && warnings === 0) {
    console.log('✅ All checks passed! Ready to deploy.\n');
    console.log('   agentforge deploy openclaw\n');
  } else if (failures === 0) {
    console.log(`⚠️  ${warnings} warning(s), but you can still deploy.\n`);
  } else {
    console.log(`❌ ${failures} issue(s) found. Fix them before deploying.\n`);
  }

  return { ok: failures === 0, failures, warnings, checks };
}
