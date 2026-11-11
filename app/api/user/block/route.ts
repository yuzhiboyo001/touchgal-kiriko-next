import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'
import { checkRateLimit } from '~/lib/rateLimit'

const blockSchema = z.object({
  uid: z.number().int().positive()
})

const blockUser = async (blockerId: number, blockedId: number) => {
  if (blockerId === blockedId) {
    return '不能拉黑自己'
  }

  const [blocker, blockedUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: blockerId },
      select: { id: true, role: true }
    }),
    prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true, role: true }
    })
  ])
  if (!blocker) {
    return '用户不存在'
  }
  if (!blockedUser) {
    return '用户不存在'
  }

  // 普通用户/创作者不能拉黑管理员或超级管理员
  if (blocker.role <= 2 && blockedUser.role >= 3) {
    return '不能拉黑管理员或超级管理员'
  }

  // 拉黑后同时清理双向关注关系
  await prisma.$transaction([
    prisma.user_block_relation.upsert({
      where: {
        blocker_id_blocked_id: {
          blocker_id: blockerId,
          blocked_id: blockedId
        }
      },
      update: {},
      create: {
        blocker_id: blockerId,
        blocked_id: blockedId
      }
    }),
    prisma.user_follow_relation.deleteMany({
      where: {
        OR: [
          { follower_id: blockerId, following_id: blockedId },
          { follower_id: blockedId, following_id: blockerId }
        ]
      }
    })
  ])

  return {}
}

const unblockUser = async (blockerId: number, blockedId: number) => {
  await prisma.user_block_relation.deleteMany({
    where: {
      blocker_id: blockerId,
      blocked_id: blockedId
    }
  })

  return {}
}

export const POST = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const rate = await checkRateLimit({
    key: `block:${payload.uid}`,
    limit: 20,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('操作太频繁，请稍后再试')
  }

  const input = await kunParsePostBody(req, blockSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const res = await blockUser(payload.uid, input.uid)
  return NextResponse.json(res)
}

export const DELETE = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const rate = await checkRateLimit({
    key: `block:${payload.uid}`,
    limit: 20,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('操作太频繁，请稍后再试')
  }

  const { searchParams } = req.nextUrl
  const blockedId = Number(searchParams.get('uid'))
  if (!blockedId || isNaN(blockedId)) {
    return NextResponse.json('参数错误')
  }

  const res = await unblockUser(payload.uid, blockedId)
  return NextResponse.json(res)
}
