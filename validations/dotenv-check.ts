import { z } from 'zod'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// next.config.ts 在 Next 16 中会以 CJS 方式加载，不能依赖 import.meta.url。
const projectRoot = process.cwd()
const envPath = path.resolve(projectRoot, '.env')

if (!fs.existsSync(envPath)) {
  console.error('.env file not found in the project root.')
  process.exit(1)
}

config({ path: envPath })
// Next 在开发/构建时还会读取 .env.local / .env.[mode].local；
// 这里显式加载，保证 SMTP 等本地覆盖变量也能通过校验。
config({ path: path.resolve(projectRoot, '.env.local') })
config({
  path: path.resolve(
    projectRoot,
    `.env.${process.env.NODE_ENV || 'development'}.local`
  )
})

export const envSchema = z.object({
  KUN_DATABASE_URL: z.string().url(),
  KUN_VISUAL_NOVEL_SITE_URL: z.string().url(),

  NEXT_PUBLIC_KUN_PATCH_ADDRESS_DEV: z.string(),
  NEXT_PUBLIC_KUN_PATCH_ADDRESS_PROD: z.string(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  REDIS_PASSWORD: z.string().optional(),

  JWT_ISS: z.string(),
  JWT_AUD: z.string(),
  JWT_SECRET: z.string(),

  NODE_ENV: z.enum(['development', 'test', 'production']),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM_EMAIL: z.string().email(),
  SMTP_FROM_NAME: z.string(),

  KUN_VISUAL_NOVEL_S3_STORAGE_ACCESS_KEY_ID: z.string(),
  KUN_VISUAL_NOVEL_S3_STORAGE_SECRET_ACCESS_KEY: z.string(),
  KUN_VISUAL_NOVEL_S3_STORAGE_BUCKET_NAME: z.string(),
  KUN_VISUAL_NOVEL_S3_STORAGE_ENDPOINT: z.string(),
  KUN_VISUAL_NOVEL_S3_STORAGE_REGION: z.string(),
  NEXT_PUBLIC_KUN_VISUAL_NOVEL_S3_STORAGE_URL: z.string(),
  KUN_VISUAL_NOVEL_S3_KEY_PREFIX: z.string().optional(),
  KUN_S3_FORCE_PATH_STYLE: z.string().optional(),

  KUN_VISUAL_NOVEL_IMAGE_BED_HOST: z.string(),
  KUN_VISUAL_NOVEL_IMAGE_BED_URL: z.string(),
  NEXT_PUBLIC_KUN_RANKING_IMAGE_BED_URL: z.string().optional(),

  KUN_CF_CACHE_ZONE_ID: z.string(),
  KUN_CF_CACHE_PURGE_API_TOKEN: z.string(),

  KUN_VISUAL_NOVEL_INDEX_NOW_KEY: z.string(),

  TRUST_PROXY: z.enum(['true', 'false']).optional(),
  KUN_ENABLE_CRON: z.enum(['true', 'false']).optional(),
  KUN_VISUAL_NOVEL_TEST_SITE_LABEL: z.string().optional()
})

export const env = envSchema.safeParse(process.env)

if (!env.success) {
  throw new Error(
    '❌ Invalid environment variables: ' +
      JSON.stringify(env.error.format(), null, 4)
  )
}
