// components/ranking/Container.tsx

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { RankingList } from './RankingList'
import { RankingTabs } from './RankingTabs'
import { CrawlStatus, useCrawlStatus } from './CrawlStatus'
import { NsfwGate } from '~/components/kun/NsfwGate'

export type RankingTab =
  'daily' | 'weekly' | 'monthly' | 'yearly' | 'total' | 'up'

const RANKING_TABS = new Set<RankingTab>([
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'total',
  'up'
])

const getRankingTab = (value: string | null): RankingTab =>
  value && RANKING_TABS.has(value as RankingTab)
    ? (value as RankingTab)
    : 'daily'

const getRankingScrollKey = (tab: RankingTab) => `kun:ranking:scroll:${tab}`

const TAB_DESCRIPTIONS: Record<RankingTab, string> = {
  daily: '每日更新 DLsite 热销 Galgame',
  weekly: '每周更新 DLsite 热销 Galgame',
  monthly: '每月更新 DLsite 热销 Galgame',
  yearly: '年度 DLsite 热销 Galgame',
  total: 'DLsite 历史总榜',
  up: 'UP 的个人推荐，纯主观，仅参考'
}

interface RankingContainerProps {
  isLoggedIn?: boolean
  nsfwAllowed?: boolean
}

export const RankingContainer = ({
  isLoggedIn = true,
  nsfwAllowed = false
}: RankingContainerProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = getRankingTab(searchParams.get('tab'))
  const pendingRestoreRef = useRef<{
    tab: RankingTab
    top: number
  } | null>(null)
  const { states: crawlStates, loading: crawlLoading } = useCrawlStatus(
    isLoggedIn && nsfwAllowed
  )

  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = window.sessionStorage.getItem(getRankingScrollKey(activeTab))
    } catch {
      // sessionStorage may be unavailable in privacy mode
    }
    pendingRestoreRef.current = {
      tab: activeTab,
      top: saved ? Number(saved) || 0 : 0
    }
  }, [activeTab])

  useEffect(() => {
    const key = getRankingScrollKey(activeTab)
    let frame = 0

    const save = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        try {
          window.sessionStorage.setItem(key, String(window.scrollY))
        } catch {
          // sessionStorage may be unavailable in privacy mode
        }
      })
    }

    window.addEventListener('scroll', save, { passive: true })
    window.addEventListener('pagehide', save)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', save)
      window.removeEventListener('pagehide', save)
      try {
        window.sessionStorage.setItem(key, String(window.scrollY))
      } catch {
        // sessionStorage may be unavailable in privacy mode
      }
    }
  }, [activeTab])

  const handleListReady = useCallback(() => {
    const pending = pendingRestoreRef.current
    if (!pending || pending.tab !== activeTab) return
    pendingRestoreRef.current = null
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: pending.top, behavior: 'auto' })
    })
  }, [activeTab])

  const handleTabChange = useCallback(
    (tab: RankingTab) => {
      if (tab === activeTab) return

      try {
        window.sessionStorage.setItem(
          getRankingScrollKey(activeTab),
          String(window.scrollY)
        )
      } catch {
        // sessionStorage may be unavailable in privacy mode
      }

      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'daily') params.delete('tab')
      else params.set('tab', tab)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      })
    },
    [activeTab, pathname, router, searchParams]
  )

  return (
    <div className="w-full max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-6 space-y-6 md:space-y-8">
      {/* 标题区 */}
      <div className="text-center space-y-2 md:space-y-3">
        <div className="flex items-center justify-center gap-3 md:gap-4">
          <Trophy className="w-8 h-8 md:w-10 md:h-10 text-pink-400" />
          <h1 className="font-ja-maru text-4xl md:text-5xl font-bold text-foreground">
            ランキング
          </h1>
          <Trophy className="w-8 h-8 md:w-10 md:h-10 text-pink-400" />
        </div>
        <p className="text-sm md:text-base text-default-500 tracking-[0.4em]">
          排 行 榜
        </p>
        <p className="text-xs md:text-sm text-default-400 max-w-lg mx-auto leading-relaxed px-4">
          {TAB_DESCRIPTIONS[activeTab]}
        </p>
      </div>

      {/* 分类 Tab */}
      <RankingTabs activeTab={activeTab} onChange={handleTabChange} />

      {/* 未登录 / 未开启 NSFW 都不能看排行榜内容 */}
      {!isLoggedIn || !nsfwAllowed ? (
        <NsfwGate isLoggedIn={isLoggedIn} />
      ) : (
        <>
          {/* 手机端：数据更新 */}
          <div className="block lg:hidden">
            <CrawlStatus states={crawlStates} loading={crawlLoading} />
          </div>

          {/* 主体：电脑端左列表 + 右侧栏 */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            <div className="flex-1 w-full min-w-0">
              <RankingList
                key={activeTab}
                tab={activeTab}
                onReady={handleListReady}
              />
            </div>

            <aside className="w-80 flex-shrink-0 sticky top-6 hidden lg:block">
              <CrawlStatus states={crawlStates} loading={crawlLoading} />
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
