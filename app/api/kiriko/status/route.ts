import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { kirikoInternalFetch } from '~/lib/kiriko/internal'
import { getKirikoAiTier } from '~/lib/kiriko/aiTier'

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json({ locked: false }, { status: 401 })
  }

  try {
    const tier = await getKirikoAiTier(payload.uid, payload.role)
    const response = await kirikoInternalFetch(
      `/ai/status?tier=${encodeURIComponent(tier)}`,
      {}
    )
    if (!response.ok) {
      return NextResponse.json({ locked: false, tier }, { status: 503 })
    }

    const data = (await response.json()) as { locked?: boolean }
    return NextResponse.json({ locked: Boolean(data.locked), tier })
  } catch {
    return NextResponse.json({ locked: false, tier: 'free' }, { status: 503 })
  }
}
