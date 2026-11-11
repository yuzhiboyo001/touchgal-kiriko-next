'use client'

import {
  Calendar,
  TrendingUp,
  CalendarDays,
  Crown,
  Sparkles,
  Star,
  ChevronRight
} from 'lucide-react'
import type { RankingTab } from './Container'

interface RankingTabsProps {
  activeTab: RankingTab
  onChange: (tab: RankingTab) => void
}

const TABS: Array<{
  key: RankingTab
  label: string
  ja: string
  icon: typeof Calendar
}> = [
  { key: 'daily', label: '日榜', ja: 'デイリー', icon: Calendar },
  { key: 'weekly', label: '周榜', ja: 'ウィークリー', icon: TrendingUp },
  { key: 'monthly', label: '月榜', ja: 'マンスリー', icon: CalendarDays },
  { key: 'yearly', label: '年榜', ja: 'イヤーリー', icon: Star },
  { key: 'total', label: '总榜', ja: 'オールタイム', icon: Crown },
  { key: 'up', label: 'UP推', ja: 'UPの推薦', icon: Sparkles }
]

export const RankingTabs = ({ activeTab, onChange }: RankingTabsProps) => {
  return (
    // 外层 relative 是必须的，用于定位遮罩层
    <div className="relative w-full">
      {/* ✅ 方案一核心：右侧渐隐遮罩 + 呼吸小箭头 (仅手机端显示，lg隐藏) */}
      <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none flex items-center justify-end pr-2 lg:hidden">
        <ChevronRight className="w-5 h-5 text-pink-400/80 animate-pulse" />
      </div>

      <div className="w-full overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
        <div className="flex justify-start lg:justify-center gap-2 flex-nowrap lg:flex-wrap min-w-max lg:min-w-0 px-2 lg:px-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key

            return (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={`
                  gal-sticker flex flex-col items-center gap-0.5
                  transition-all duration-300 flex-shrink-0 lg:flex-shrink
                  ${isActive ? 'gal-sticker-pink scale-105' : ''}
                `}
                style={{
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  minWidth: '72px',
                  borderRadius: '17px'
                }}
              >
                <div className="flex items-center gap-1">
                  <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  <span
                    className="font-ja-maru text-[9px] lg:text-[10px] opacity-70 tracking-wider"
                    style={{ letterSpacing: '0.15em' }}
                  >
                    {tab.ja}
                  </span>
                </div>
                <span
                  className="text-[12px] lg:text-[13px] tracking-wider"
                  style={{
                    letterSpacing: '0.15em',
                    fontWeight: 500
                  }}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
