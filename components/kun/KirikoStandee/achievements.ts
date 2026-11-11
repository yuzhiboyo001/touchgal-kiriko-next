// components/kun/KirikoStandee/achievements.ts
// 修复：#1 unlockAchievement 竞态；#4 新增 runAchievementChecks 统一触发

'use server'

import { prisma } from '~/prisma/index'

// ============================================================
// 基础操作
// ============================================================

// ✅ 检查用户是否已解锁某个成就
export const hasAchievement = async (
  userId: number,
  achievementId: string
): Promise<boolean> => {
  const record = await prisma.kiriko_achievement.findUnique({
    where: {
      user_id_achievement_id: {
        user_id: userId,
        achievement_id: achievementId
      }
    }
  })
  return !!record
}

// ✅ 解锁成就（并发安全：create + 捕获 P2002）
export const unlockAchievement = async (
  userId: number,
  achievementId: string
): Promise<{ success: boolean; isNew: boolean }> => {
  try {
    await prisma.kiriko_achievement.create({
      data: {
        user_id: userId,
        achievement_id: achievementId
      }
    })
    return { success: true, isNew: true }
  } catch (error: any) {
    // P2002 = 唯一约束冲突，说明已经解锁过
    if (error?.code === 'P2002') {
      return { success: true, isNew: false }
    }
    console.error('解锁成就失败:', error)
    return { success: false, isNew: false }
  }
}

// ✅ 获取用户已解锁的所有成就
export const getUserAchievements = async (userId: number) => {
  const records = await prisma.kiriko_achievement.findMany({
    where: { user_id: userId },
    select: { achievement_id: true }
  })
  return records.map((r) => r.achievement_id)
}

// ============================================================
// 成就检查器
// ============================================================

// ✅ 第一次对话
export const checkFirstChat = async (userId: number) => {
  return await unlockAchievement(userId, 'secret_first_chat')
}

// ✅ 好感度 6 级
export const checkAffectionLevel6 = async (
  userId: number,
  newLevel: number
) => {
  if (newLevel >= 6) {
    return await unlockAchievement(userId, 'aff_6')
  }
  return { success: true, isNew: false }
}

// ✅ 收藏 100 款游戏
export const checkExplore100 = async (userId: number) => {
  const count = await prisma.user_patch_favorite_folder_relation.count({
    where: {
      folder: {
        user_id: userId
      }
    }
  })
  if (count >= 100) {
    return await unlockAchievement(userId, 'explore_100')
  }
  return { success: true, isNew: false }
}

// ✅ 发布 100 条评论
export const checkComment100 = async (userId: number) => {
  const count = await prisma.patch_comment.count({
    where: { user_id: userId }
  })
  if (count >= 100) {
    return await unlockAchievement(userId, 'comment_100')
  }
  return { success: true, isNew: false }
}

// ✅ 购买戒指
export const checkShopRing = async (userId: number) => {
  return await unlockAchievement(userId, 'shop_ring')
}

// ✅ 连续 1 年和看板娘聊天
export const checkEternal = async (userId: number, streak: number) => {
  if (streak >= 365) {
    return await unlockAchievement(userId, 'secret_eternal')
  }
  return { success: true, isNew: false }
}

// ============================================================
// 统一成就触发器（#4）
// ============================================================

interface AchievementCheckContext {
  /** 本次操作后的好感度等级（用于补偿解锁 aff_6） */
  newLevel: number
  /** 本次购买的商品（用于判断 shop_ring） */
  items?: Array<{ id: string; category?: string }>
}

/**
 * 统一成就触发器：按当前状态判断，天然支持"补偿解锁"。
 * 返回本次新解锁的 achievement_id 列表。
 *
 * 注意：unlockAchievement 幂等，已解锁返回 isNew=false，不会重复 push。
 */
export const runAchievementChecks = async (
  userId: number,
  ctx: AchievementCheckContext
): Promise<string[]> => {
  const unlocked: string[] = []

  // 好感度 6 级：不依赖 leveledUp，直接看当前等级
  if (ctx.newLevel >= 6) {
    const r = await checkAffectionLevel6(userId, ctx.newLevel)
    if (r.isNew) unlocked.push('aff_6')
  }

  // 购买戒指
  if (ctx.items?.some((i) => i.id === 'ring')) {
    const r = await checkShopRing(userId)
    if (r.isNew) unlocked.push('shop_ring')
  }

  return unlocked
}
