// app/api/crawl/status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'

// 各榜显示配置
const RANKING_META: Record<string, { name: string; interval_sec: number }> = {
  daily: { name: '日榜', interval_sec: 30 * 60 },
  weekly: { name: '周榜', interval_sec: 2 * 60 * 60 },
  monthly: { name: '月榜', interval_sec: 24 * 60 * 60 },
  yearly: { name: '年榜', interval_sec: 7 * 24 * 60 * 60 },
  total: { name: '总榜', interval_sec: 7 * 24 * 60 * 60 }
}

export async function GET() {
  const states = await prisma.crawl_state.findMany()
  const now = Date.now()

  const result = Object.entries(RANKING_META).map(([type, meta]) => {
    const state = states.find((s) => s.ranking_type === type)

    if (!state) {
      return {
        ranking_type: type,
        name: meta.name,
        interval_sec: meta.interval_sec,
        last_crawl_at: null,
        next_crawl_at: null,
        seconds_until_next: 0,
        status: 'never' as const,
        count: 0,
        error: null
      }
    }

    const nextMs = state.next_crawl_at.getTime()
    const secondsUntilNext = Math.max(0, Math.floor((nextMs - now) / 1000))

    let status: 'fresh' | 'soon' | 'overdue' = 'fresh'
    if (secondsUntilNext === 0) status = 'overdue'
    else if (secondsUntilNext < 60) status = 'soon'

    return {
      ranking_type: type,
      name: meta.name,
      interval_sec: state.interval_sec,
      last_crawl_at: state.last_crawl_at.toISOString(),
      next_crawl_at: state.next_crawl_at.toISOString(),
      seconds_until_next: secondsUntilNext,
      status,
      count: state.last_count,
      error: state.last_error
    }
  })

  return NextResponse.json({ success: true, states: result })
}
