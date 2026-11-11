// features/ShopFeature/ShopFeature.tsx

'use client'

import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { X, ShoppingBag, Coins } from 'lucide-react'
import {
  ShopItemCard,
  CategoryTabs,
  CheckoutBar
} from '~/components/kun/features/ShopFeature/components'
import { useShop } from '../../hooks/useShop'
import { useBodyScrollLock } from '~/components/kun/hooks/useBodyScrollLock'
import { AffectionFeedback } from '~/components/kun/KirikoStandee/affection/AffectionFeedback'
import type { ShopFeatureProps } from './types'
import { CategoryId, SHOP_ITEMS } from './config'
import { AchievementToast } from '~/components/kun/features/AchievementFeature'
import { ACHIEVEMENTS } from '~/components/kun/features/AchievementFeature/config'

export const ShopFeature = memo(
  ({ config, onClose, initialCoins = 0, onCoinsUpdate }: ShopFeatureProps) => {
    useBodyScrollLock()
    const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all')

    const {
      cart,
      coins,
      total,
      totalAffection,
      countMap,
      isProcessing,
      isLoadingCoins,
      feedback,
      addToCart,
      removeFromCart,
      checkout,
      closeFeedback,
      isItemPurchased,
      newAchievements,
      clearNewAchievements
    } = useShop(initialCoins, onCoinsUpdate)

    const currentAchievement = useMemo(() => {
      if (!newAchievements || newAchievements.length === 0) return null
      return ACHIEVEMENTS.find((a) => a.id === newAchievements[0])
    }, [newAchievements])

    const shopTheme = useMemo(
      () => ({
        bg: config.shopBg || 'bg-zinc-900',
        border: config.shopBorder || 'border-white/15',
        accent: config.shopAccent || 'bg-rose-500 hover:bg-rose-600',
        textBright: config.shopText || 'text-rose-100'
      }),
      [config]
    )

    const filteredItems = useMemo(() => {
      if (selectedCategory === 'all') return SHOP_ITEMS
      return SHOP_ITEMS.filter((item) => item.category === selectedCategory)
    }, [selectedCategory])

    const handleCategoryChange = useCallback((id: CategoryId) => {
      setSelectedCategory(id)
    }, [])

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    return (
      <>
        {currentAchievement && (
          <AchievementToast
            achievement={currentAchievement}
            onComplete={clearNewAchievements}
          />
        )}

        {/* ✅ 外层：手机端全屏贴满，PC端恢复居中弹窗 */}
        <div className="fixed inset-0 z-[100] flex touch-pan-y items-end justify-center overscroll-none md:items-center">
          <div
            className={`relative w-full md:w-[640px] max-w-full md:max-w-[92vw] h-full md:h-[80vh] rounded-none md:rounded-2xl ${shopTheme.bg} border-0 md:border ${shopTheme.border} shadow-2xl overflow-hidden flex flex-col `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部装饰 */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />

            {/* 头部 (恢复半透明边框) */}
            <div className="relative flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 flex-shrink-0 pt-[max(1rem,env(safe-area-inset-top))] md:pt-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className={`w-5 h-5 ${shopTheme.textBright}`} />
                <h2
                  className={`text-lg md:text-xl font-bold ${shopTheme.textBright}`}
                >
                  商店
                </h2>
                <span className="text-xs text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full">
                  {cart.length} 件
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1.5 text-xs bg-white/5 px-2.5 md:px-3 py-1.5 rounded-full border border-white/5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-medium">
                    {isLoadingCoins ? '...' : coins.toLocaleString()}
                  </span>
                  <span className="text-white/30 text-[10px] hidden md:inline">
                    円
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 分类 */}
            <div className="flex-shrink-0">
              <CategoryTabs
                selected={selectedCategory}
                onChange={handleCategoryChange}
                accent={shopTheme.accent}
                textBright={shopTheme.textBright}
              />
            </div>

            {/* 商品列表：PC端与手机端都保持双列 */}
            <div
              className="overflow-y-auto p-3 md:p-4 flex-1"
              style={{
                scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                scrollbarWidth: 'thin'
              }}
            >
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {filteredItems.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    count={countMap.get(item.id) || 0}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    textBright={shopTheme.textBright}
                    isPurchased={isItemPurchased(item.id)}
                  />
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-16 text-white/30">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">该分类暂无商品</p>
                </div>
              )}
            </div>

            {/* 底部结算栏 (恢复半透明背景，适配手机安全区) */}
            <div className="flex-shrink-0 pb-[env(safe-area-inset-bottom)] md:pb-0 bg-black/20 border-t border-white/10">
              <CheckoutBar
                count={cart.length}
                total={total}
                affection={totalAffection}
                coins={coins}
                isLoadingCoins={isLoadingCoins}
                onCheckout={checkout}
                textBright={shopTheme.textBright}
                accent={shopTheme.accent}
                isProcessing={isProcessing}
              />
            </div>
          </div>

          {/* 好感度反馈 */}
          {feedback.show && (
            <AffectionFeedback
              isOpen={feedback.show}
              gained={feedback.gained}
              total={feedback.total}
              leveledUp={feedback.leveledUp}
              newLevel={feedback.newLevel}
              actionLabel={feedback.actionLabel}
              onComplete={closeFeedback}
            />
          )}
        </div>
      </>
    )
  }
)

ShopFeature.displayName = 'ShopFeature'
