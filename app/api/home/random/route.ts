import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { getPatchVisibilityWhere } from '~/app/api/utils/getPatchVisibilityWhere'
import type { Prisma } from '~/prisma/generated/prisma/client'

const getRandomUniqueId = async (visibilityWhere: Prisma.patchWhereInput) => {
  // 不在 Node 里加载全表：用主键区间随机 + 一次索引查询
  const bounds = await prisma.patch.aggregate({
    where: visibilityWhere,
    _min: { id: true },
    _max: { id: true }
  })

  if (bounds._min.id === null || bounds._max.id === null) {
    return '未查询到文章'
  }

  const randomId =
    Math.floor(Math.random() * (bounds._max.id - bounds._min.id + 1)) +
    bounds._min.id

  const row =
    (await prisma.patch.findFirst({
      where: { ...visibilityWhere, id: { gte: randomId } },
      select: { unique_id: true },
      orderBy: { id: 'asc' }
    })) ??
    (await prisma.patch.findFirst({
      where: visibilityWhere,
      select: { unique_id: true },
      orderBy: { id: 'asc' }
    }))

  return row ? { uniqueId: row.unique_id } : '未查询到文章'
}

export const GET = async (req: NextRequest) => {
  const visibilityWhere = await getPatchVisibilityWhere(req)

  const response = await getRandomUniqueId(visibilityWhere)
  return NextResponse.json(response)
}
