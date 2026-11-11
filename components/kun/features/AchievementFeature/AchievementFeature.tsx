// features/AchievementFeature/AchievementFeature.tsx

'use client'

import { useState, useEffect, memo, useMemo, useCallback, useRef } from 'react'
import { Trophy } from 'lucide-react'
import { FeatureWindow } from '~/components/kun/features/FeatureWindow'
import type { StandeeConfig } from '../../KirikoStandee/types'
import { ACHIEVEMENTS } from './config'
import { AchievementCard } from './components/AchievementCard'

export interface AchievementFeatureProps {
  config: StandeeConfig
  onClose: () => void
}

export const AchievementFeature = memo(
  ({ config, onClose }: AchievementFeatureProps) => {
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const theme = useMemo(
      () => ({
        bg: config.shopBg || 'bg-zinc-900 md:bg-gray-900/80',
        border: config.shopBorder || 'border-transparent md:border-white/15',
        accent: config.shopAccent || 'bg-rose-500/40 hover:bg-rose-500/60',
        textBright: config.shopText || 'text-pink-400 md:text-rose-100'
      }),
      [config]
    )

    const loadAchievements = useCallback(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/achievements', {
          signal: controller.signal
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error || '加载失败')
        setUnlockedIds(new Set(data.data))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        console.error('加载成就失败:', error)
        setError('成就加载失败，请稍后重试')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, [])

    useEffect(() => {
      void loadAchievements()
      return () => abortRef.current?.abort()
    }, [loadAchievements])

    const stats = useMemo(() => {
      const total = ACHIEVEMENTS.length
      const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).length
      const progress = total > 0 ? (unlocked / total) * 100 : 0
      return { total, unlocked, progress }
    }, [unlockedIds])

    const sortedAchievements = useMemo(() => {
      return [...ACHIEVEMENTS].sort((a, b) => {
        const aUnlocked = unlockedIds.has(a.id)
        const bUnlocked = unlockedIds.has(b.id)
        if (aUnlocked && !bUnlocked) return -1
        if (!aUnlocked && bUnlocked) return 1
        if (a.hidden && !b.hidden) return 1
        if (!a.hidden && b.hidden) return -1
        return 0
      })
    }, [unlockedIds])

    return (
      <FeatureWindow
        title="成就"
        subtitle={`已解锁 ${stats.unlocked} / ${stats.total}`}
        icon={Trophy}
        onClose={onClose}
        widthClassName="w-[calc(100vw-24px)] sm:w-[680px]"
        maxHeightClassName="max-h-[86dvh]"
        bodyClassName="px-5 py-5 md:px-8 md:py-7"
        panelClassName={`${theme.bg} ${theme.border}`}
      >
        <div className="mb-5 flex flex-shrink-0 items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 md:h-2.5 md:border-0 md:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-300"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
          <span className="min-w-[3rem] text-right text-sm font-bold text-amber-400 md:min-w-[3.5rem] md:text-base">
            {stats.progress.toFixed(0)}%
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400 md:border-white/20" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-white/60">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadAchievements()}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              重新加载
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            {sortedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={unlockedIds.has(achievement.id)}
              />
            ))}
          </div>
        )}
      </FeatureWindow>
    )
  }
)

AchievementFeature.displayName = 'AchievementFeature'
