/**
 * Deploy Engine — generate compose, configure, and launch
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { AGENTS } from './registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    execSync('docker compose version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function configWizard(agent, opts) {
  const config = { port: opts.port || agent.defaultPort };
  
  console.log(`\n🔧 Configuring ${agent.name}...\n`);

  if (opts.domain) {
    config.domain = opts.domain;
    config.ssl = opts.ssl !== false;
  } else {
    const domain = await ask('  Domain for SSL (e.g. agent.example.com, press Enter to skip): ');
    if (domain) {
      config.domain = domain;
      config.ssl = true;
    }
  }

  const env = {};
  for (const key of agent.requiredEnv) {
    const val = await ask(`  ${key}: `);
    if (!val) { console.error(`  ❌ ${key} is required`); process.exit(1); }
    env[key] = val;
  }

  for (const key of agent.optionalEnv) {
    const val = await ask(`  ${key} (optional, press Enter to skip): `);
    if (val) env[key] = val;
  }

  config.env = env;
  return config;
}

function generateCompose(agentKey, agent, config) {
  // For agents with templates, load from file
  const templatePath = join(ROOT, `templates/${agentKey}/docker-compose.yml`);
  if (existsSync(templatePath)) {
    let tmpl = readFileSync(templatePath, 'utf8');
    // Remove deprecated version field
    tmpl = tmpl.replace(/^version:.*\n/m, '');
    tmpl = tmpl.replace(/\$\{PORT\}/g, config.port);
    if (config.domain) tmpl = tmpl.replace(/\$\{DOMAIN\}/g, config.domain);
    // Remove Caddy service if no domain configured
    if (!config.domain) {
      tmpl = tmpl.replace(/\n  caddy:[\s\S]*?(?=\n  \w|\nvolumes:)/m, '\n');
      tmpl = tmpl.replace(/\n  caddy_data:.*$/gm, '');
      tmpl = tmpl.replace(/\n  caddy_config:.*$/gm, '');
    }
    return tmpl;
  }

  // Fallback: generate generic compose
  return `services:
  ${agentKey}:
    image: ${agentKey}:${agent.version}
    ports:
      - "${config.port}:${config.port}"
    restart: unless-stopped
    volumes:
      - ./${agentKey}-data:/data
    env_file:
      - .env
`;
}

export async function deploy(agentKey, opts) {
  const agent = AGENTS[agentKey];
  if (!agent) {
    console.error(`❌ Unknown agent: ${agentKey}`);
    console.error(`Run 'agentforge list' to see available agents.`);
    process.exit(1);
  }
  if (agent.status === 'planned') {
    console.error(`⏳ ${agent.name} support is planned but not yet available.`);
    process.exit(1);
  }

  console.log(`\n🚀 AgentForge — Deploying ${agent.name}\n`);

  // Check Docker
  if (!checkDocker()) {
    console.error('❌ Docker + Docker Compose required. Install: https://docs.docker.com/get-docker/');
    process.exit(1);
  }
  console.log('✅ Docker detected');

  // Config wizard
  const config = await configWizard(agent, opts);

  // Create deploy dir
  const dataDir = opts.dataDir || join(process.env.HOME, '.agentforge', agentKey);
  mkdirSync(dataDir, { recursive: true });

  // Generate docker-compose.yml
  const compose = generateCompose(agentKey, agent, config);
  writeFileSync(join(dataDir, 'docker-compose.yml'), compose);
  console.log(`✅ Generated docker-compose.yml`);

  // Write .env
  const envContent = Object.entries(config.env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  writeFileSync(join(dataDir, '.env'), envContent);
  console.log(`✅ Generated .env`);

  // Generate Caddyfile if SSL
  if (config.domain && config.ssl) {
    const caddyfile = `${config.domain} {\n  reverse_proxy ${agentKey}:${config.port}\n}\n`;
    writeFileSync(join(dataDir, 'Caddyfile'), caddyfile);
    console.log(`✅ Generated Caddyfile (auto-SSL via Caddy)`);
  }

  // Deploy
  console.log(`\n🐳 Starting ${agent.name}...`);
  try {
    execSync(`cd ${dataDir} && docker compose up -d`, { stdio: 'inherit' });
    console.log(`\n✅ ${agent.name} is running!`);
    console.log(`   URL: http://localhost:${config.port}`);
    if (config.domain) console.log(`   Domain: https://${config.domain}`);
    console.log(`   Data: ${dataDir}`);
    console.log(`\n   agentforge status ${agentKey}   — check status`);
    console.log(`   agentforge logs ${agentKey}     — view logs`);
    console.log(`   agentforge stop ${agentKey}     — stop\n`);
  } catch (err) {
    console.error(`\n❌ Deploy failed. Check docker logs for details.`);
    process.exit(1);
  }
}
