import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const list = await prisma.user_block_relation.findMany({
    where: { blocker_id: payload.uid },
    include: {
      blocked: {
        select: {
          id: true,
          name: true,
          avatar: true,
          bio: true,
          role: true
        }
      }
    },
    orderBy: { created: 'desc' }
  })

  return NextResponse.json(
    list.map((r) => ({
      id: r.blocked.id,
      name: r.blocked.name,
      avatar: r.blocked.avatar,
      bio: r.blocked.bio,
      blockedAt: r.created
    }))
  )
}
