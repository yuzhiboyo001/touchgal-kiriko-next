// features/ShopFeature/components/CheckoutBar.tsx

'use client'

import { memo } from 'react'
import { Coins, Heart, ShoppingCart } from 'lucide-react'

interface CheckoutBarProps {
  count: number
  total: number
  affection: number
  coins: number
  isLoadingCoins: boolean
  onCheckout: () => void
  textBright: string
  accent: string
  isProcessing: boolean
}

export const CheckoutBar = memo(
  ({
    count,
    total,
    affection,
    coins,
    isLoadingCoins,
    onCheckout,
    textBright,
    accent,
    isProcessing
  }: CheckoutBarProps) => {
    const canAfford = !isLoadingCoins && coins >= total

    return (
      <div className="px-4 md:px-6 py-3 border-t border-white/10 bg-black/20 backdrop-blur-sm flex items-center justify-between">
        {/* 左侧：金币和数量 */}
        <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4">
          <div className="flex items-center gap-1.5 text-white/60 text-[10px] md:text-xs bg-white/5 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/5">
            <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
            <span className="text-white font-medium">
              {isLoadingCoins ? '加载中...' : coins.toLocaleString()}
            </span>
            <span className="text-white/30 text-[9px] md:text-[10px]">円</span>
          </div>
          <div className="flex items-center gap-1 text-white/50 text-[10px] md:text-xs">
            <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5" />
            已选 <span className="text-white font-medium">{count}</span> 件
          </div>
        </div>

        {/* 右侧：总计和结算按钮 */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-col items-end md:flex-row md:items-center gap-1 md:gap-3">
            <span className="text-white/40 text-[10px] md:text-xs hidden md:inline">
              总计
            </span>
            <span className={`text-base md:text-lg font-bold ${textBright}`}>
              ¥{total.toLocaleString()}
            </span>
          </div>

          <span className="text-[10px] md:text-xs text-rose-400/80 flex items-center gap-0.5 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
            <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 fill-rose-400/60" />+
            {affection}
          </span>

          {count > 0 && (
            <button
              className={`
                px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-medium text-white transition-all duration-200
                ${
                  canAfford && !isProcessing
                    ? `${accent} hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-500/20`
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              onClick={onCheckout}
              disabled={!canAfford || isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 md:w-3.5 md:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  结算中
                </span>
              ) : (
                '结算'
              )}
            </button>
          )}
        </div>
      </div>
    )
  }
)

CheckoutBar.displayName = 'CheckoutBar'
