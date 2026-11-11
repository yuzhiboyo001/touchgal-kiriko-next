// server/services/memoryService.ts

import { prisma } from '~/prisma/index'
import {
  getKirikoChatDailyLimit,
  KIRIKO_MAX_BRAIN_MEMORIES,
  KIRIKO_MAX_CORE_MEMORIES,
  KIRIKO_MAX_EPISODE_MEMORIES,
  KIRIKO_MAX_PROMISE_MEMORIES
} from '~/config/kiriko'
import type { BrainMemoryExtraction, BrainMemoryItem } from '~/types/api/memory'

const CORE_SLOTS = new Set([
  'identity.pet',
  'work.job',
  'family.key',
  'wish.key',
  'preference.food'
])
import {
  getBeijingToday,
  getServerTimestamp,
  isSameBeijingDay
} from '~/utils/time'

export class MemoryService {
  // ===== 对话日志 =====
  static async saveConversation(
    userId: number,
    character: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<{ turn_number: number; remaining: number; dailyCount: number }> {
    const today = getBeijingToday()

    return prisma.$transaction(async (tx) => {
      // 锁用户行，串行化同一用户的配额和 turn_number 计算
      const users = await tx.$queryRaw<
        Array<{
          chat_daily_count: number
          chat_last_used_date: Date | null
          role: number
          donor_until: Date | null
        }>
      >`
        SELECT "chat_daily_count", "chat_last_used_date", "role", "donor_until"
        FROM "user"
        WHERE "id" = ${userId}
        FOR UPDATE
      `

      const user = users[0]
      if (!user) throw new Error('用户不存在')
      const MAX_DAILY = getKirikoChatDailyLimit(user.role, user.donor_until)

      const isSameDay = user.chat_last_used_date
        ? isSameBeijingDay(today, new Date(user.chat_last_used_date))
        : false

      let dailyCount = isSameDay ? user.chat_daily_count : 0

      if (role === 'user') {
        if (dailyCount >= MAX_DAILY) throw new Error('今日对话次数已用完')
        dailyCount++
      }

      const lastLog = await tx.conversation_log.findFirst({
        where: { user_id: userId, character },
        orderBy: { turn_number: 'desc' },
        select: { turn_number: true }
      })

      const turn = (lastLog?.turn_number || 0) + (role === 'user' ? 1 : 0)
      const datetime = getServerTimestamp()

      await tx.conversation_log.create({
        data: {
          user_id: userId,
          character,
          role,
          content: `[${datetime}] ${content}`,
          turn_number: turn,
          is_summarized: false
        }
      })

      if (role === 'user') {
        await tx.user.update({
          where: { id: userId },
          data: {
            chat_daily_count: dailyCount,
            chat_last_used_date: today
          }
        })
      }

      return {
        turn_number: turn,
        remaining: MAX_DAILY - dailyCount,
        dailyCount
      }
    })
  }

  static async getConversationHistory(
    userId: number,
    character: string,
    limit: number = 30,
    order: string = 'desc',
    beforeId?: string
  ): Promise<{
    messages: {
      id: string
      role: string
      content: string
      turn_number: number
      created_at: Date
    }[]
    hasMore: boolean
  }> {
    const logs = await prisma.conversation_log.findMany({
      where: { user_id: userId, character },
      orderBy:
        order === 'desc'
          ? [{ created_at: 'desc' }, { id: 'desc' }]
          : [{ created_at: 'asc' }, { id: 'asc' }],
      ...(beforeId ? { cursor: { id: beforeId }, skip: 1 } : {}),
      take: limit + 1,
      select: {
        id: true,
        role: true,
        content: true,
        turn_number: true,
        created_at: true
      }
    })

    const hasMore = logs.length > limit
    const page = hasMore ? logs.slice(0, limit) : logs

    return {
      messages: order === 'desc' ? [...page].reverse() : page,
      hasMore
    }
  }

  // ===== 大脑记忆 =====
  private static normalizeBrainItems(
    items: BrainMemoryItem[] | undefined,
    limit: number
  ): BrainMemoryItem[] {
    const result: BrainMemoryItem[] = []
    const seen = new Set<string>()

    for (const item of items ?? []) {
      if (!item || typeof item.content !== 'string') continue
      const content = item.content.trim()
      if (!content || content.length > 1000 || seen.has(content)) continue
      seen.add(content)
      const sourceTurn = Number(item.source_turn)
      result.push({
        content,
        slot:
          typeof item.slot === 'string' && item.slot.trim()
            ? item.slot.trim().slice(0, 40)
            : null,
        source_turn:
          Number.isSafeInteger(sourceTurn) && sourceTurn > 0
            ? sourceTurn
            : null,
        evidence:
          typeof item.evidence === 'string'
            ? item.evidence.trim().slice(0, 2000)
            : null,
        status:
          item.status === 'done' ||
          item.status === 'cancelled' ||
          item.status === 'open'
            ? item.status
            : null
      })
    }

    return result.slice(-limit)
  }

  private static mergeStableBrainItems(
    existing: BrainMemoryItem[],
    incoming: BrainMemoryItem[],
    limit: number
  ): BrainMemoryItem[] {
    const keyOf = (item: BrainMemoryItem) => item.slot ?? item.content
    const map = new Map<string, BrainMemoryItem>()
    for (const item of existing) map.set(keyOf(item), item)
    for (const item of incoming) {
      // 已有槽位优先保留；同槽位允许更新，新增只在有空位时进入
      const key = keyOf(item)
      if (map.has(key)) {
        map.set(key, item)
      } else if (map.size < limit) {
        map.set(key, item)
      }
    }
    return [...map.values()].slice(0, limit)
  }

  private static formatBrainMemories(
    entries: Array<{
      content: string
      type: string
      slot?: string | null
      status: string | null
    }>
  ): string[] {
    const corePriority = [
      'identity.pet',
      'work.job',
      'family.key',
      'wish.key',
      'preference.food'
    ]
    const cores = entries
      .filter((entry) => entry.type === 'core')
      .sort((a, b) => {
        const ai = corePriority.indexOf(a.slot ?? '')
        const bi = corePriority.indexOf(b.slot ?? '')
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })
      .slice(0, KIRIKO_MAX_CORE_MEMORIES)
    const promises = entries
      .filter(
        (entry) =>
          entry.type === 'promise' &&
          (entry.status === null || entry.status === 'open')
      )
      .slice(-KIRIKO_MAX_PROMISE_MEMORIES)
    const relationship = entries
      .filter((entry) => entry.type === 'relationship')
      .slice(-1)
    const availableForEpisodes = Math.max(
      0,
      KIRIKO_MAX_BRAIN_MEMORIES -
        cores.length -
        promises.length -
        relationship.length
    )
    const episodes = entries
      .filter((entry) => entry.type === 'episode')
      .slice(-Math.min(KIRIKO_MAX_EPISODE_MEMORIES, availableForEpisodes))

    return [
      ...cores.map((entry) => `[核心事实] ${entry.content}`),
      ...promises.map((entry) => `[未完成约定] ${entry.content}`),
      ...relationship.map((entry) => `[关系状态] ${entry.content}`),
      ...episodes.map((entry) => `[近期事件] ${entry.content}`)
    ].slice(0, KIRIKO_MAX_BRAIN_MEMORIES)
  }

  static async loadBrainMemories(userId: number, character: string) {
    try {
      const [memories, user] = await Promise.all([
        prisma.brain_memory.findMany({
          where: { user_id: userId, character, is_active: true },
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
          take: 50,
          select: { content: true, type: true, slot: true, status: true }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        })
      ])
      const formatted = this.formatBrainMemories(memories)
      const data = user?.name
        ? [`[核心事实] 用户名字：${user.name}`, ...formatted].slice(
            0,
            KIRIKO_MAX_BRAIN_MEMORIES + 1
          )
        : formatted
      return { success: true, data }
    } catch (error) {
      return { success: false, data: [], error: String(error) }
    }
  }

  static async syncBrainMemories(
    userId: number,
    character: string,
    extraction: BrainMemoryExtraction
  ) {
    try {
      const coreIncoming = this.normalizeBrainItems(
        extraction.core,
        KIRIKO_MAX_CORE_MEMORIES
      ).filter((item) => item.slot && CORE_SLOTS.has(item.slot))
      const promiseIncoming = this.normalizeBrainItems(
        extraction.promises,
        KIRIKO_MAX_PROMISE_MEMORIES
      )
        .filter((item) => item.slot?.startsWith('promise.'))
        .map((item) => ({
          ...item,
          status: (item.status ?? 'open') as BrainMemoryItem['status']
        }))
      const episodeIncoming = this.normalizeBrainItems(
        extraction.episodes,
        KIRIKO_MAX_EPISODE_MEMORIES
      )
      const relationshipIncoming = extraction.relationship?.content?.trim()
        ? {
            ...this.normalizeBrainItems([extraction.relationship], 1)[0],
            slot: 'relationship.current'
          }
        : null

      return await prisma.$transaction(async (tx) => {
        const existing = await tx.brain_memory.findMany({
          where: { user_id: userId, character, is_active: true },
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
          select: {
            content: true,
            type: true,
            slot: true,
            source_turn: true,
            evidence: true,
            status: true
          }
        })

        const existingCore = existing
          .filter((item) => item.type === 'core')
          .map((item) => ({
            content: item.content,
            slot: item.slot,
            source_turn: item.source_turn,
            evidence: item.evidence,
            status: null
          }))
        const existingPromises = existing
          .filter(
            (item) =>
              item.type === 'promise' &&
              (item.status === null || item.status === 'open')
          )
          .map((item) => ({
            content: item.content,
            slot: item.slot,
            source_turn: item.source_turn,
            evidence: item.evidence,
            status: (item.status ?? 'open') as BrainMemoryItem['status']
          }))
        const existingEpisodes = existing
          .filter((item) => item.type === 'episode')
          .map((item) => ({
            content: item.content,
            slot: null,
            source_turn: item.source_turn,
            evidence: item.evidence,
            status: null
          }))
        const existingRelationship = existing
          .filter((item) => item.type === 'relationship')
          .slice(-1)
          .map((item) => ({
            content: item.content,
            slot: 'relationship.current',
            source_turn: item.source_turn,
            evidence: item.evidence,
            status: null
          }))

        const core = this.mergeStableBrainItems(
          existingCore,
          coreIncoming,
          KIRIKO_MAX_CORE_MEMORIES
        )
        const promises = this.mergeStableBrainItems(
          existingPromises,
          promiseIncoming,
          KIRIKO_MAX_PROMISE_MEMORIES
        )
        const relationship =
          relationshipIncoming ?? existingRelationship[0] ?? null
        const slotsForEpisodes = Math.max(
          0,
          KIRIKO_MAX_BRAIN_MEMORIES -
            core.length -
            promises.length -
            (relationship ? 1 : 0)
        )
        const episodes = (
          episodeIncoming.length > 0 ? episodeIncoming : existingEpisodes
        ).slice(-Math.min(KIRIKO_MAX_EPISODE_MEMORIES, slotsForEpisodes))

        if (
          core.length === 0 &&
          promises.length === 0 &&
          episodes.length === 0 &&
          !relationship
        ) {
          return { success: false, error: '没有可保存的结构化记忆' }
        }

        await tx.brain_memory.deleteMany({
          where: { user_id: userId, character, is_active: true }
        })

        const rows = [
          ...core.map((item) => ({ ...item, type: 'core', status: null })),
          ...promises.map((item) => ({
            ...item,
            type: 'promise',
            status: item.status ?? 'open'
          })),
          ...(relationship
            ? [{ ...relationship, type: 'relationship', status: null }]
            : []),
          ...episodes.map((item) => ({
            ...item,
            type: 'episode',
            status: null
          }))
        ]

        await tx.brain_memory.createMany({
          data: rows.map((item) => ({
            user_id: userId,
            character,
            content: item.content,
            type: item.type,
            slot: item.slot,
            source_turn: item.source_turn,
            evidence: item.evidence,
            status: item.status
          }))
        })

        return { success: true, count: rows.length }
      })
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  static async addBrainMemory(
    userId: number,
    character: string,
    content: string
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        const count = await tx.brain_memory.count({
          where: {
            user_id: userId,
            character,
            is_active: true,
            type: 'episode'
          }
        })

        if (count >= KIRIKO_MAX_EPISODE_MEMORIES) {
          const oldest = await tx.brain_memory.findFirst({
            where: {
              user_id: userId,
              character,
              is_active: true,
              type: 'episode'
            },
            orderBy: [{ created_at: 'asc' }, { id: 'asc' }]
          })
          if (oldest) {
            await tx.brain_memory.delete({ where: { id: oldest.id } })
          }
        }

        const memory = await tx.brain_memory.create({
          data: { user_id: userId, character, content, type: 'episode' }
        })
        return { success: true, id: memory.id }
      })
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  static async clearBrainMemories(userId: number, character: string) {
    try {
      await prisma.brain_memory.updateMany({
        where: { user_id: userId, character, is_active: true },
        data: { is_active: false }
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}
