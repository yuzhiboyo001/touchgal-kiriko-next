import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { FloatingCardUser } from '~/types/api/user'

const uidSchema = z.object({
  uid: z.coerce.number().min(1).max(9999999)
})

const getUserFloatingProfile = async (
  input: z.infer<typeof uidSchema>,
  currentUserUid: number
) => {
  const data = await prisma.user.findUnique({
    where: { id: input.uid },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      moemoepoint: true,
      role: true,
      _count: {
        select: {
          follower: true,
          patch: true,
          patch_resource: true
        }
      }
    }
  })
  if (!data) {
    return '未找到用户'
  }

  // ✅ 单向查：我拉黑 TA / TA 拉黑我
  let isBlocked = false // 我拉黑了 TA
  let isBlockedBy = false // TA 拉黑了我
  let isFollow = false
  if (currentUserUid !== 0 && currentUserUid !== input.uid) {
    const [rels, followRelation] = await Promise.all([
      prisma.user_block_relation.findMany({
        where: {
          OR: [
            { blocker_id: currentUserUid, blocked_id: input.uid },
            { blocker_id: input.uid, blocked_id: currentUserUid }
          ]
        },
        select: { blocker_id: true, blocked_id: true }
      }),
      prisma.user_follow_relation.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: currentUserUid,
            following_id: input.uid
          }
        },
        select: { id: true }
      })
    ])

    for (const rel of rels) {
      if (rel.blocker_id === currentUserUid) isBlocked = true
      if (rel.blocker_id === input.uid) isBlockedBy = true
    }
    isFollow = Boolean(followRelation)
  }

  const user: FloatingCardUser = {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    bio: data.bio,
    moemoepoint: data.moemoepoint,
    role: data.role,
    isFollow,
    isBlocked,
    isBlockedBy,
    _count: data._count
  }

  return user
}

export async function GET(req: NextRequest) {
  const input = kunParseGetQuery(req, uidSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)

  const user = await getUserFloatingProfile(input, payload?.uid ?? 0)
  return NextResponse.json(user)
}
