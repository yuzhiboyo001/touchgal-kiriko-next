import 'dotenv/config'
import { config as loadEnv } from 'dotenv'
import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'

// PM2 的 backup 进程环境不一定继承 .env.production.local；
// 显式补载，避免备份成功但 Healthchecks 收不到 ping。
loadEnv({ path: join(process.cwd(), '.env.production.local') })

const BUCKET = process.env.KUN_BACKUP_S3_BUCKET
const RETENTION_DAYS = Number(process.env.KUN_BACKUP_RETENTION_DAYS || 14)
const PREFIX = (process.env.KUN_BACKUP_S3_PREFIX || 'postgres').replace(
  /\/+$/,
  ''
)
const PG_DUMP = process.env.PG_DUMP_BIN || 'pg_dump'

if (!BUCKET) {
  console.error(
    '缺少 KUN_BACKUP_S3_BUCKET；请先创建私有 R2 备份桶，不要用公开图片桶。'
  )
  process.exit(1)
}

if (!process.env.KUN_DATABASE_URL) {
  console.error('缺少 KUN_DATABASE_URL')
  process.exit(1)
}

const endpoint =
  process.env.KUN_BACKUP_S3_ENDPOINT ||
  process.env.KUN_VISUAL_NOVEL_S3_STORAGE_ENDPOINT
const region =
  process.env.KUN_BACKUP_S3_REGION ||
  process.env.KUN_VISUAL_NOVEL_S3_STORAGE_REGION ||
  'auto'
const accessKeyId =
  process.env.KUN_BACKUP_S3_ACCESS_KEY_ID ||
  process.env.KUN_VISUAL_NOVEL_S3_STORAGE_ACCESS_KEY_ID
const secretAccessKey =
  process.env.KUN_BACKUP_S3_SECRET_ACCESS_KEY ||
  process.env.KUN_VISUAL_NOVEL_S3_STORAGE_SECRET_ACCESS_KEY

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error('缺少备份 R2 的 endpoint / access key / secret key')
  process.exit(1)
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: process.env.KUN_BACKUP_S3_FORCE_PATH_STYLE === 'true'
})

const cleanDatabaseUrl = (value) =>
  value.replace(/([?&])schema=public(&|$)/, '$1').replace(/[?&]$/, '')

const runPgDump = (outputPath) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      PG_DUMP,
      [
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        '--file',
        outputPath,
        cleanDatabaseUrl(process.env.KUN_DATABASE_URL)
      ],
      { stdio: ['ignore', 'inherit', 'inherit'] }
    )

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`pg_dump exited with code ${code}`))
    })
  })

const listOldBackups = async () => {
  const old = []
  let token

  do {
    const result = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `${PREFIX}/`,
        ContinuationToken: token
      })
    )

    for (const object of result.Contents || []) {
      if (object.LastModified && object.Key) {
        const ageMs = Date.now() - object.LastModified.getTime()
        if (ageMs > RETENTION_DAYS * 24 * 60 * 60 * 1000) {
          old.push(object.Key)
        }
      }
    }
    token = result.IsTruncated ? result.NextContinuationToken : undefined
  } while (token)

  return old
}

const main = async () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${PREFIX}/postgres-${stamp}.dump`
  const tempFile = join(tmpdir(), `kun-backup-${stamp}.dump`)

  try {
    console.log(`[backup] pg_dump -> ${tempFile}`)
    await runPgDump(tempFile)

    const stat = await fs.stat(tempFile)
    console.log(
      `[backup] dump size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`
    )

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileName,
        Body: createReadStream(tempFile),
        ContentType: 'application/octet-stream',
        CacheControl: 'private, no-store'
      })
    )
    console.log(`[backup] uploaded: ${BUCKET}/${fileName}`)

    if (RETENTION_DAYS > 0) {
      const old = await listOldBackups()
      for (const key of old) {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
        console.log(`[backup] removed old: ${key}`)
      }
    }
  } finally {
    await fs.rm(tempFile, { force: true }).catch(() => undefined)
  }
}

const pingHealthcheck = async (suffix = '') => {
  const base = process.env.HEALTHCHECK_BACKUP_URL
  if (!base) return
  try {
    await fetch(`${base}${suffix}`, {
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    })
  } catch (error) {
    console.error('[backup] healthcheck ping failed:', error)
  }
}

main()
  .then(() => pingHealthcheck())
  .catch(async (error) => {
    console.error('[backup] failed:', error)
    await pingHealthcheck('/fail')
    process.exitCode = 1
  })
