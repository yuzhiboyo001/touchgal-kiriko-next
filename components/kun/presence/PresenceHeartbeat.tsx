'use client'

import { useEffect } from 'react'
import { useUserStore } from '~/store/userStore'

const HEARTBEAT_INTERVAL_MS = 60_000

export const PresenceHeartbeat = () => {
  const uid = useUserStore((state) => state.user.uid)
  // 以本地用户 uid 为准；cookie 是否有效由心跳接口再校验。
  // 这样 session 处于 pending/unavailable 时也能正常打第一针。
  const isLoggedIn = uid > 0

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    let timer: ReturnType<typeof setInterval> | null = null

    const beat = () => {
      if (document.visibilityState === 'hidden') {
        return
      }

      void fetch('/api/presence/heartbeat', {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true,
        headers: {
          'X-Requested-With': 'kun-fetch'
        }
      }).catch(() => undefined)
    }

    const start = () => {
      if (timer) {
        return
      }
      beat()
      timer = setInterval(beat, HEARTBEAT_INTERVAL_MS)
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

    const handlePageHide = () => {
      navigator.sendBeacon?.('/api/presence/heartbeat')
    }

    start()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [isLoggedIn])

  return null
}
