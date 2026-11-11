import { prisma } from '~/prisma/index'
import { getKv } from '~/lib/redis'
import {
  formatBeijingDate,
  getBeijingToday,
  getBeijingWeekStart
} from '~/utils/time'

const TASK_EVENT_PREFIX = 'task:event'

export const getTaskEventKey = (uid: number, taskId: string) =>
  `${TASK_EVENT_PREFIX}:${uid}:${taskId}:${formatBeijingDate()}`

interface PurchaseRecord {
  id?: string
  purchased_at?: string
}

const parsePurchaseHistory = (raw: unknown): PurchaseRecord[] => {
  if (!raw || typeof raw !== 'object') return []
  const purchases = (raw as { purchases?: unknown }).purchases
  return Array.isArray(purchases) ? (purchases as PurchaseRecord[]) : []
}

const hasPurchaseSince = async (uid: number, since: Date) => {
  const profile = await prisma.kiriko_profile.findUnique({
    where: { user_id: uid },
    select: { purchase_history: true }
  })
  if (!profile) return false

  return parsePurchaseHistory(profile.purchase_history).some((purchase) => {
    if (!purchase.purchased_at) return false
    const time = new Date(purchase.purchased_at).getTime()
    return Number.isFinite(time) && time >= since.getTime()
  })
}

/**
 * 任务是否真的完成，只能由服务端数据判定。
 * 不信任客户端传来的 completed 字段。
 */
export const verifyTaskCompletion = async (
  uid: number,
  taskId: string
): Promise<boolean> => {
  const today = getBeijingToday()

  switch (taskId) {
    // 打开「日课」面板：POST 本身即证明已打开
    case 'd1':
      return true

    // 和看板娘聊 3 句话
    case 'd2': {
      const count = await prisma.conversation_log.count({
        where: { user_id: uid, role: 'user', created_at: { gte: today } }
      })
      return count >= 3
    }

    // 收藏一款游戏
    case 'd3': {
      const count = await prisma.user_patch_favorite_folder_relation.count({
        where: {
          folder: { user_id: uid },
          created: { gte: today }
        }
      })
      return count >= 1
    }

    // 搜索一次：由 /api/search 写入服务端事件
    case 'd4':
      return Boolean(await getKv(getTaskEventKey(uid, 'd4')))

    // 发布一条评论
    case 'd5': {
      const count = await prisma.patch_comment.count({
        where: { user_id: uid, created: { gte: today } }
      })
      return count >= 1
    }

    // 发布一篇游戏评价（不是攻略/资源）
    case 'w1': {
      const weekStart = getBeijingWeekStart()
      const count = await prisma.patch_rating.count({
        where: { user_id: uid, created: { gte: weekStart } }
      })
      return count >= 1
    }

    // 和看板娘聊 10 句话
    case 'w3': {
      const count = await prisma.conversation_log.count({
        where: { user_id: uid, role: 'user', created_at: { gte: today } }
      })
      return count >= 10
    }

    // 本周购物一次
    case 'w4': {
      if (await getKv(getTaskEventKey(uid, 'w4'))) {
        return true
      }
      const weekStart = getBeijingWeekStart()
      return hasPurchaseSince(uid, weekStart)
    }

    // 购买特殊商品
    case 'c2': {
      const profile = await prisma.kiriko_profile.findUnique({
        where: { user_id: uid },
        select: { purchase_history: true }
      })
      return Boolean(
        profile && parsePurchaseHistory(profile.purchase_history).length > 0
      )
    }

    default:
      return false
  }
}
