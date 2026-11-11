import { prisma } from '~/prisma/index'

/**
 * 返回与当前用户存在双向拉黑关系的用户 ID。
 * 用于评论、评分、资源等列表的统一过滤。
 */
export const getBlockedUserIds = async (uid: number): Promise<number[]> => {
  if (uid <= 0) return []

  const relations = await prisma.user_block_relation.findMany({
    where: {
      OR: [{ blocker_id: uid }, { blocked_id: uid }]
    },
    select: { blocker_id: true, blocked_id: true }
  })

  const ids = new Set<number>()
  for (const relation of relations) {
    if (relation.blocker_id === uid) ids.add(relation.blocked_id)
    if (relation.blocked_id === uid) ids.add(relation.blocker_id)
  }

  return [...ids]
}
