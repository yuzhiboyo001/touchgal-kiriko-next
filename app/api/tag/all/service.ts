import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { getTagSchema } from '~/validations/tag'
import type { Tag } from '~/types/api/tag'

export type TagNsfwMode = 'nsfw' | 'all'

export const getTag = async (
  input: z.infer<typeof getTagSchema>,
  blockedTagIds: number[] = [],
  nsfwMode: TagNsfwMode = 'all'
) => {
  const { page, limit } = input
  const offset = (page - 1) * limit
  const where = blockedTagIds.length
    ? { id: { notIn: blockedTagIds } }
    : undefined

  const [data, total] = await Promise.all([
    prisma.patch_tag.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { count: 'desc' }
    }),
    prisma.patch_tag.count({ where })
  ])

  const nsfwCountMap = new Map<number, number>()
  if (nsfwMode === 'nsfw' && data.length > 0) {
    const grouped = await prisma.patch_tag_relation.groupBy({
      by: ['tag_id'],
      where: {
        tag_id: { in: data.map((tag) => tag.id) },
        patch: { content_limit: 'nsfw' }
      },
      _count: { _all: true }
    })
    for (const row of grouped) {
      nsfwCountMap.set(row.tag_id, row._count._all)
    }
  }

  const tags: Tag[] = data
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: nsfwMode === 'nsfw' ? (nsfwCountMap.get(tag.id) ?? 0) : tag.count,
      alias: tag.alias
    }))
    .filter((tag) => tag.count > 0)

  return { tags, total }
}
