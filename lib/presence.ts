import { redis, runRedisCommand } from '~/lib/redis'

const PRESENCE_USERS_KEY = 'kun:touchgal:presence:users'
const PRESENCE_TTL_SECONDS = 90

const heartbeatScript = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local cutoff = tonumber(ARGV[2])
  local ttl = tonumber(ARGV[3])

  redis.call("ZREMRANGEBYSCORE", key, "-inf", cutoff)
  redis.call("ZADD", key, now, ARGV[4])
  redis.call("PEXPIRE", key, ttl)

  return redis.call("ZCARD", key)
`

const countScript = `
  local key = KEYS[1]
  local cutoff = tonumber(ARGV[1])

  redis.call("ZREMRANGEBYSCORE", key, "-inf", cutoff)
  return redis.call("ZCARD", key)
`

const getCutoff = () => Date.now() - PRESENCE_TTL_SECONDS * 1000

export const heartbeatPresence = async (uid: number): Promise<number> => {
  if (!Number.isInteger(uid) || uid <= 0) {
    return getOnlinePresenceCount()
  }

  const now = Date.now()
  const result = await runRedisCommand(() =>
    redis.eval(
      heartbeatScript,
      1,
      PRESENCE_USERS_KEY,
      String(now),
      String(getCutoff()),
      String((PRESENCE_TTL_SECONDS + 60) * 1000),
      String(uid)
    )
  )

  return Number(result)
}

export const getOnlinePresenceCount = async (): Promise<number> => {
  const result = await runRedisCommand(() =>
    redis.eval(countScript, 1, PRESENCE_USERS_KEY, String(getCutoff()))
  )

  return Number(result)
}

export const getOnlinePresenceForUids = async (
  uids: number[]
): Promise<number[]> => {
  const uniqueUids = [...new Set(uids)].filter(
    (uid) => Number.isInteger(uid) && uid > 0
  )
  if (uniqueUids.length === 0) {
    return []
  }

  await runRedisCommand(() =>
    redis.eval(countScript, 1, PRESENCE_USERS_KEY, String(getCutoff()))
  )

  // 兼容旧版 Redis（本项目本地 Redis 3.x 不支持 ZMSCORE）
  const scores = await runRedisCommand(() =>
    Promise.all(
      uniqueUids.map((uid) => redis.zscore(PRESENCE_USERS_KEY, String(uid)))
    )
  )

  return uniqueUids.filter((_, index) => scores[index] !== null)
}
