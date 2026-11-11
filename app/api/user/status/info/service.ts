import { z } from 'zod'
import { prisma } from '~/prisma/index'
import type { UserInfo } from '~/types/api/user'

const getProfileSchema = z.object({
  id: z.coerce.number().min(1).max(9999999)
})

export const getUserProfile = async (
  input: z.infer<typeof getProfileSchema>,
  currentUserUid: number
) => {
  const data = await prisma.user.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
      status: true,
      register_time: true,
      moemoepoint: true,
      nameplate: true,
      donor_until: true,
      _count: {
        select: {
          patch_resource: true,
          patch: true,
          patch_comment: true,
          patch_rating: true,
          follower: true,
          following: true
        }
      }
    }
  })
  if (!data) {
    return '未找到用户'
  }

  const [userFavoritePatchCount, followRelation] = await Promise.all([
    prisma.user_patch_favorite_folder_relation.count({
      where: { folder: { user_id: input.id } }
    }),
    currentUserUid > 0 && currentUserUid !== input.id
      ? prisma.user_follow_relation.findUnique({
          where: {
            follower_id_following_id: {
              follower_id: currentUserUid,
              following_id: input.id
            }
          },
          select: { id: true }
        })
      : Promise.resolve(null)
  ])
  const isSelf = currentUserUid === input.id

  const user: UserInfo = {
    id: data.id,
    requestUserUid: currentUserUid,
    name: data.name,
    email: isSelf ? data.email : '',
    avatar: data.avatar,
    bio: data.bio,
    role: data.role,
    status: data.status,
    registerTime: String(data.register_time),
    moemoepoint: data.moemoepoint,
    nameplate: data.nameplate,
    donorUntil: data.donor_until,
    supporterActive:
      data.nameplate === 'supporter' &&
      (!data.donor_until || data.donor_until.getTime() > Date.now()),
    follower: data._count.following,
    following: data._count.follower,
    isFollow: Boolean(followRelation),
    _count: {
      patch_resource: data._count.patch_resource,
      patch: data._count.patch,
      patch_comment: data._count.patch_comment,
      patch_rating: data._count.patch_rating,
      patch_favorite: userFavoritePatchCount
    }
  }

  return user
}
