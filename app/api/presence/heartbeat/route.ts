import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { heartbeatPresence } from '~/lib/presence'

export const POST = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const online = await heartbeatPresence(payload.uid)
    return NextResponse.json({ online })
  } catch {
    return NextResponse.json({ error: '在线状态更新失败' }, { status: 503 })
  }
}
