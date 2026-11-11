// features/ShopFeature/components/ShopItemCard.tsx

'use client'

import { memo } from 'react'
import { Heart, Minus, CheckCircle } from 'lucide-react'
import { ICON_MAP } from '../config'
import type { ShopItem } from '../types'

interface ShopItemCardProps {
  item: ShopItem
  count: number
  onAdd: (id: string) => void
  onRemove: (id: string, e: React.MouseEvent) => void
  textBright: string
  isPurchased?: boolean
}

export const ShopItemCard = memo(
  ({
    item,
    count,
    onAdd,
    onRemove,
    textBright,
    isPurchased = false
  }: ShopItemCardProps) => {
    const inCart = count > 0
    const Icon = ICON_MAP[item.iconName]
    const isSpecial = item.category === 'special'
    // 已购买状态
    if (isSpecial && isPurchased) {
      return (
        <div className="relative p-4 rounded-xl border border-gray-600/30 bg-gray-800/20 opacity-60 cursor-default">
          <div className="flex items-center justify-center h-14 text-white/40">
            {Icon && <Icon className="w-8 h-8" />}
          </div>
          <div className="text-center mt-1.5">
            <div className="text-white/40 font-medium text-md">{item.name}</div>
            <div className="text-white/30 text-[11px] mt-0.5">
              {item.description}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-sm font-semibold text-white/30">
                ¥{item.price}
              </span>
              <span className="text-xs text-white/30 flex items-center gap-0.5">
                <Heart className="w-3.5 h-3.5 text-rose-400/20 fill-rose-400/20" />
                +{item.affection}
              </span>
            </div>
          </div>
          {/* 已购买标记 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-green-500/40">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-xs font-medium">已购买</span>
          </div>
        </div>
      )
    }

    return (
      <div
        className={`
          relative p-3 md:p-4 rounded-xl border transition-all duration-200 cursor-pointer group
          ${
            inCart
              ? 'border-green-400/40 bg-green-500/15 shadow-lg shadow-green-500/10'
              : 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10'
          }
          hover:scale-[1.02] active:scale-[0.98]
        `}
        onClick={() => onAdd(item.id)}
      >
        {/* 图标区域 */}
        <div className="flex items-center justify-center h-10 md:h-14 text-white/90 group-hover:scale-105 transition-transform duration-200">
          {Icon && <Icon className="w-7 h-7 md:w-8 md:h-8" />}
        </div>

        {/* 信息区域 */}
        <div className="text-center mt-1 md:mt-1.5">
          <div className="text-white font-medium text-sm md:text-md flex flex-col md:flex-row items-center justify-center gap-1">
            <span className="truncate max-w-full">{item.name}</span>
            {isSpecial && (
              <span className="text-[9px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded-full shrink-0">
                限定
              </span>
            )}
          </div>
          {/* 手机端隐藏描述文字，避免太挤；或者用 line-clamp-1 截断 */}
          <div className="text-white/60 text-[10px] md:text-[11px] mt-0.5 line-clamp-1 truncate">
            {item.description}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2 mt-1 md:mt-1.5">
            <span className={`text-xs md:text-sm font-semibold ${textBright}`}>
              ¥{item.price}
            </span>
            <span className="text-[10px] md:text-xs text-white/80 flex items-center gap-0.5 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
              <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-400/60 fill-rose-400/60" />
              +{item.affection}
            </span>
          </div>
        </div>

        {/* 数量徽章 */}
        {count > 0 && (
          <>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white text-[11px] flex items-center justify-center shadow-lg font-medium">
              {count}
            </div>
            <button
              className="absolute -bottom-1.5 -left-1.5 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600
                text-white flex items-center justify-center transition-all shadow-lg opacity-80 hover:opacity-100 hover:scale-110 active:scale-90"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(item.id, e)
              }}
              title="取消一件"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    )
  },
  (prev, next) =>
    prev.count === next.count &&
    prev.item.id === next.item.id &&
    prev.isPurchased === next.isPurchased
)

ShopItemCard.displayName = 'ShopItemCard'
