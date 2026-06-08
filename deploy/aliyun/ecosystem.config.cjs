/** PM2 — 阿里云 ECS 上常驻 API 进程 */
module.exports = {
  apps: [
    {
      name: 'ai-ide-api',
      cwd: '/opt/ai-ide',
      script: 'node_modules/.bin/tsx',
      args: 'scripts/local-dev-server.ts',
      env: {
        NODE_ENV: 'production',
        API_PORT: '3001',
        AI_IDE_ENV_FILE: '/opt/ai-ide/.env.production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
    },
  ],
}
