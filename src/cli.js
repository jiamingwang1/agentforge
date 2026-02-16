#!/usr/bin/env node
/**
 * AgentForge CLI — Deploy AI Agents in One Command
 */

import { parseArgs } from 'node:util';
import { deploy } from './deploy.js';
import { status } from './status.js';
import { logs } from './logs.js';
import { stop } from './stop.js';
import { list } from './registry.js';

const HELP = `
AgentForge 🚀 — Deploy AI Agents in One Command

Usage:
  agentforge deploy <agent>   Deploy an AI agent (openclaw, n8n, dify, ...)
  agentforge status [agent]   Show running agent status
  agentforge logs <agent>     Tail agent logs
  agentforge stop <agent>     Stop a running agent
  agentforge list             List available agents
  agentforge help             Show this help

Options:
  --port <port>       Override default port
  --domain <domain>   Set domain for SSL
  --data <dir>        Data directory (default: ~/.agentforge)
  --no-ssl            Disable auto SSL

Examples:
  agentforge deploy openclaw
  agentforge deploy n8n --port 5678 --domain n8n.example.com
  agentforge status
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const target = args[1];

  const opts = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--port') opts.port = parseInt(args[++i]);
    else if (args[i] === '--domain') opts.domain = args[++i];
    else if (args[i] === '--data') opts.dataDir = args[++i];
    else if (args[i] === '--no-ssl') opts.ssl = false;
  }

  switch (command) {
    case 'deploy':
      if (!target) { console.error('Usage: agentforge deploy <agent>'); process.exit(1); }
      await deploy(target, opts);
      break;
    case 'status':
      await status(target);
      break;
    case 'logs':
      if (!target) { console.error('Usage: agentforge logs <agent>'); process.exit(1); }
      await logs(target, opts);
      break;
    case 'stop':
      if (!target) { console.error('Usage: agentforge stop <agent>'); process.exit(1); }
      await stop(target, opts);
      break;
    case 'list':
      await list();
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
