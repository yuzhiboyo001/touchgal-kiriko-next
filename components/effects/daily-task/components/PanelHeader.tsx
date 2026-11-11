// components/effects/daily-task/components/PanelHeader.tsx

'use client'

import { memo } from 'react'
import { THEME, SIZES } from '../config'

interface PanelHeaderProps {
  completedCount: number
  totalTasks: number
  activeTab: 'daily' | 'weekly' | 'challenge'
  setActiveTab: (tab: 'daily' | 'weekly' | 'challenge') => void
  onMouseDown: (e: React.MouseEvent) => void
  isLoading?: boolean
}

export const PanelHeader = memo(
  ({ activeTab, setActiveTab }: PanelHeaderProps) => {
    const tabs: { key: 'daily' | 'weekly' | 'challenge'; label: string }[] = [
      { key: 'daily', label: '每日委托' },
      { key: 'weekly', label: '每周挑战' },
      { key: 'challenge', label: '特殊成就' }
    ]

    return (
      <div className="flex gap-6 border-b border-default-200/30 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 pt-2 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-primary-500'
                  : 'text-default-400 hover:text-default-600'
              }`}
            >
              {tab.label}
              {/* 激活时的下划线指示器 */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full shadow-[0_0_10px_rgba(var(--heroui-primary-500),0.5)]" />
              )}
            </button>
          )
        })}
      </div>
    )
  }
)

PanelHeader.displayName = 'PanelHeader'
