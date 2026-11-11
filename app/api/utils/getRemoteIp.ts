import { isIP } from 'net'

const getFirstHeaderValue = (value: string | null) =>
  value?.split(',')[0]?.trim() ?? ''

const isValidIp = (value: string) => {
  const normalized = value.trim()
  return (
    normalized.length > 0 && normalized.length <= 45 && isIP(normalized) > 0
  )
}

/**
 * 只在明确信任反向代理时读取转发头。
 *
 * 生产环境必须设置 TRUST_PROXY=true，并保证：
 * - 源站只能由 Cloudflare/Nginx 访问
 * - Nginx 覆盖 X-Real-IP，而不是直接透传客户端头
 * - Cloudflare 回源时使用 CF-Connecting-IP
 */
export const getRemoteIp = (headers: Headers): string => {
  const trustProxy =
    process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'development'

  if (!trustProxy) {
    return ''
  }

  const cfConnectingIp = getFirstHeaderValue(headers.get('CF-Connecting-IP'))
  if (isValidIp(cfConnectingIp)) {
    return cfConnectingIp
  }

  const realIp = getFirstHeaderValue(headers.get('X-Real-IP'))
  if (isValidIp(realIp)) {
    return realIp
  }

  // 不直接信任 X-Forwarded-For 的第一段：
  // 客户端可以自行伪造最左侧地址，必须由可信代理覆盖后再使用。
  return ''
}
