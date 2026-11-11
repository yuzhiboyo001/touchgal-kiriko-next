// components/kun/hooks/useShop.ts

'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useUserStore } from '~/store/userStore'
import { SHOP_ITEMS } from '~/components/kun/features/ShopFeature/config'
import {
  purchaseItems,
  fetchPurchaseHistory
} from '~/components/kun/KirikoStandee/actions'
import { loadKirikoSnapshot } from '~/components/kun/hooks/kirikoSnapshot'
import { useAffection } from '~/components/kun/hooks/useAffection'
import { completeTask } from '~/components/effects/daily-task/utils/completeTask'
import toast from 'react-hot-toast'

export const useShop = (
  initialCoins: number = 0,
  onCoinsUpdate?: (newCoins: number) => void
) => {
  const [cart, setCart] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false)
  const [coins, setCoins] = useState(initialCoins)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isLoadingCoins, setIsLoadingCoins] = useState(true)
  const uid = useUserStore((state) => state.user.uid)

  const {
    showAffectionFeedback,
    feedback,
    closeFeedback,
    newAchievements,
    addNewAchievements,
    clearNewAchievements
  } = useAffection()

  // ===== 打开商店时重拉金币，避免领奖后仍显示旧余额 =====
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      setIsLoadingCoins(true)
      loadKirikoSnapshot(uid, true)
        .then((snapshot) => {
          if (cancelled || !snapshot) {
            return
          }
          setCoins(snapshot.coins)
          onCoinsUpdate?.(snapshot.coins)
        })
        .catch(() => {
          // 拉取失败时保留 initialCoins，不阻断商店
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingCoins(false)
          }
        })
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [onCoinsUpdate, uid])

  // ===== 加载购买历史 =====
  useEffect(() => {
    const loadPurchaseHistory = async () => {
      try {
        const result = await fetchPurchaseHistory()
        if (result.success && result.data?.purchases) {
          const ids = new Set(result.data.purchases.map((p: any) => p.id))
          setPurchasedIds(ids)
        }
      } catch (error) {
        console.error('加载购买记录失败:', error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadPurchaseHistory()
  }, [])

  const isItemPurchased = useCallback(
    (itemId: string) => {
      const item = SHOP_ITEMS.find((it) => it.id === itemId)
      if (!item) return false
      if (item.category !== 'special') return false
      return purchasedIds.has(itemId)
    },
    [purchasedIds]
  )

  const isSpecialInCart = useCallback(
    (itemId: string) => {
      const item = SHOP_ITEMS.find((it) => it.id === itemId)
      if (!item) return false
      if (item.category !== 'special') return false
      return cart.includes(itemId)
    },
    [cart]
  )

  const total = useMemo(() => {
    let sum = 0
    for (const id of cart) {
      const item = SHOP_ITEMS.find((it) => it.id === id)
      if (item) sum += item.price
    }
    return sum
  }, [cart])

  const totalAffection = useMemo(() => {
    let sum = 0
    for (const id of cart) {
      const item = SHOP_ITEMS.find((it) => it.id === id)
      if (item) sum += item.affection
    }
    return sum
  }, [cart])

  const countMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const id of cart) {
      map.set(id, (map.get(id) || 0) + 1)
    }
    return map
  }, [cart])

  const addToCart = useCallback(
    (itemId: string) => {
      const item = SHOP_ITEMS.find((it) => it.id === itemId)
      if (!item) return

      if (item.category === 'special') {
        if (isItemPurchased(itemId) || isSpecialInCart(itemId)) {
          return
        }
      }

      setCart((prev) => [...prev, itemId])
    },
    [isItemPurchased, isSpecialInCart]
  )

  const removeFromCart = useCallback((itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCart((prev) => {
      const index = prev.indexOf(itemId)
      if (index === -1) return prev
      const newCart = [...prev]
      newCart.splice(index, 1)
      return newCart
    })
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  // ✅ 完成商店相关任务（统一走 completeTask）
  const completeShopTasks = useCallback(async (purchasedCart: string[]) => {
    try {
      // ✅ w4：单次结算购物车任意 ≥ 1 件 → 完成（C 方案）
      if (purchasedCart.length >= 1) {
        await completeTask('w4')
      }

      // ✅ c2：本次购物车有特殊物品 → 完成（silent，避免和 w4 的 Toast 打架）
      const specialItems = purchasedCart.filter((id) => {
        const item = SHOP_ITEMS.find((it) => it.id === id)
        return item?.category === 'special'
      })
      if (specialItems.length >= 1) {
        await completeTask('c2', { silent: true })
      }
    } catch (error) {
      console.error('❌ 完成商店任务失败:', error)
    }
  }, [])
  const checkout = useCallback(async () => {
    if (cart.length === 0 || processingRef.current) return
    if (isLoadingCoins) {
      toast.error('金币加载中，请稍候')
      return
    }
    if (coins < total) {
      toast.error('金币不足！')
      return
    }

    const alreadyPurchased = cart.filter((id) => isItemPurchased(id))
    if (alreadyPurchased.length > 0) {
      const itemNames = alreadyPurchased
        .map((id) => SHOP_ITEMS.find((it) => it.id === id)?.name)
        .filter(Boolean)
        .join('、')
      toast.error(`以下商品已购买：${itemNames}`)
      const filteredCart = cart.filter((id) => !alreadyPurchased.includes(id))
      setCart(filteredCart)
      return
    }

    processingRef.current = true
    setIsProcessing(true)
    try {
      const cartSnapshot = [...cart]

      const cartItems = cartSnapshot.map((id) => {
        const item = SHOP_ITEMS.find((it) => it.id === id)
        return {
          id: id,
          price: item?.price ?? 0,
          affection: item?.affection ?? 0,
          name: item?.name ?? '',
          category: item?.category ?? ''
        }
      })

      const result = await purchaseItems(cartItems, total, totalAffection)

      if (!result.success) {
        toast.error(result.error || '购买失败')
        return
      }

      if (result.data?.purchases) {
        const ids = new Set(result.data.purchases.map((p: any) => p.id))
        setPurchasedIds(ids)
      }

      setCoins(result.newCoins)
      onCoinsUpdate?.(result.newCoins)
      setCart([])

      // purchaseItems 已在服务端事务中加过好感度，这里只展示反馈
      showAffectionFeedback({
        gained: result.affectionGained,
        total: result.newAffection ?? 0,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
        actionLabel: `购买 ${cartSnapshot.length} 件商品`
      })

      const purchaseAchievements = result.newAchievements ?? []
      const purchaseOnly = purchaseAchievements.filter((id) => id !== 'aff_6')
      if (purchaseOnly.length > 0) {
        addNewAchievements(purchaseOnly)
      }

      // ✅ 完成商店任务（走 completeTask）
      await completeShopTasks(cartSnapshot)
    } catch (error) {
      console.error('结算失败:', error)
      toast.error('结算失败，请重试')
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [
    cart,
    total,
    totalAffection,
    coins,
    isProcessing,
    isLoadingCoins,
    isItemPurchased,
    onCoinsUpdate,
    showAffectionFeedback,
    addNewAchievements,
    completeShopTasks
  ])

  return {
    cart,
    coins,
    total,
    totalAffection,
    countMap,
    isProcessing,
    isLoadingHistory,
    isLoadingCoins,
    feedback,
    isItemPurchased,
    isSpecialInCart,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    closeFeedback,
    setCoins,
    newAchievements,
    clearNewAchievements
  }
}
