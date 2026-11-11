import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import { markdownToText } from '~/utils/markdownToText'
import type { UserComment } from '~/types/api/user'

export const getUserComment = async (
  input: z.infer<typeof getUserInfoSchema>
) => {
  const { uid, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_comment.findMany({
      where: { user_id: uid },
      select: {
        id: true,
        content: true,
        created: true,
        user_id: true,
        patch_id: true,
        user: {
          select: { id: true, name: true, avatar: true }
        },
        patch: {
          select: { unique_id: true, name: true }
        },
        parent: {
          select: {
            user: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: { like_by: true }
        }
      },
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.patch_comment.count({
      where: { user_id: uid }
    })
  ])

  const comments: UserComment[] = data.map((comment) => ({
    id: comment.id,
    patchUniqueId: comment.patch.unique_id,
    content: markdownToText(comment.content).slice(0, 233),
    like: comment._count.like_by,
    userId: comment.user_id,
    patchId: comment.patch_id,
    patchName: comment.patch.name,
    created: String(comment.created),
    quotedUserUid: comment.parent?.user.id,
    quotedUsername: comment.parent?.user.name
  }))

  return { comments, total }
}
