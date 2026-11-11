// components/kun/KirikoStandee/actions.ts
// 修复：#4 统一成就触发；#5 purchaseItems 事务化；parsePurchaseHistory 类型兜底

'use server'

import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { prisma } from '~/prisma/index'
import { getLevel } from './affection/constants'
import { runAchievementChecks } from './achievements'
import { Prisma } from '~/prisma/generated/prisma/client'
import { SHOP_ITEMS } from '~/components/kun/features/ShopFeature/config'
import { setKv } from '~/lib/redis'
import { getTaskEventKey } from '~/server/taskVerification'
// ============================================================
// 工具函数
// ============================================================

interface PurchaseRecord {
  id: string
  name: string
  price: number
  purchased_at: string
}

const parsePurchaseHistory = (
  raw: unknown
): { purchases: PurchaseRecord[] } => {
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).purchases)) {
    return { purchases: (raw as any).purchases as PurchaseRecord[] }
  }
  return { purchases: [] }
}

const getProfileOrThrow = async (userId: number) => {
  const profile = await prisma.kiriko_profile.findUnique({
    where: { user_id: userId }
  })
  if (!profile) throw new Error('未选择看板娘')
  return profile
}

// ============================================================
// 看板娘资料
// ============================================================

const ALLOWED_KIRIKO_CHARACTERS = new Set(['rin', 'sayo', 'shunv'])

export const getKirikoProfile = async () => {
  const payload = await verifyHeaderCookie()
  if (!payload) return null

  const profile = await prisma.kiriko_profile.findUnique({
    where: { user_id: payload.uid },
    select: {
      character: true,
      affection: true,
      affection_level: true,
      coins: true,
      first_chat_at: true,
      last_chat_at: true,
      purchase_history: true
    }
  })

  return {
    user: payload,
    profile: profile
      ? {
          ...profile,
          // 读取时校验，空值/未知值回退到凛
          character: ALLOWED_KIRIKO_CHARACTERS.has(profile.character)
            ? profile.character
            : 'rin'
        }
      : null
  }
}

export interface KirikoSnapshot {
  uid: number
  coins: number
  affection: number
  level: number
  role: number
  hasProfile: boolean
  character: string | null
}

/**
 * 看板娘客户端快照：一次查询同时拿到金币、好感度、等级和角色权限。
 * 不要在点击聊天时再单独拉完整 profile。
 */
export const getKirikoSnapshot = async (): Promise<KirikoSnapshot | null> => {
  const payload = await verifyHeaderCookie()
  if (!payload) return null

  const profile = await prisma.kiriko_profile.findUnique({
    where: { user_id: payload.uid },
    select: { coins: true, affection: true, character: true }
  })
  const affection = profile?.affection ?? 0

  return {
    uid: payload.uid,
    coins: profile?.coins ?? 0,
    affection,
    level: getLevel(affection),
    role: payload.role,
    hasProfile: Boolean(profile),
    character: profile
      ? ALLOWED_KIRIKO_CHARACTERS.has(profile.character)
        ? profile.character
        : 'rin'
      : null
  }
}

export const selectKirikoCharacter = async (characterId: string) => {
  const payload = await verifyHeaderCookie()
  if (!payload) throw new Error('未登录')
  if (!ALLOWED_KIRIKO_CHARACTERS.has(characterId)) {
    throw new Error('无效的看板娘角色')
  }

  const existing = await prisma.kiriko_profile.findUnique({
    where: { user_id: payload.uid }
  })

  if (existing) {
    return { success: true, alreadyExists: true }
  }

  await prisma.kiriko_profile.create({
    data: {
      user_id: payload.uid,
      character: characterId,
      affection: 0,
      coins: 0,
      first_chat_at: new Date(),
      last_chat_at: new Date(),
      last_chat_date: new Date(),
      chat_streak: 0
    }
  })

  return { success: true }
}

// ============================================================
// 好感度相关
// ============================================================

export const getAffection = async () => {
  const payload = await verifyHeaderCookie()
  if (!payload) return null

  const profile = await prisma.kiriko_profile.findUnique({
    where: { user_id: payload.uid },
    select: { affection: true }
  })
  return profile?.affection ?? 0
}

// ============================================================
// 金币相关
// ============================================================

export const getCoins = async () => {
  const snapshot = await getKirikoSnapshot()
  return snapshot ? snapshot.coins : null
}

// ============================================================
// 购买记录相关
// ============================================================

interface PurchaseItem {
  id: string
  price: number
  affection: number
  name?: string
  category?: string
}

interface PurchaseResult {
  success: boolean
  oldCoins: number
  newCoins: number
  affectionGained: number
  newAffection?: number
  leveledUp?: boolean
  newLevel?: number
  error?: string
  newAchievements?: string[]
  data?: {
    purchases: Array<{
      id: string
      name: string
      price: number
      purchased_at: string
    }>
  }
}

export const fetchPurchaseHistory = async () => {
  const payload = await verifyHeaderCookie()
  if (!payload) {
    return { success: false, error: '未登录' }
  }

  try {
    const profile = await prisma.kiriko_profile.findUnique({
      where: { user_id: payload.uid },
      select: { purchase_history: true }
    })

    if (!profile) {
      return { success: true, data: { purchases: [] } }
    }

    const history = parsePurchaseHistory(profile.purchase_history)
    return {
      success: true,
      data: { purchases: history.purchases }
    }
  } catch (error) {
    console.error('获取购买记录失败:', error)
    return { success: false, error: '服务器错误' }
  }
}

export const checkItemPurchased = async (itemId: string) => {
  const payload = await verifyHeaderCookie()
  if (!payload) {
    return { success: false, error: '未登录' }
  }

  try {
    const profile = await prisma.kiriko_profile.findUnique({
      where: { user_id: payload.uid },
      select: { purchase_history: true }
    })

    if (!profile) {
      return { success: true, data: { purchased: false } }
    }

    const history = parsePurchaseHistory(profile.purchase_history)
    const purchased = history.purchases.some((p) => p.id === itemId)

    return { success: true, data: { purchased } }
  } catch (error) {
    console.error('检查购买记录失败:', error)
    return { success: false, error: '服务器错误' }
  }
}

// ============================================================
// 购买商品（#5 事务化）
// ============================================================

const SHOP_ITEM_MAP = new Map(SHOP_ITEMS.map((item) => [item.id, item]))

export const purchaseItems = async (
  items: PurchaseItem[],
  _clientTotalPrice: number,
  _clientTotalAffection: number
): Promise<PurchaseResult> => {
  const payload = await verifyHeaderCookie()
  if (!payload) throw new Error('未登录')
  if (items.length === 0) throw new Error('购物车为空')
  if (items.length > 50) throw new Error('购物车商品过多')

  // 价格、好感度、名称、分类全部以服务端商品表为准，忽略客户端传值
  const validatedItems: PurchaseItem[] = items.map((item) => {
    const serverItem = SHOP_ITEM_MAP.get(item.id)
    if (!serverItem) throw new Error('商品不存在')
    return {
      id: serverItem.id,
      price: serverItem.price,
      affection: serverItem.affection,
      name: serverItem.name,
      category: serverItem.category
    }
  })

  const totalPrice = validatedItems.reduce((sum, item) => sum + item.price, 0)
  const totalAffection = validatedItems.reduce(
    (sum, item) => sum + item.affection,
    0
  )
  const specialItems = validatedItems.filter(
    (item) => item.category === 'special'
  )

  // 串行化事务防止并发购买读到同一份金币/购买历史
  let txResult
  try {
    txResult = await prisma.$transaction(
      async (tx) => {
        const profile = await tx.kiriko_profile.findUnique({
          where: { user_id: payload.uid }
        })
        if (!profile) throw new Error('未选择看板娘')

        // 金币校验（基于事务内最新值）
        if (profile.coins < totalPrice) {
          return { ok: false as const, reason: 'coins' as const, profile }
        }

        const currentHistory = parsePurchaseHistory(profile.purchase_history)

        // 特殊商品重复购买校验
        if (specialItems.length > 0) {
          const existingIds = new Set(currentHistory.purchases.map((p) => p.id))
          const alreadyPurchased = specialItems.filter((item) =>
            existingIds.has(item.id)
          )
          if (alreadyPurchased.length > 0) {
            const names = alreadyPurchased
              .map((item) => item.name)
              .filter(Boolean)
              .join('、')
            return {
              ok: false as const,
              reason: 'duplicate' as const,
              names,
              profile
            }
          }
        }

        // 只构造特殊商品的购买记录
        const specialPurchases: PurchaseRecord[] = specialItems.map((item) => ({
          id: item.id,
          name: item.name || item.id,
          price: item.price,
          purchased_at: new Date().toISOString()
        }))

        const oldAffection = profile.affection
        const newAffection = oldAffection + totalAffection
        const oldLevel = getLevel(oldAffection)
        const newLevel = getLevel(newAffection)
        const newCoins = profile.coins - totalPrice
        const updatedPurchases = [
          ...currentHistory.purchases,
          ...specialPurchases
        ]

        await tx.kiriko_profile.update({
          where: { user_id: payload.uid },
          data: {
            coins: newCoins,
            affection: newAffection,
            affection_level: newLevel,
            last_chat_at: new Date(),
            // ✅ Prisma Json 字段要求 InputJsonValue，这里显式转换
            purchase_history: {
              purchases: updatedPurchases
            } as unknown as Prisma.InputJsonValue
          }
        })

        return {
          ok: true as const,
          oldCoins: profile.coins,
          newCoins,
          oldAffection,
          newAffection,
          oldLevel,
          newLevel,
          updatedPurchases
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  } catch (error) {
    if ((error as { code?: string }).code === 'P2034') {
      return {
        success: false,
        oldCoins: 0,
        newCoins: 0,
        affectionGained: 0,
        error: '购买冲突，请重试'
      }
    }
    throw error
  }

  // 事务外的失败分支 → 映射回原 PurchaseResult 结构
  if (!txResult.ok) {
    if (txResult.reason === 'coins') {
      return {
        success: false,
        oldCoins: txResult.profile.coins,
        newCoins: txResult.profile.coins,
        affectionGained: 0,
        error: '金币不足'
      }
    }
    return {
      success: false,
      oldCoins: txResult.profile.coins,
      newCoins: txResult.profile.coins,
      affectionGained: 0,
      error: `以下商品已购买：${txResult.names}`
    }
  }

  try {
    await setKv(getTaskEventKey(payload.uid, 'w4'), '1', 8 * 24 * 60 * 60)
  } catch (error) {
    console.error('记录购物任务事件失败:', error)
  }

  // ✅ #4 成就检查放事务提交后（幂等，失败不影响购买）
  const newAchievements = await runAchievementChecks(payload.uid, {
    newLevel: txResult.newLevel,
    items: validatedItems
  })

  return {
    success: true,
    oldCoins: txResult.oldCoins,
    newCoins: txResult.newCoins,
    affectionGained: totalAffection,
    newAffection: txResult.newAffection,
    leveledUp: txResult.newLevel > txResult.oldLevel,
    newLevel: txResult.newLevel,
    newAchievements,
    data: { purchases: txResult.updatedPurchases }
  }
}
