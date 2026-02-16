/**
 * Agent Registry — available frameworks and their configs
 */

export const AGENTS = {
  openclaw: {
    name: 'OpenClaw',
    description: 'AI Employee / Personal Assistant',
    version: 'latest',
    defaultPort: 3000,
    compose: 'templates/openclaw/docker-compose.yml',
    env: 'templates/openclaw/.env.template',
    requiredEnv: ['ANTHROPIC_API_KEY'],
    optionalEnv: ['DISCORD_TOKEN', 'TELEGRAM_BOT_TOKEN', 'OPENAI_API_KEY'],
    healthCheck: '/health',
    docs: 'https://docs.openclaw.ai',
  },
  n8n: {
    name: 'n8n',
    description: 'Workflow Automation Platform',
    version: '1.70.0',
    defaultPort: 5678,
    compose: 'templates/n8n/docker-compose.yml',
    env: 'templates/n8n/.env.template',
    requiredEnv: [],
    optionalEnv: ['N8N_BASIC_AUTH_USER', 'N8N_BASIC_AUTH_PASSWORD'],
    healthCheck: '/healthz',
    docs: 'https://docs.n8n.io',
  },
  dify: {
    name: 'Dify',
    description: 'AI Application Platform',
    version: 'latest',
    defaultPort: 3000,
    compose: 'templates/dify/docker-compose.yml',
    env: 'templates/dify/.env.template',
    requiredEnv: [],
    optionalEnv: ['OPENAI_API_KEY'],
    healthCheck: '/health',
    docs: 'https://docs.dify.ai',
  },
  crewai: {
    name: 'CrewAI',
    description: 'Multi-Agent AI Framework',
    version: 'latest',
    defaultPort: 8000,
    compose: 'templates/crewai/docker-compose.yml',
    env: 'templates/crewai/.env.template',
    requiredEnv: ['OPENAI_API_KEY'],
    optionalEnv: ['ANTHROPIC_API_KEY', 'OPENAI_MODEL_NAME'],
    healthCheck: '/',
    docs: 'https://docs.crewai.com',
    status: 'planned',
  },
  lobechat: {
    name: 'LobeChat',
    description: 'AI Chat Application',
    version: 'latest',
    defaultPort: 3210,
    compose: 'templates/lobechat/docker-compose.yml',
    env: 'templates/lobechat/.env.template',
    requiredEnv: [],
    optionalEnv: ['OPENAI_API_KEY'],
    healthCheck: '/',
    docs: 'https://lobehub.com/docs',
  },
};

export async function list() {
  console.log('\n📦 Available AI Agents:\n');
  for (const [key, agent] of Object.entries(AGENTS)) {
    const st = agent.status === 'planned' ? '🟡 planned' : '🟢 ready';
    console.log(`  ${key.padEnd(12)} ${agent.name.padEnd(15)} ${agent.description}  [${st}]`);
  }
  console.log('\nUse: agentforge deploy <agent>\n');
}
