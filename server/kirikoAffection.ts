import { prisma } from '~/prisma/index'
import { getLevel } from '~/components/kun/KirikoStandee/affection/constants'
import type { Prisma } from '~/prisma/generated/prisma/client'

type Db = Prisma.TransactionClient | typeof prisma

export interface AffectionUpdateResult {
  oldAffection: number
  newAffection: number
  oldLevel: number
  newLevel: number
  leveledUp: boolean
}

/**
 * 服务端内部使用的固定好感度变更。
 * 不要把这个文件导出成 Server Action，避免客户端传入任意金额。
 */
export const addAffectionToProfile = async (
  uid: number,
  amount: number,
  db: Db = prisma
): Promise<AffectionUpdateResult> => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('好感度必须大于 0')
  }

  const profile = await db.kiriko_profile.findUnique({
    where: { user_id: uid },
    select: { affection: true }
  })
  if (!profile) throw new Error('未选择看板娘')

  const oldAffection = profile.affection
  const newAffection = oldAffection + amount
  const oldLevel = getLevel(oldAffection)
  const newLevel = getLevel(newAffection)

  await db.kiriko_profile.update({
    where: { user_id: uid },
    data: {
      affection: newAffection,
      affection_level: newLevel,
      last_chat_at: new Date()
    }
  })

  return {
    oldAffection,
    newAffection,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel
  }
}
