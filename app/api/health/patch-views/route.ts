import { timingSafeEqual } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getPatchViewBufferSize } from '~/app/api/patch/views/buffer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEFAULT_THRESHOLD = 5000

const getExpectedToken = () => process.env.PATCH_VIEW_HEALTH_TOKEN?.trim() ?? ''

const getProvidedToken = (request: NextRequest) => {
  const headerToken = request.headers.get('x-health-token')?.trim()
  if (headerToken) return headerToken

  const authorization = request.headers.get('authorization')
  if (!authorization) return ''

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
}

const hasValidToken = (request: NextRequest) => {
  const expected = getExpectedToken()
  const provided = getProvidedToken(request)
  if (!expected || !provided) return false

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)
  if (expectedBuffer.length !== providedBuffer.length) return false

  return timingSafeEqual(expectedBuffer, providedBuffer)
}

const isAllowedIp = (request: NextRequest) => {
  const allowlist = (process.env.PATCH_VIEW_HEALTH_ALLOWED_IPS ?? '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)

  if (allowlist.length === 0) return true

  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip =
    forwardedFor?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip')?.trim() ??
    ''

  return Boolean(ip) && allowlist.includes(ip)
}

const getThreshold = () => {
  const parsed = Number(process.env.PATCH_VIEW_BUFFER_ALERT_THRESHOLD)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_THRESHOLD
}

export const GET = async (request: NextRequest) => {
  // Hide the endpoint entirely unless both checks pass.
  if (!hasValidToken(request) || !isAllowedIp(request)) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const size = await getPatchViewBufferSize()
    const threshold = getThreshold()
    const healthy = size.total < threshold

    return NextResponse.json(
      {
        ok: healthy,
        threshold,
        ...size
      },
      {
        status: healthy ? 200 : 503,
        headers: { 'cache-control': 'no-store' }
      }
    )
  } catch (error) {
    console.error('[patch-view-health] failed to read Redis buffer:', error)
    return NextResponse.json(
      { ok: false, error: 'Redis unavailable' },
      {
        status: 503,
        headers: { 'cache-control': 'no-store' }
      }
    )
  }
}
