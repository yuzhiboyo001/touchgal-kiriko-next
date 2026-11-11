import { NextResponse } from 'next/server'
import { getOnlinePresenceCount } from '~/lib/presence'

export const dynamic = 'force-dynamic'

export const GET = async () => {
  try {
    const online = await getOnlinePresenceCount()
    return NextResponse.json({ online })
  } catch {
    return NextResponse.json({ online: null }, { status: 503 })
  }
}
