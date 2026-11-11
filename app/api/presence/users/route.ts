import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { getOnlinePresenceForUids } from '~/lib/presence'

const MAX_UIDS = 100

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json({ onlineUids: [] }, { status: 401 })
  }

  const raw = req.nextUrl.searchParams.get('uids') ?? ''
  const uids = raw
    .split(',')
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, MAX_UIDS)

  try {
    const onlineUids = await getOnlinePresenceForUids(uids)
    return NextResponse.json({ onlineUids })
  } catch {
    return NextResponse.json({ onlineUids: [] }, { status: 503 })
  }
}
