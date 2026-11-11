// components/kun/KirikoStandee/KirikoButton.tsx

'use client'

import { memo } from 'react'
import { FUNC_ICONS } from './config'
import { MessageCircle, ShoppingBag, Heart, Trophy, Info } from 'lucide-react'

const ICON_MAP = {
  MessageCircle,
  ShoppingBag,
  Heart,
  Trophy,
  Info
}

interface KirikoButtonProps {
  item: (typeof FUNC_ICONS)[0]
  index: number
  hovered: boolean
  iconBg: string
  iconHover: string
  onClick: (e: React.MouseEvent) => void // ✅ 统一回调
}

export const KirikoButton = memo(
  ({ item, index, hovered, iconBg, iconHover, onClick }: KirikoButtonProps) => {
    const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP]

    return (
      <button
        className={`func-btn group relative w-9 h-9 rounded-full
          ${iconBg} border border-white/20
          flex items-center justify-center
          text-white/80 hover:text-white
          ${iconHover} hover:scale-110
          ${!item.unlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          transitionProperty: 'opacity, transform',
          transitionDuration: hovered ? '0.5s, 0.5s' : '2s, 2s',
          transitionTimingFunction:
            'cubic-bezier(0.34, 1.56, 0.64, 1), cubic-bezier(0.34, 1.56, 0.64, 1)',
          transitionDelay: hovered ? `${index * 60}ms` : '0ms',
          opacity: hovered ? 1 : 0,
          transform: hovered
            ? 'translateX(0) scale(1)'
            : 'translateX(16px) scale(0.85)',
          pointerEvents: hovered ? 'auto' : 'none',
          willChange: 'transform, opacity'
        }}
        onClick={(e) => {
          if (!item.unlocked) return
          onClick(e)
        }}
        title={item.unlocked ? item.label : `${item.label} (未解锁)`}
      >
        <Icon className="w-4 h-4" />
        <span
          className="absolute right-full mr-2 px-2 py-0.5 rounded text-[10px]
            bg-black/70 text-white/90 whitespace-nowrap opacity-0
            group-hover:opacity-100 transition-opacity duration-200 pointer-events-none font-medium"
        >
          {item.unlocked ? item.label : `🔒 ${item.label}`}
        </span>
      </button>
    )
  }
)

KirikoButton.displayName = 'KirikoButton'
