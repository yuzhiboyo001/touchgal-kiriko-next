// app/api/ranking/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { requireNsfwAccess } from '../utils/nsfwAccess'

export async function GET(req: NextRequest) {
  const access = await requireNsfwAccess(req)
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.message },
      { status: access.status }
    )
  }

  const type = req.nextUrl.searchParams.get('type') || 'daily'

  // ============================================================
  // 1. 读排行榜
  // ============================================================
  const rankings = await prisma.dlsite_ranking.findMany({
    where: { ranking_type: type },
    orderBy: { rank: 'asc' },
    take: 100
  })

  // ============================================================
  // 2. 拿所有 RJ 号，去资源站查对应的 unique_id
  // ============================================================
  const rjIds = rankings.map((r) => r.rj_id).filter((id): id is string => !!id)

  const patches =
    rjIds.length > 0
      ? await prisma.patch.findMany({
          where: { dlsite_code: { in: rjIds } }, // ✅ 用 dlsite_code 匹配
          select: {
            unique_id: true, // ✅ 拿 unique_id
            dlsite_code: true
          }
        })
      : []

  // ============================================================
  // 3. 构造 RJ 号 → unique_id 映射
  // ============================================================
  const patchMap = new Map(
    patches
      .filter((p) => p.dlsite_code)
      .map((p) => [p.dlsite_code as string, p.unique_id])
  )

  // ============================================================
  // 4. 合并：每条排行数据加一个 patch_unique_id 字段
  //    - 有 = 站内存在，跳站内
  //    - null = 站内没有，跳 DLsite
  // ============================================================
  const merged = rankings.map((r) => ({
    ...r,
    patch_unique_id: r.rj_id ? patchMap.get(r.rj_id) || null : null
  }))

  return NextResponse.json({
    success: true,
    ranking_type: type,
    count: merged.length,
    rankings: merged
  })
}
