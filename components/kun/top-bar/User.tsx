// components/kun/top-bar/User.tsx
'use client'

import { useShallow } from 'zustand/react/shallow'
import toast from 'react-hot-toast'
import { useEffect, useRef, useState, useCallback } from 'react'
import { NavbarContent, NavbarItem } from '@heroui/navbar'
import Link from 'next/link'
import { Button } from '@heroui/button'
import { Skeleton } from '@heroui/skeleton'
import { useRouter } from '@bprogress/next'
import { useUserStore } from '~/store/userStore'
import { useSessionStore } from '~/store/sessionStore'
import { useMessageStore } from '~/store/messageStore'
import { useSettingStore } from '~/store/settingStore'
import { refreshSession, resetUserScopedStores } from '~/store/sync'
import { ThemeSwitcher } from './ThemeSwitcher'
import { useMounted } from '~/hooks/useMounted'
import { UserDropdown } from './UserDropdown'
import { KunSearch } from './Search'
import { UserMessageBell } from './UserMessageBell'
import { Tooltip } from '@heroui/tooltip'
import { RandomGalgameButton } from '~/components/home/carousel/RandomGalgameButton'
import type { SessionStatus, UserSession } from '~/types/api/session'
import { DailyTask } from '~/components/effects/daily-task'
import { Sparkles } from 'lucide-react'

interface Props {
  initialSession: UserSession | null
  initialSessionStatus?: SessionStatus
}

const hasPersistedUserStore = (): boolean => {
  try {
    return Boolean(window.localStorage.getItem('kun-patch-user-store'))
  } catch {
    return true
  }
}

export const KunTopBarUser = ({
  initialSession,
  initialSessionStatus
}: Props) => {
  const router = useRouter()

  // ✅ 控制日课弹窗的状态
  const [isTaskOpen, setIsTaskOpen] = useState(false)

  // ✅ 记录是否显示任务红点
  const [showTaskBadge, setShowTaskBadge] = useState(false)

  const { user, setUser, logout } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      setUser: state.setUser,
      logout: state.logout
    }))
  )

  const {
    hasUnreadNotification,
    hasUnreadConversation,
    setHasUnreadNotification,
    setUnreadMessageStatus
  } = useMessageStore(
    useShallow((state) => ({
      hasUnreadNotification: state.hasUnreadNotification,
      hasUnreadConversation: state.hasUnreadConversation,
      setHasUnreadNotification: state.setHasUnreadNotification,
      setUnreadMessageStatus: state.setUnreadMessageStatus
    }))
  )
  const isMounted = useMounted()
  const missingSessionCheckedRef = useRef(false)
  const sessionStatus = useSessionStore((state) => state.status)
  const hydrateSessionStatus = useSessionStore((state) => state.hydrate)
  const markAuthenticated = useSessionStore((state) => state.markAuthenticated)
  const markAnonymous = useSessionStore((state) => state.markAnonymous)
  const markUnavailable = useSessionStore((state) => state.markUnavailable)
  const hasCachedUser = user.uid > 0 && !!user.name
  const isLoggedIn =
    hasCachedUser &&
    (sessionStatus === 'authenticated' || sessionStatus === 'unavailable')

  useEffect(() => {
    if (!initialSessionStatus) return

    const timer = setTimeout(() => {
      hydrateSessionStatus(
        initialSessionStatus,
        initialSession?.capabilities ?? null
      )
    }, 0)

    return () => clearTimeout(timer)
  }, [hydrateSessionStatus, initialSession, initialSessionStatus])

  // 服务端/客户端都无法确认 session 时，最多显示 3 秒 Skeleton
  useEffect(() => {
    if (!isMounted || sessionStatus !== 'pending') return

    const timer = setTimeout(() => {
      markUnavailable()
    }, 3000)

    return () => clearTimeout(timer)
  }, [isMounted, markUnavailable, sessionStatus])

  // ✅ 监听用户登录状态，决定是否显示红点
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoggedIn || !user.uid) {
        setShowTaskBadge(false)
        return
      }

      // 用今天的日期作为 key，确保每天都会重新提示一次
      const today = new Date().toISOString().split('T')[0]
      const hasOpenedToday = localStorage.getItem(
        `task-opened-${user.uid}-${today}`
      )

      if (!hasOpenedToday) {
        setShowTaskBadge(true)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [isLoggedIn, user.uid])

  // ✅ 点击任务按钮时的处理
  const handleOpenTask = () => {
    setIsTaskOpen(true)
    setShowTaskBadge(false) // 点开后立刻隐藏红点

    // 记录今天已经点开过了
    if (user.uid) {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(`task-opened-${user.uid}-${today}`, 'true')
    }
  }

  useEffect(() => {
    const handleOpenDailyTask = () => {
      setIsTaskOpen(true)
      setShowTaskBadge(false)
      if (user.uid) {
        const today = new Date().toISOString().split('T')[0]
        localStorage.setItem(`task-opened-${user.uid}-${today}`, 'true')
      }
    }

    window.addEventListener('kun:open-daily-task', handleOpenDailyTask)
    return () =>
      window.removeEventListener('kun:open-daily-task', handleOpenDailyTask)
  }, [user.uid])

  const cleanupSession = useCallback(() => {
    resetUserScopedStores()
    logout()
    markAnonymous()
  }, [logout, markAnonymous])

  const handleInvalidSession = useCallback(() => {
    toast.error('用户登录失效')
    cleanupSession()
    router.push('/login')
  }, [cleanupSession, router])

  useEffect(() => {
    if (!isMounted || !initialSession) return

    let cancelled = false
    const hydrateSession = async () => {
      await useSettingStore.persist.rehydrate()
      if (cancelled) return

      setUser(initialSession.user)
      setUnreadMessageStatus(initialSession.unread)
      markAuthenticated(initialSession.capabilities)
    }

    void hydrateSession()
    return () => {
      cancelled = true
    }
  }, [initialSession, isMounted, setUnreadMessageStatus, setUser])

  useEffect(() => {
    if (
      !isMounted ||
      sessionStatus !== 'anonymous' ||
      initialSession ||
      missingSessionCheckedRef.current
    ) {
      return
    }

    missingSessionCheckedRef.current = true
    let cancelled = false

    const handleMissingSession = async () => {
      await useSettingStore.persist.rehydrate()
      const hasStoredUser = hasPersistedUserStore()

      if (hasStoredUser) {
        await useUserStore.persist.rehydrate()
      }
      if (cancelled) return

      const currentUser = hasStoredUser
        ? useUserStore.getState().user
        : { uid: 0 }

      if (!currentUser.uid) {
        markAnonymous()
        return
      }

      const result = await refreshSession()
      if (cancelled) return

      if (result === 'invalid') {
        handleInvalidSession()
      }
    }

    void handleMissingSession()
    return () => {
      cancelled = true
    }
  }, [
    setUnreadMessageStatus,
    setUser,
    initialSession,
    sessionStatus,
    isMounted,
    handleInvalidSession
  ])

  const isSessionReady =
    sessionStatus === 'authenticated'
      ? isLoggedIn && !!user.name
      : sessionStatus !== 'pending'

  // 网络暂时不可用时不要立刻把已登录用户变成游客。
  // 本地仍有用户缓存时继续显示用户菜单，只是需要服务端的操作会失败。
  const isUserLoggedIn =
    isMounted &&
    hasCachedUser &&
    (sessionStatus === 'authenticated' || sessionStatus === 'unavailable') &&
    isSessionReady

  const showAuthButtons =
    isMounted &&
    (sessionStatus === 'anonymous' ||
      (sessionStatus === 'unavailable' && !hasCachedUser) ||
      (sessionStatus === 'authenticated' && isSessionReady && !isUserLoggedIn))

  const hasUnread = hasUnreadNotification || hasUnreadConversation

  if (!isMounted) {
    return (
      <NavbarContent as="div" className="items-center" justify="end">
        <Skeleton className="hidden rounded-lg lg:flex">
          <div className="w-32 h-10 rounded-lg bg-default-300" />
        </Skeleton>
        <Skeleton className="rounded-lg lg:hidden">
          <div className="w-20 h-10 rounded-lg bg-default-300" />
        </Skeleton>
      </NavbarContent>
    )
  }

  return (
    <>
      <NavbarContent as="div" className="items-center" justify="end">
        {(sessionStatus === 'pending' ||
          (sessionStatus === 'authenticated' && !isSessionReady)) && (
          <>
            <Skeleton className="hidden rounded-lg lg:flex">
              <div className="w-32 h-10 rounded-lg bg-default-300" />
            </Skeleton>
            <Skeleton className="rounded-lg lg:hidden">
              <div className="w-20 h-10 rounded-lg bg-default-300" />
            </Skeleton>
          </>
        )}

        {showAuthButtons && (
          <NavbarContent justify="end">
            <NavbarItem className="hidden lg:flex">
              <Link
                href="/login"
                className="text-pink-400/70 hover:text-pink-400 transition-colors"
              >
                登录
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={Link}
                href="/register"
                variant="flat"
                className="hidden lg:flex gal-sticker gal-sticker-pink text-pink-500"
              >
                注册
              </Button>
            </NavbarItem>
            <NavbarItem className="flex lg:hidden">
              <Button
                as={Link}
                href="/login"
                variant="flat"
                className="gal-sticker gal-sticker-pink text-pink-500"
              >
                登录
              </Button>
            </NavbarItem>
          </NavbarContent>
        )}

        {/* 通用功能按钮 */}
        <KunSearch />

        {/* ✅ 动态切换按钮 */}
        {!isUserLoggedIn ? (
          <Tooltip
            disableAnimation
            showArrow
            closeDelay={0}
            content="随机一部游戏"
          >
            <RandomGalgameButton isIconOnly variant="light" />
          </Tooltip>
        ) : (
          <Tooltip disableAnimation showArrow closeDelay={0} content="每日任务">
            <Button
              isIconOnly
              variant="light"
              aria-label="每日任务"
              onPress={handleOpenTask}
              className="relative text-pink-400/80 hover:text-pink-400"
            >
              <Sparkles className="size-6" />

              {/* ✅ 红点提示：今天没打开过任务面板就会显示 */}
              {showTaskBadge && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-background pointer-events-none" />
              )}
            </Button>
          </Tooltip>
        )}

        <ThemeSwitcher />

        {isUserLoggedIn && (
          <>
            <UserMessageBell
              hasUnreadMessages={hasUnread}
              setReadMessage={() => setHasUnreadNotification(false)}
            />
            <UserDropdown />
          </>
        )}
      </NavbarContent>

      {/* ✅ 挂载弹窗 */}
      <DailyTask isOpen={isTaskOpen} onClose={() => setIsTaskOpen(false)} />
    </>
  )
}
