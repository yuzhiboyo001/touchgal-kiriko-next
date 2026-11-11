// features/ChatFeature/services/memory.service.ts

import { kunFetch } from '../utils/kunFetch'
import type { MemoryData } from '../types'
import type { BrainMemoryExtraction } from '~/types/api/memory'

const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export const memoryService = {
  load: async (
    userId: number,
    character: string
  ): Promise<{ success: boolean; data?: MemoryData; error?: string }> => {
    try {
      const res = await kunFetch(
        `${NEXT_API_URL}/api/memory?userId=${userId}&character=${character}`,
        { method: 'GET' }
      )
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 加载记忆失败:', error)
      return { success: false, error: String(error) }
    }
  },
  clear: async (userId: number, character: string) => {
    try {
      const res = await kunFetch(`${NEXT_API_URL}/api/memory`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'clear',
          userId,
          character
        })
      })
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 清除记忆失败:', error)
      return { success: false, error: String(error) }
    }
  },

  getQuota: async (userId: number) => {
    try {
      const res = await kunFetch(
        `${NEXT_API_URL}/api/user/quota?userId=${userId}`,
        { method: 'GET' }
      )
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ 获取配额 API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 获取配额失败:', error)
      return { success: false, error: String(error) }
    }
  },

  // ============================================================
  // 🧠 大脑记忆 API
  // ============================================================

  loadBrainMemories: async (
    userId: number,
    character: string
  ): Promise<{ success: boolean; data?: string[]; error?: string }> => {
    try {
      const res = await kunFetch(
        `${NEXT_API_URL}/api/brain-memory?userId=${userId}&character=${character}`,
        { method: 'GET' }
      )
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 加载大脑记忆失败:', error)
      return { success: false, error: String(error) }
    }
  },

  syncBrainMemories: async (
    userId: number,
    character: string,
    memories: BrainMemoryExtraction
  ): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const res = await kunFetch(`${NEXT_API_URL}/api/brain-memory`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'sync',
          userId,
          character,
          memories
        })
      })
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ 同步大脑记忆 API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 同步大脑记忆失败:', error)
      return { success: false, error: String(error) }
    }
  },

  addBrainMemory: async (
    userId: number,
    character: string,
    content: string
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!content || content.trim().length === 0) {
      console.warn('⚠️ [API] 大脑记忆内容为空，跳过保存')
      return { success: false, error: '内容为空' }
    }
    try {
      const res = await kunFetch(`${NEXT_API_URL}/api/brain-memory`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'add',
          userId,
          character,
          content: content.trim()
        })
      })
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 保存大脑记忆失败:', error)
      return { success: false, error: String(error) }
    }
  },

  clearBrainMemories: async (
    userId: number,
    character: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await kunFetch(`${NEXT_API_URL}/api/brain-memory`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'clear',
          userId,
          character
        })
      })
      if (!res.ok) {
        const text = await res.text()
        console.error(`❌ API 错误 (${res.status}):`, text)
        return { success: false, error: `HTTP ${res.status}` }
      }
      return await res.json()
    } catch (error) {
      console.error('❌ 清除大脑记忆失败:', error)
      return { success: false, error: String(error) }
    }
  }
}
