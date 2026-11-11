const path = require('path')
const { config: loadEnv } = require('dotenv')

const cwd = path.join(__dirname)
const standaloneServer = './.next/standalone/server.js'

// Keep secrets outside .next/standalone. PM2 loads the environment file from
// the project root and injects it into the standalone process.
loadEnv({ path: path.join(cwd, '.env.production.local') })
loadEnv({ path: path.join(cwd, '.env') })

const commonEnv = {
  ...process.env,
  NODE_ENV: 'production',
  HOSTNAME: '127.0.0.1'
}

module.exports = {
  apps: [
    {
      name: 'kun-touchgal-next',
      port: 3000,
      cwd,
      // 8C/16G 主站：4 个 web worker，DB/Python 已拆到独立机器
      instances: 4,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=768',
      script: standaloneServer,
      // https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
      env: {
        ...commonEnv,
        PORT: 3000,
        KUN_ENABLE_CRON: 'false',
        UV_THREADPOOL_SIZE: '4',
        VIPS_CONCURRENCY: '1'
      }
    },
    {
      name: 'kun-touchgal-next-cron',
      port: 3001,
      cwd,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=384',
      script: standaloneServer,
      env: {
        ...commonEnv,
        PORT: 3001,
        KUN_ENABLE_CRON: 'true',
        VIPS_CONCURRENCY: '1'
      }
    },
    {
      name: 'kun-touchgal-next-backup',
      cwd,
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      script: 'scripts/backupDatabase.mjs',
      cron_restart: '0 3 * * *',
      env: {
        ...commonEnv,
        NODE_ENV: 'production'
      }
    }
  ]
}
