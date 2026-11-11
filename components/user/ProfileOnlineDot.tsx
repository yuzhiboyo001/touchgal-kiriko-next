'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '~/store/userStore'

const ONLINE_POLL_MS = 30_000

export const ProfileOnlineDot = ({ userId }: { userId: number }) => {
  const uid = useUserStore((state) => state.user.uid)
  const [online, setOnline] = useState(false)

  useEffect(() => {
    if (!uid) {
      return
    }

    let timer: ReturnType<typeof setInterval> | null = null

    const load = async () => {
      if (document.visibilityState === 'hidden') {
        return
      }

      try {
        const response = await fetch(
          `/api/presence/users?uids=${encodeURIComponent(String(userId))}`,
          {
            cache: 'no-store',
            credentials: 'same-origin'
          }
        )
        if (!response.ok) {
          return
        }
        const data = (await response.json()) as { onlineUids?: number[] }
        setOnline(Boolean(data.onlineUids?.includes(userId)))
      } catch {
        // 在线状态失败时不显示绿点
      }
    }

    const start = () => {
      if (timer) return
      void load()
      timer = setInterval(load, ONLINE_POLL_MS)
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
  }, [uid, userId])

  if (!online || !uid) {
    return null
  }

  return (
    <span
      title="当前在线"
      aria-label="当前在线"
      className="absolute -bottom-2 -right-6 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[11px] font-medium leading-none text-white"
    >
      <span className="size-1.5 rounded-full bg-white/80" />在 线
    </span>
  )
}
