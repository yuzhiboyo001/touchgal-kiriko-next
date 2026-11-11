import { createHmac } from 'crypto'
import { redis, runRedisCommand } from '~/lib/redis'

const PATCH_VIEWS_BUFFER_KEY = 'kun:touchgal:views:buffer'
const PATCH_VIEWS_PENDING_KEY = `${PATCH_VIEWS_BUFFER_KEY}:pending`
const PATCH_VIEW_DEDUPE_PREFIX = 'kun:touchgal:views:dedupe'
const PATCH_VIEW_DEDUPE_TTL_SECONDS = 24 * 60 * 60

const incrementViewIfFirstScript = `
  local isFirst = redis.call("SET", KEYS[1], "1", "EX", ARGV[2], "NX")
  if isFirst then
    redis.call("HINCRBY", KEYS[2], ARGV[1], 1)
    return 1
  end
  return 0
`

const getViewDedupeKey = (uniqueId: string, ip: string) => {
  const normalized = ip.trim()
  if (!normalized) return null

  const secret =
    process.env.VIEW_DEDUPE_SECRET ||
    process.env.JWT_SECRET ||
    'kiriko-view-dedupe'
  const ipHash = createHmac('sha256', secret)
    .update(normalized)
    .digest('hex')
    .slice(0, 32)

  return `${PATCH_VIEW_DEDUPE_PREFIX}:${uniqueId}:${ipHash}`
}

/**
 * 同一 IP + 同一游戏 24 小时内只算一次。
 * 先 SET NX 再去重计数，避免并发请求重复加浏览。
 */
export const claimPatchView = async (uniqueId: string, ip: string) => {
  const key = getViewDedupeKey(uniqueId, ip)
  if (!key) return true

  const result = await runRedisCommand(() =>
    redis.set(key, '1', 'EX', PATCH_VIEW_DEDUPE_TTL_SECONDS, 'NX')
  )
  return result === 'OK'
}

/**
 * 生产环境：去重和 buffer +1 放在同一个 Lua 脚本里，只走一次 Redis。
 */
export const incrementPatchViewBufferOnce = async (
  uniqueId: string,
  ip: string
) => {
  const key = getViewDedupeKey(uniqueId, ip)
  if (!key) {
    await incrementPatchViewBuffer(uniqueId)
    return true
  }

  const result = await runRedisCommand(() =>
    redis.eval(
      incrementViewIfFirstScript,
      2,
      key,
      PATCH_VIEWS_BUFFER_KEY,
      uniqueId,
      String(PATCH_VIEW_DEDUPE_TTL_SECONDS)
    )
  )
  return Number(result) === 1
}

interface PatchViewBufferCheckout {
  key: string
  entries: Record<string, string>
}

export const incrementPatchViewBuffer = async (uniqueId: string) => {
  await runRedisCommand(() =>
    redis.hincrby(PATCH_VIEWS_BUFFER_KEY, uniqueId, 1)
  )
}

export const checkoutPatchViewBuffer =
  async (): Promise<PatchViewBufferCheckout | null> => {
    const hasPending = await runRedisCommand(() =>
      redis.eval(
        `
          if redis.call("EXISTS", KEYS[2]) == 0 then
            if redis.call("EXISTS", KEYS[1]) == 0 then
              return 0
            end
            redis.call("RENAME", KEYS[1], KEYS[2])
          end
          return 1
        `,
        2,
        PATCH_VIEWS_BUFFER_KEY,
        PATCH_VIEWS_PENDING_KEY
      )
    )

    if (hasPending !== 1) {
      return null
    }

    const entries = await runRedisCommand(() =>
      redis.hgetall(PATCH_VIEWS_PENDING_KEY)
    )
    if (Object.keys(entries).length === 0) {
      await runRedisCommand(() => redis.del(PATCH_VIEWS_PENDING_KEY))
      return null
    }

    return {
      key: PATCH_VIEWS_PENDING_KEY,
      entries
    }
  }

export const getPatchViewBufferSize = async () => {
  const [buffer, pending] = await Promise.all([
    runRedisCommand(() => redis.hlen(PATCH_VIEWS_BUFFER_KEY)),
    runRedisCommand(() => redis.hlen(PATCH_VIEWS_PENDING_KEY))
  ])

  return {
    buffer,
    pending,
    total: buffer + pending
  }
}

export const acknowledgePatchViewBuffer = async (key: string) => {
  if (key !== PATCH_VIEWS_PENDING_KEY) {
    throw new Error('Invalid patch view buffer pending key')
  }

  await runRedisCommand(() => redis.del(key))
}
