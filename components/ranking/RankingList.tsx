// components/ranking/RankingList.tsx

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { RankingCard } from './RankingCard'
import type { RankingTab } from './Container'
import { kunFetchGet } from '~/utils/kunFetch'
import { UP_RANKING } from '~/config/up-ranking'

interface RankingListProps {
  tab: RankingTab
  onReady?: () => void
}

interface ApiRankingItem {
  id: number
  rank: number
  rj_id: string | null
  title: string
  company: string | null
  release_date: string | null
  cover_local: string | null
  rating: string | null
  dl_count: string | null
  work_url: string | null
  tags: string | null
  patch_unique_id: string | null // ✅ 新增
}

interface ApiResponse {
  success: boolean
  ranking_type: string
  count: number
  rankings: ApiRankingItem[]
}

const PAGE_SIZE = 20

// 排行榜封面只从 R2 读取，不再回退到 public/image
const RANKING_IMAGE_BASE = (
  process.env.NEXT_PUBLIC_KUN_RANKING_IMAGE_BED_URL ||
  'https://img.kiriko.ink/ranking'
).replace(/\/+$/, '')

const getRankingCoverUrl = (coverLocal: string | null) => {
  if (!coverLocal) {
    return ''
  }
  if (/^https?:\/\//i.test(coverLocal)) {
    return coverLocal
  }
  return `${RANKING_IMAGE_BASE}/${coverLocal}`
}

export const RankingList = ({ tab, onReady }: RankingListProps) => {
  const [allItems, setAllItems] = useState<ApiRankingItem[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tab === 'up') {
      const timer = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(timer)
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setVisibleCount(PAGE_SIZE)
      try {
        const data = await kunFetchGet<ApiResponse>('/ranking', { type: tab })
        if (!cancelled) {
          setAllItems(data.rankings || [])
        }
      } catch (e) {
        if (!cancelled) {
          setError('加载失败，请稍后重试')
          console.error(e)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [tab])

  useEffect(() => {
    if (!loading) {
      onReady?.()
    }
  }, [loading, onReady])

  const hasMore = visibleCount < allItems.length

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, allItems.length))
      setLoadingMore(false)
    }, 300)
  }, [loadingMore, hasMore, allItems.length])

  useEffect(() => {
    if (tab === 'up') return
    if (!sentinelRef.current) return
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [tab, hasMore, loadMore])

  // UP 榜
  if (tab === 'up') {
    if (UP_RANKING.length === 0) {
      return (
        <div className="py-20 text-center text-default-400 text-lg">
          UP 的野榜还在施工中... ✨
        </div>
      )
    }
    return (
      <div className="space-y-4">
        {UP_RANKING.map((item) => (
          <RankingCard
            key={item.id ?? item.rank}
            id={item.id ?? item.rank}
            rank={item.rank}
            title={item.title}
            titleCn={item.titleJp}
            company={item.company}
            releaseDate={item.releaseDate}
            reviewCount={item.reviewCount ?? ''}
            dlCount={item.dlCount ?? ''}
            cover={item.cover ?? ''}
            tags={item.tags}
            workUrl={item.workUrl}
            patchUniqueId={item.patchUniqueId}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-default-400 text-lg">
        加载中...
      </div>
    )
  }

  if (error) {
    return <div className="py-20 text-center text-red-400 text-lg">{error}</div>
  }

  if (allItems.length === 0) {
    return (
      <div className="py-20 text-center text-default-400 text-lg">
        暂无数据，稍后再来看看～
      </div>
    )
  }

  const visibleItems = allItems.slice(0, visibleCount)

  return (
    <div className="space-y-4">
      {visibleItems.map((item) => (
        <RankingCard
          key={item.id}
          id={item.id}
          rank={item.rank}
          title={item.title}
          company={item.company || ''}
          releaseDate={item.release_date || ''}
          reviewCount={item.rating || ''}
          dlCount={item.dl_count || ''}
          cover={getRankingCoverUrl(item.cover_local)}
          tags={item.tags ? item.tags.split(',').filter(Boolean) : []}
          workUrl={item.work_url || undefined}
          patchUniqueId={item.patch_unique_id} // ✅ 传下去
        />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="py-8 text-center">
          {loadingMore ? (
            <span className="text-default-400">加载中...</span>
          ) : (
            <span className="text-default-400/50">
              已显示 {visibleCount} / {allItems.length}
            </span>
          )}
        </div>
      )}

      {!hasMore && allItems.length > PAGE_SIZE && (
        <div className="py-8 text-center text-default-400/50 text-sm">
          — 已经到底啦 —
        </div>
      )}
    </div>
  )
}
