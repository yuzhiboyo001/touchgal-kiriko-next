// app/api/user/follow/follow/route.ts
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createDedupMessage } from '~/app/api/utils/message'

const uidSchema = z.object({
  uid: z.coerce.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
})

const followUser = async (uid: number, currentUserUid: number) => {
  if (uid === currentUserUid) {
    return '您不能关注自己'
  }

  // ✅ 检查黑名单（双向）
  const blockRel = await prisma.user_block_relation.findFirst({
    where: {
      OR: [
        { blocker_id: currentUserUid, blocked_id: uid },
        { blocker_id: uid, blocked_id: currentUserUid }
      ]
    }
  })
  if (blockRel) {
    return '无法关注该用户'
  }

  return prisma.$transaction(async (prisma) => {
    // ✅ upsert 防重复关注
    await prisma.user_follow_relation.upsert({
      where: {
        follower_id_following_id: {
          follower_id: currentUserUid,
          following_id: uid
        }
      },
      update: {},
      create: {
        follower_id: currentUserUid,
        following_id: uid
      }
    })

    await createDedupMessage({
      type: 'follow',
      content: '关注了您',
      sender_id: currentUserUid,
      recipient_id: uid,
      link: `/user/${currentUserUid}/comment`
    })

    return {}
  })
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, uidSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await followUser(input.uid, payload?.uid)
  return NextResponse.json(response)
}
