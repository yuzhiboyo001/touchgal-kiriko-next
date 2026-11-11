'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Gamepad2, House, Trophy, UserRound } from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import { useSessionStore } from '~/store/sessionStore'
import { useKirikoUiStore } from '~/store/kirikoUiStore'
import { CHARACTER_CONFIGS } from '~/components/kun/KirikoStandee/config'
import { cn } from '~/utils/cn'

const KIRIKO_AVATARS = {
  rin: '/kiriko_avatar/rin_avatar.webp',
  sayo: '/kiriko_avatar/sayo_avatar.webp',
  shunv: '/kiriko_avatar/shunv_avatar.webp'
} as const

const SHORT_NAMES = {
  rin: '凛',
  sayo: '小夜',
  shunv: '静香'
} as const

const tabs = [
  { href: '/', label: '首页', icon: House },
  { href: '/galgame', label: '游戏', icon: Gamepad2 }
] as const

const rightTabs = [{ href: '/ranking', label: '排行榜', icon: Trophy }] as const

export const MobileBottomNav = () => {
  const pathname = usePathname()
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const sessionStatus = useSessionStore((state) => state.status)
  const isOpen = useKirikoUiStore((state) => state.isOpen)
  const character = useKirikoUiStore((state) => state.character)
  const hydrateCharacter = useKirikoUiStore((state) => state.hydrateCharacter)
  const clearCharacter = useKirikoUiStore((state) => state.clearCharacter)
  const open = useKirikoUiStore((state) => state.open)
  const close = useKirikoUiStore((state) => state.close)
  const previousUidRef = useRef(user.uid)

  const isLoggedIn =
    user.uid > 0 &&
    !!user.name &&
    (sessionStatus === 'authenticated' || sessionStatus === 'unavailable')
  const characterConfig = character ? CHARACTER_CONFIGS[character] : null
  const characterName = characterConfig?.name || '看板娘'
  const shortName = character ? SHORT_NAMES[character] : ''
  const myHref = isLoggedIn ? `/user/${user.uid}/comment` : '/login'
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)
  const isMineActive =
    pathname.startsWith('/user') || pathname.startsWith('/settings')

  useLayoutEffect(() => {
    const uidChanged = previousUidRef.current !== user.uid
    previousUidRef.current = user.uid

    // Logout / invalid-session cleanup is centralized in resetUserScopedStores.
    if (!isLoggedIn) return

    if (uidChanged) {
      close()
      clearCharacter()
    }

    hydrateCharacter(user.uid)
  }, [isLoggedIn, user.uid, hydrateCharacter, clearCharacter, close])

  useEffect(() => {
    close()
  }, [pathname, close])

  const handleKiriko = () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (isOpen) close()
    else open()
  }

  // Avoid rendering a guest 4-item bar first and then re-laying it out into
  // the authenticated 5-item bar after the session request resolves.
  if (sessionStatus === 'pending') {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-default-200/50 bg-background/95 backdrop-blur-xl dark:border-white/10 md:hidden">
        <div className="mx-auto h-17 max-w-lg pb-[max(env(safe-area-inset-bottom),4px)]" />
      </nav>
    )
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }

  const renderTab = ({
    href,
    label,
    icon: Icon
  }: {
    href: string
    label: string
    icon: typeof House
  }) => (
    <Link
      key={href}
      href={href}
      scroll={false}
      onClick={scrollToTop}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors',
        isActive(href) ? 'text-pink-500' : 'text-default-400'
      )}
    >
      <Icon className="size-5" strokeWidth={isActive(href) ? 2.4 : 1.8} />
      <span>{label}</span>
    </Link>
  )

  const myTab = (
    <Link
      href={myHref}
      scroll={false}
      onClick={scrollToTop}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors',
        isMineActive ? 'text-pink-500' : 'text-default-400'
      )}
    >
      <UserRound className="size-5" strokeWidth={isMineActive ? 2.4 : 1.8} />
      <span>我的</span>
    </Link>
  )

  const kirikoTab = character ? (
    <div className="flex flex-1 flex-col items-center justify-end self-stretch">
      <button
        type="button"
        aria-label={isOpen ? '关闭看板娘' : `打开${characterName}`}
        aria-expanded={isOpen}
        onClick={handleKiriko}
        className={cn(
          'relative flex min-h-11 h-full w-full flex-col items-center justify-end gap-0.5 px-1 pb-1 transition-colors',
          isOpen ? 'text-pink-500' : 'text-default-500'
        )}
      >
        <span className="absolute -top-6 left-1/2 block size-13 -translate-x-1/2 overflow-hidden rounded-full border-2 border-[#ec489a73] bg-background">
          <Image
            src={KIRIKO_AVATARS[character]}
            alt={characterName}
            fill
            data-no-lightbox="true"
            sizes="52px"
            className="object-contain"
            priority
            unoptimized
          />
        </span>
        <span className="text-[12px] font-medium leading-none">
          {shortName}
        </span>
      </button>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-end self-stretch">
      <div className="min-h-11 w-full" aria-hidden="true" />
    </div>
  )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-default-200/50 bg-background/95 backdrop-blur-xl dark:border-white/10 md:hidden">
      <div className="mx-auto flex min-h-14 max-w-lg items-end justify-around px-2 pb-[max(env(safe-area-inset-bottom),4px)]">
        {tabs[0] && renderTab(tabs[0])}
        {isLoggedIn ? (
          <>
            {tabs[1] && renderTab(tabs[1])}
            {kirikoTab}
            {rightTabs.map(renderTab)}
          </>
        ) : (
          <>
            {tabs.slice(1).map(renderTab)}
            {rightTabs.map(renderTab)}
          </>
        )}
        {myTab}
      </div>
    </nav>
  )
}
