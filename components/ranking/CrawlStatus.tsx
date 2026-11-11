'use client'

import { useEffect, useRef, useState } from 'react'
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Infinity as InfinityIcon,
  ChevronRight
} from 'lucide-react'
import { kunFetchGet } from '~/utils/kunFetch'

interface CrawlState {
  ranking_type: string
  name: string
  interval_sec: number
  last_crawl_at: string | null
  next_crawl_at: string | null
  seconds_until_next: number
  status: 'fresh' | 'soon' | 'overdue' | 'never'
  count: number
  error: string | null
}

interface ApiResponse {
  success: boolean
  states: CrawlState[]
}

const LONG_TERM_TYPES = new Set(['yearly', 'total'])

function formatDuration(sec: number): string {
  if (sec <= 0) return '即将更新'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h} 时 ${m} 分`
  if (m > 0) return `${m} 分 ${s} 秒`
  return `${s} 秒`
}

function formatInterval(sec: number): string {
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟`
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时`
  return `${Math.floor(sec / 86400)} 天`
}

function calcRemaining(nextCrawlAt: string | null): number {
  if (!nextCrawlAt) return 0
  const nextMs = new Date(nextCrawlAt).getTime()
  const nowMs = Date.now()
  return Math.max(0, Math.floor((nextMs - nowMs) / 1000))
}

const REFRESH_MS = 5 * 60 * 1000

export const useCrawlStatus = (enabled = true) => {
  const [states, setStates] = useState<CrawlState[]>([])
  const [loading, setLoading] = useState(enabled)
  const lastLoadedRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      const timer = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(timer)
    }
    let cancelled = false

    async function load() {
      try {
        const data = await kunFetchGet<ApiResponse>('/crawl/status')
        if (cancelled) return
        setStates(data.states || [])
        lastLoadedRef.current = Date.now()
      } catch (e) {
        console.error('CrawlStatus 加载失败', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const refreshIfStale = () => {
      if (document.hidden) return
      if (Date.now() - lastLoadedRef.current >= REFRESH_MS) {
        void load()
      }
    }

    void load()
    const interval = window.setInterval(refreshIfStale, 60_000)
    document.addEventListener('visibilitychange', refreshIfStale)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshIfStale)
    }
  }, [enabled])

  return { states, loading }
}

interface CrawlStatusProps {
  states: CrawlState[]
  loading: boolean
}

export const CrawlStatus = ({ states, loading }: CrawlStatusProps) => {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:p-6">
        <div className="text-center text-default-400">状态加载中...</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:p-6 space-y-3 lg:space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5 text-pink-400" />
        <h3 className="text-base lg:text-xl font-bold">数据更新</h3>
      </div>

      {/* ✅ 加了 relative 相对定位，为了让遮罩贴在它右侧 */}
      <div className="relative">
        {/* ✅ 方案一：右侧渐隐遮罩 + 呼吸小箭头（仅在手机端显示） */}
        {/* pointer-events-none 保证鼠标/手指能穿透遮罩点到卡片 */}
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none flex items-center justify-end pr-1 lg:hidden">
          <ChevronRight className="w-5 h-5 text-pink-400 animate-pulse" />
        </div>

        {/* 横向滑动区域 */}
        <div className="flex lg:block overflow-x-auto gap-3 lg:space-y-3 pb-2 lg:pb-0 scrollbar-hide">
          {states.map((s) => {
            if (LONG_TERM_TYPES.has(s.ranking_type)) {
              const isNever = s.status === 'never'
              return (
                <div
                  key={s.ranking_type}
                  className="flex-shrink-0 w-[240px] lg:w-full rounded-xl border border-purple-400/20 bg-purple-400/10 p-3 lg:p-4 space-y-1.5 lg:space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base lg:text-lg">
                      {s.name}
                    </span>
                    <InfinityIcon className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
                  </div>
                  <div className="text-xs lg:text-sm text-default-500">
                    更新频率 <span className="text-default-300">极低</span>
                  </div>
                  <div className="text-base lg:text-lg font-bold text-purple-400">
                    {isNever ? '未爬取' : '长期有效'}
                  </div>
                  <div className="text-[10px] lg:text-xs text-purple-400">
                    {isNever ? '暂无数据' : `已更新 · ${s.count} 条`}
                  </div>
                </div>
              )
            }

            const remaining = calcRemaining(s.next_crawl_at)

            let StatusIcon = CheckCircle2
            let StatusColor = 'text-green-400'
            let StatusBg = 'bg-green-400/10 border-green-400/20'
            let StatusText = '已更新'

            if (s.status === 'never') {
              StatusIcon = XCircle
              StatusColor = 'text-gray-400'
              StatusBg = 'bg-gray-400/10 border-gray-400/20'
              StatusText = '暂无数据'
            } else if (remaining === 0) {
              StatusIcon = AlertCircle
              StatusColor = 'text-red-400'
              StatusBg = 'bg-red-400/10 border-red-400/20'
              StatusText = '等待更新'
            } else if (remaining < 60) {
              StatusIcon = Clock
              StatusColor = 'text-yellow-400'
              StatusBg = 'bg-yellow-400/10 border-yellow-400/20'
              StatusText = '即将更新'
            }

            return (
              <div
                key={s.ranking_type}
                className={`flex-shrink-0 w-[240px] lg:w-full rounded-xl border ${StatusBg} p-3 lg:p-4 space-y-1.5 lg:space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base lg:text-lg">
                    {s.name}
                  </span>
                  <StatusIcon
                    className={`w-4 h-4 lg:w-5 lg:h-5 ${StatusColor}`}
                  />
                </div>
                <div className="text-xs lg:text-sm text-default-500">
                  间隔{' '}
                  <span className="text-default-300">
                    {formatInterval(s.interval_sec)}
                  </span>
                </div>
                <div
                  className={`text-base lg:text-lg font-bold ${StatusColor}`}
                >
                  {s.status === 'never'
                    ? '未爬取'
                    : remaining === 0
                      ? '等待下次更新'
                      : formatDuration(remaining)}
                </div>
                <div className={`text-[10px] lg:text-xs ${StatusColor}`}>
                  {StatusText}
                  {s.count > 0 && ` · ${s.count} 条`}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
