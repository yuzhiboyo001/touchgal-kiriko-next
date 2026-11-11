import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json({ blocked: false })
  }

  const { searchParams } = req.nextUrl
  const targetUid = Number(searchParams.get('uid'))
  if (!targetUid || isNaN(targetUid)) {
    return NextResponse.json({ blocked: false })
  }

  if (targetUid === payload.uid) {
    return NextResponse.json({ blocked: false })
  }

  const rel = await prisma.user_block_relation.findFirst({
    where: {
      OR: [
        { blocker_id: payload.uid, blocked_id: targetUid },
        { blocker_id: targetUid, blocked_id: payload.uid }
      ]
    },
    select: { id: true }
  })

  return NextResponse.json({ blocked: !!rel })
}
