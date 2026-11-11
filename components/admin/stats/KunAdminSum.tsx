'use client'

import { FC, useEffect, useState } from 'react'
import { StatsCard } from './StatsCard'
import { kunFetchGet } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { ADMIN_STATS_SUM_MAP } from '~/constants/admin'
import type { SumData } from '~/types/api/admin'

export const KunAdminSum: FC = () => {
  const [sum, setSum] = useState<SumData>({
    userCount: 0,
    galgameCount: 0,
    galgameResourceCount: 0,
    galgamePatchResourceCount: 0,
    galgameCommentCount: 0
  })
  const [online, setOnline] = useState<number | null>(null)

  const fetchSummaryData = async () => {
    const res = await kunFetchGet<KunResponse<SumData>>('/admin/stats/sum')
    kunErrorHandler(res, setSum)
  }

  const fetchOnline = async () => {
    try {
      const response = await fetch('/api/presence/stats', {
        cache: 'no-store',
        credentials: 'same-origin'
      })
      if (!response.ok) {
        return
      }
      const data = (await response.json()) as { online: number | null }
      setOnline(typeof data.online === 'number' ? data.online : null)
    } catch {
      // 在线人数失败不影响统计数据
    }
  }

  useEffect(() => {
    void fetchSummaryData()

    const initialTimer = setTimeout(() => {
      void fetchOnline()
    }, 0)
    const timer = setInterval(fetchOnline, 30_000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">数据统计</h2>

      <div className="flex flex-wrap gap-4">
        <StatsCard
          title={ADMIN_STATS_SUM_MAP.userCount}
          value={sum.userCount}
        />
        <StatsCard title="当前在线用户" value={online ?? '--'} />
        {Object.entries(ADMIN_STATS_SUM_MAP)
          .filter(([key]) => key !== 'userCount')
          .map(([key, title]) => (
            <StatsCard
              key={key}
              title={title}
              value={sum[key as keyof SumData]}
            />
          ))}
      </div>
    </div>
  )
}
