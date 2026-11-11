// app/providers.tsx

'use client'

import { AppProgressProvider as ProgressProvider } from '@bprogress/next'
import { HeroUIProvider } from '@heroui/system'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useTaskStore } from '~/store/taskStore'
import { useUserStore } from '~/store/userStore'
import { useSessionStore } from '~/store/sessionStore'
import { useFeatureAccessStore } from '~/store/featureAccessStore'
import { refreshSession } from '~/store/sync'
import { AffectionFeedback } from '~/components/kun/KirikoStandee/affection/AffectionFeedback'
import { StoreSync } from '~/components/kun/StoreSync'
import { PresenceHeartbeat } from '~/components/kun/presence/PresenceHeartbeat'

const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((state) => state.user)
  const userUid = user.uid
  const sessionStatus = useSessionStore((state) => state.status)
  const isLoggedIn = sessionStatus === 'authenticated' && userUid !== 0

  const fetchTasks = useTaskStore((state) => state.fetchTasks)

  // ✅ 直接拿全局弹窗数据，以及修改它的方法
  const levelUpToast = useUserStore((state) => state.levelUpToast)
  const setLevelUpToast = useUserStore((state) => state.setLevelUpToast)

  const initializedRef = useRef(false)
  const activeUidRef = useRef(0)
  const lastTaskRefreshRef = useRef(0)
  const lastSessionRefreshRef = useRef(0)

  // 初始化任务（页面首次加载对齐一次服务端；登录/切号时必须 force，避免吃 3 秒缓存）
  useEffect(() => {
    if (
      isLoggedIn &&
      userUid > 0 &&
      (activeUidRef.current !== userUid || !initializedRef.current)
    ) {
      activeUidRef.current = userUid
      initializedRef.current = true
      lastTaskRefreshRef.current = Date.now()
      void fetchTasks(true)
    }

    if (!isLoggedIn || userUid === 0) {
      activeUidRef.current = 0
      initializedRef.current = false
      lastTaskRefreshRef.current = 0
    }
  }, [isLoggedIn, userUid, fetchTasks])

  // 从其他标签页/最小化回来时，刷新 session 和动态功能开关
  useEffect(() => {
    if (sessionStatus !== 'authenticated' && sessionStatus !== 'unavailable') {
      return
    }

    const refreshOnVisible = () => {
      if (document.visibilityState !== 'visible') {
        return
      }
      const now = Date.now()
      if (now - lastSessionRefreshRef.current < 60_000) {
        return
      }
      lastSessionRefreshRef.current = now
      void refreshSession()
      void useFeatureAccessStore.getState().load()
    }

    window.addEventListener('focus', refreshOnVisible)
    document.addEventListener('visibilitychange', refreshOnVisible)
    return () => {
      window.removeEventListener('focus', refreshOnVisible)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [sessionStatus])

  // 从其他标签页/最小化回来时，任务状态可能已经过期
  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const refreshOnVisible = () => {
      if (document.visibilityState !== 'visible') {
        return
      }
      const now = Date.now()
      if (now - lastTaskRefreshRef.current < 10_000) {
        return
      }
      lastTaskRefreshRef.current = now
      void fetchTasks(true)
    }

    window.addEventListener('focus', refreshOnVisible)
    document.addEventListener('visibilitychange', refreshOnVisible)
    return () => {
      window.removeEventListener('focus', refreshOnVisible)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [isLoggedIn, fetchTasks])

  return (
    <>
      {children}

      {levelUpToast?.show && (
        <AffectionFeedback
          isOpen={levelUpToast.show}
          gained={0}
          total={levelUpToast.total}
          leveledUp={true}
          newLevel={levelUpToast.level}
          actionLabel="好感度提升"
          onComplete={() =>
            setLevelUpToast({
              show: false,
              level: levelUpToast.level,
              total: levelUpToast.total
            })
          }
        />
      )}
    </>
  )
}

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()

  return (
    <ProgressProvider
      shallowRouting
      color="#006FEE"
      height="4px"
      options={{ showSpinner: false }}
    >
      <HeroUIProvider navigate={router.push}>
        <ThemeProvider attribute="class">
          <StoreSync />
          <PresenceHeartbeat />
          <TaskProvider>{children}</TaskProvider>
        </ThemeProvider>
      </HeroUIProvider>
    </ProgressProvider>
  )
}
