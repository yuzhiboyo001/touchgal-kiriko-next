import { redis, runRedisCommand } from './redis'

interface RateLimitOptions {
  key: string
  limit: number
  windowSeconds: number
}

/**
 * 简单的固定窗口限流。
 * Redis 不可用时 fail-open，避免登录/注册整体不可用。
 */
export const checkRateLimit = async ({
  key,
  limit,
  windowSeconds
}: RateLimitOptions) => {
  try {
    const windowId = Math.floor(Date.now() / 1000 / windowSeconds)
    const redisKey = `rate-limit:${key}:${windowId}`

    const count = await runRedisCommand(() => redis.incr(redisKey))
    if (count === 1) {
      await runRedisCommand(() => redis.expire(redisKey, windowSeconds + 5))
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count)
    }
  } catch (error) {
    console.error('rate limit redis error:', error)
    return { allowed: true, remaining: limit }
  }
}
