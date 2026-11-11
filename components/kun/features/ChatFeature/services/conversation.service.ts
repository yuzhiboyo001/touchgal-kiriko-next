// features/ChatFeature/services/conversation.service.ts

import { kunFetch } from '../utils/kunFetch'

const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export const conversationService = {
  save: async (
    userId: number,
    character: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<{
    success: boolean
    newAchievements?: string[]
    turnNumber?: number
    chatDailyCount?: number
    error?: string
  }> => {
    try {
      const res = await kunFetch(`${NEXT_API_URL}/api/conversation/log`, {
        method: 'POST',
        body: JSON.stringify({ userId, character, role, content })
      })
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ 保存对话 API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 保存对话失败:', error)
      return { success: false, error: String(error) }
    }
  },

  // ✅ 按消息 id 游标加载更早的历史，避免同一 turn 被拆页后丢消息
  loadHistory: async (
    userId: number,
    character: string,
    limit: number = 30,
    beforeId?: string
  ) => {
    try {
      const params = new URLSearchParams({
        userId: String(userId),
        character,
        limit: String(limit),
        order: 'desc'
      })
      if (beforeId !== undefined) {
        params.set('beforeId', beforeId)
      }

      const res = await kunFetch(
        `${NEXT_API_URL}/api/conversation/history?${params.toString()}`,
        { method: 'GET' }
      )
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ 加载历史 API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 加载历史失败:', error)
      return { success: false, error: String(error) }
    }
  },

  // ... 其他方法保持不变
  getUnsummarizedCount: async (userId: number, character: string) => {
    try {
      const res = await kunFetch(
        `${NEXT_API_URL}/api/conversation/count?userId=${userId}&character=${character}`,
        { method: 'GET' }
      )
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ 获取未总结数量 API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 获取未总结数量失败:', error)
      return { success: false, error: String(error) }
    }
  },

  getUnsummarizedTurns: async (userId: number, character: string) => {
    try {
      const res = await kunFetch(
        `${NEXT_API_URL}/api/conversation/unsummarized?userId=${userId}&character=${character}`,
        { method: 'GET' }
      )
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ 获取未总结对话 API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 获取未总结对话失败:', error)
      return { success: false, error: String(error) }
    }
  },

  markTurnsAsSummarized: async (
    userId: number,
    character: string,
    turnNumbers: number[],
    memoryId: string
  ) => {
    try {
      const res = await kunFetch(`${NEXT_API_URL}/api/conversation/mark`, {
        method: 'POST',
        body: JSON.stringify({ userId, character, turnNumbers, memoryId })
      })
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ 标记已总结 API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 标记已总结失败:', error)
      return { success: false, error: String(error) }
    }
  },

  getLastTurnNumber: async (userId: number, character: string) => {
    try {
      const res = await kunFetch(
        `${NEXT_API_URL}/api/conversation/last-turn?userId=${userId}&character=${character}`,
        { method: 'GET' }
      )
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ 获取最后轮次 API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 获取最后轮次失败:', error)
      return { success: false, error: String(error) }
    }
  }
}
