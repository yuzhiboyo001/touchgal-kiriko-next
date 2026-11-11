'use client'

import { useEffect, useState } from 'react'

const STATS_INTERVAL_MS = 30_000

export const PresenceBadge = () => {
  const [online, setOnline] = useState<number | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const load = async () => {
      if (document.visibilityState === 'hidden') {
        return
      }

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
        // 在线人数失败时保持当前显示，不影响站点
      }
    }

    const start = () => {
      if (timer) {
        return
      }
      void load()
      timer = setInterval(load, STATS_INTERVAL_MS)
    }

    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stop()
      } else {
        start()
      }
    }

    start()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <span
      className="flex shrink-0 items-center gap-1.5 text-[11px] text-default-500"
      aria-label={online === null ? '在线人数加载中' : `当前 ${online} 人在线`}
      title={online === null ? '在线人数加载中' : `当前 ${online} 人在线`}
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      <span className="hidden sm:inline">
        {online === null ? '--' : online} 在线
      </span>
      <span className="sm:hidden">{online === null ? '--' : online}</span>
    </span>
  )
}
