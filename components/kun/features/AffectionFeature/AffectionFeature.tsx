// features/AffectionFeature/AffectionFeature.tsx

'use client'

import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react'
import { Heart, Coins, Calendar, Award, TrendingUp, Gift } from 'lucide-react'
import { FeatureWindow } from '~/components/kun/features/FeatureWindow'
import type { StandeeConfig } from '../../KirikoStandee/types'
import {
  AFFECTION_LEVELS,
  getLevelLabel,
  MAX_LEVEL
} from '~/components/kun/KirikoStandee/affection/constants'

export interface AffectionFeatureProps {
  config: StandeeConfig
  onClose: () => void
}

interface AffectionData {
  character: string
  affection: number
  affection_level: number
  coins: number
  total_days: number
  first_chat_at: string
  last_chat_at: string
  purchase_history: any[]
  achievements: number
  progress: number
}

const CHARACTER_NAMES = {
  rin: '神崎 凛',
  sayo: '星野 小夜',
  shunv: '月城 静香'
}

const STAT_CARDS = [
  { key: 'affection', icon: Heart, label: '好感度', color: 'rose' },
  { key: 'coins', icon: Coins, label: '金币', color: 'yellow' },
  { key: 'days', icon: Calendar, label: '认识天数', color: 'blue' },
  { key: 'achievements', icon: Award, label: '成就', color: 'amber' }
] as const

const COLOR_MAP = {
  rose: { bg: 'bg-rose-500/20 md:bg-rose-500/10', icon: 'text-rose-400' },
  yellow: {
    bg: 'bg-yellow-500/20 md:bg-yellow-500/10',
    icon: 'text-yellow-400'
  },
  blue: { bg: 'bg-blue-500/20 md:bg-blue-500/10', icon: 'text-blue-400' },
  amber: { bg: 'bg-amber-500/20 md:bg-amber-500/10', icon: 'text-amber-400' }
} as const

const formatCoins = (num: number): string => {
  if (num >= 100000000)
    return `${(num / 100000000).toFixed(1).replace(/\.0$/, '')} 亿`
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, '')} 万`
  return num.toLocaleString()
}

const LevelGrid = memo(({ currentLevel }: { currentLevel: number }) => (
  <div className="grid grid-cols-5 gap-2 md:gap-1.5">
    {AFFECTION_LEVELS.map((lv) => {
      const isCurrent = lv.level === currentLevel
      const isUnlocked = lv.level < currentLevel
      return (
        <div
          key={lv.level}
          className={`
            text-center p-2 rounded-lg text-sm md:text-xs transition-colors duration-150
            ${
              isCurrent
                ? 'bg-pink-500/40 md:bg-pink-500/30 text-white border border-pink-400/50 md:border-pink-400/30 shadow-sm'
                : isUnlocked
                  ? 'text-zinc-200 md:text-white/60 bg-zinc-800/50 md:bg-white/5 border border-zinc-700/50 md:border-white/5'
                  : 'text-zinc-500 md:text-white/35 bg-zinc-800/20 md:bg-white/5 border border-zinc-800/50 md:border-white/5'
            }
          `}
        >
          <div
            className={`font-bold ${isCurrent ? 'text-pink-100 md:text-pink-300 text-base md:text-xs' : ''}`}
          >
            {lv.level}
          </div>
          <div
            className={`text-xs md:text-[10px] mt-1 md:mt-0.5 leading-tight opacity-100 md:opacity-80`}
          >
            {lv.label}
          </div>
          {isCurrent && (
            <div className="mt-1.5 w-4 h-0.5 bg-pink-400/50 rounded-full mx-auto" />
          )}
        </div>
      )
    })}
  </div>
))

LevelGrid.displayName = 'LevelGrid'

const StatCard = memo(
  ({
    config,
    value
  }: {
    config: (typeof STAT_CARDS)[number]
    value: string
  }) => {
    const colors = COLOR_MAP[config.color as keyof typeof COLOR_MAP]

    return (
      <div
        className={`${colors.bg} rounded-xl p-3 md:p-4 border border-white/10 md:border-white/5 hover:border-white/20 md:hover:border-white/10 transition-colors duration-150 shadow-sm flex flex-col justify-center`}
      >
        <div
          className={`flex items-center gap-2 text-sm md:text-xs font-medium mb-1.5 md:mb-1 ${colors.icon}`}
        >
          <config.icon className={`w-4 h-4 flex-shrink-0`} />
          <span className="truncate">{config.label}</span>
        </div>
        <div
          className="text-xl md:text-2xl font-bold text-white tracking-tight truncate"
          title={value}
        >
          {value}
        </div>
      </div>
    )
  }
)
StatCard.displayName = 'StatCard'

const PurchaseHistory = memo(({ purchases }: { purchases: any[] }) => {
  if (purchases.length === 0) return null

  return (
    <div className="bg-zinc-800/40 md:bg-white/5 rounded-xl p-4 border border-zinc-700/50 md:border-white/5 shadow-sm md:shadow-none">
      <div className="flex items-center gap-2 text-zinc-300 md:text-white/40 text-sm md:text-xs font-medium mb-3">
        <Gift className="w-4 h-4 text-purple-400 md:text-purple-400/60" />
        购买记录
        <span className="text-zinc-500 md:text-white/20 text-xs md:text-[10px] ml-auto md:ml-0">
          ({purchases.length})
        </span>
      </div>
      <div className="space-y-2 md:space-y-1.5 max-h-32 overflow-y-auto gal-scrollbar pr-1 md:pr-0">
        {purchases
          .slice(-5)
          .reverse()
          .map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex justify-between text-sm py-1.5 md:py-1 border-b border-zinc-700/50 md:border-white/5 last:border-0"
            >
              <span className="text-zinc-200 md:text-white/70 truncate max-w-[60%]">
                {item.name}
              </span>
              <span className="text-pink-400 md:text-white/40 font-mono font-medium md:font-normal">
                ¥{item.price.toLocaleString()}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
})

PurchaseHistory.displayName = 'PurchaseHistory'

const LoadingState = memo(({ onClose }: { onClose: () => void }) => (
  <FeatureWindow
    title="好感度"
    icon={Heart}
    onClose={onClose}
    widthClassName="w-[calc(100vw-24px)] sm:w-[560px]"
    maxHeightClassName="max-h-[84dvh]"
    bodyClassName="flex items-center justify-center p-8"
    panelClassName="border-white/15"
  >
    <div className="flex flex-col items-center justify-center py-12">
      <div className="size-10 animate-spin rounded-full border-[3px] border-zinc-700 border-t-pink-500" />
      <p className="mt-4 text-sm font-medium text-zinc-400">
        加载好感度数据...
      </p>
    </div>
  </FeatureWindow>
))

LoadingState.displayName = 'LoadingState'

const ErrorState = memo(
  ({
    error,
    onRetry,
    onClose
  }: {
    error: string
    onRetry: () => void
    onClose: () => void
  }) => (
    <FeatureWindow
      title="好感度"
      icon={Heart}
      onClose={onClose}
      widthClassName="w-[calc(100vw-24px)] sm:w-[560px]"
      maxHeightClassName="max-h-[84dvh]"
      bodyClassName="p-8"
      panelClassName="border-white/15"
    >
      <div className="py-12 text-center">
        <div className="mb-4 text-4xl">😅</div>
        <p className="text-sm text-zinc-300">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl border border-zinc-600 bg-zinc-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          重新加载
        </button>
      </div>
    </FeatureWindow>
  )
)

ErrorState.displayName = 'ErrorState'

export const AffectionFeature = memo(
  ({ config, onClose }: AffectionFeatureProps) => {
    const [data, setData] = useState<AffectionData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isMounted = useRef(true)

    const characterId = config.id as 'rin' | 'sayo' | 'shunv'
    const characterName = CHARACTER_NAMES[characterId] || config.name

    const theme = useMemo(
      () => ({
        bg: config.shopBg || 'bg-zinc-900 md:bg-gray-900/80',
        border: config.shopBorder || 'border-transparent md:border-white/15',
        accent: config.shopAccent || 'bg-rose-500/40 hover:bg-rose-500/60',
        textBright: config.shopText || 'text-pink-400 md:text-rose-100'
      }),
      [config]
    )

    const loadData = useCallback(async () => {
      if (!isMounted.current) return

      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/affection')
        const result = await res.json()
        if (isMounted.current) {
          if (result.success) setData(result.data)
          else setError(result.message || '加载失败')
        }
      } catch {
        if (isMounted.current) setError('网络错误，请重试')
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }, [])

    useEffect(() => {
      isMounted.current = true
      void loadData()
      return () => {
        isMounted.current = false
      }
    }, [loadData])

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    const cardValues = useMemo(() => {
      if (!data) return {}
      return {
        affection: formatCoins(data.affection),
        coins: formatCoins(data.coins),
        days: `${data.total_days || 0} 天`,
        achievements: `${data.achievements} 个`
      }
    }, [data])

    if (isLoading) return <LoadingState onClose={onClose} />
    if (error)
      return (
        <ErrorState
          error={error}
          onRetry={() => loadData()}
          onClose={onClose}
        />
      )
    if (!data) return null

    return (
      <FeatureWindow
        title="好感度"
        subtitle={characterName}
        icon={Heart}
        onClose={onClose}
        widthClassName="w-[calc(100vw-24px)] sm:w-[560px]"
        maxHeightClassName="max-h-[84dvh]"
        bodyClassName="p-5 md:p-6"
        panelClassName={`${theme.bg} ${theme.border}`}
      >
        <div className="space-y-6">
          {/* 等级 + 进度条 */}
          <div className="text-center">
            <div className="mb-3 flex items-center justify-center gap-3 md:mb-2">
              <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-rose-500 md:bg-none md:text-4xl md:font-bold md:text-pink-400">
                Lv.{data.affection_level}
              </span>
              <span className="text-base font-medium text-zinc-300 md:text-sm md:text-white/60">
                {getLevelLabel(data.affection_level)}
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 md:h-2 md:border-0 md:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500 md:from-pink-400 md:to-rose-400 md:duration-300"
                style={{ width: `${data.progress * 100}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-sm font-medium text-zinc-300 md:mt-1 md:text-xs md:font-normal md:text-white/40">
              <span className="truncate text-pink-300">
                {formatCoins(data.affection)} 好感度
              </span>
              <span className="ml-2 flex-shrink-0">
                {data.affection_level < MAX_LEVEL ? '前往下一级' : '已满级 ✓'}
              </span>
            </div>
          </div>

          {/* 核心数据卡片 */}
          <div className="grid grid-cols-2 gap-3">
            {STAT_CARDS.map((card) => (
              <StatCard
                key={card.key}
                config={card}
                value={cardValues[card.key as keyof typeof cardValues] || ''}
              />
            ))}
          </div>

          {/* 购买记录 */}
          <PurchaseHistory purchases={data.purchase_history} />

          {/* 等级列表 */}
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4 md:border-white/5 md:bg-white/5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300 md:mb-3 md:text-xs md:text-white/40">
              <TrendingUp className="size-4 text-green-400 md:text-green-400/60" />
              等级一览
            </div>
            <LevelGrid currentLevel={data.affection_level} />
          </div>
        </div>
      </FeatureWindow>
    )
  }
)

AffectionFeature.displayName = 'AffectionFeature'
