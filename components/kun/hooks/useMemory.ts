// components/kun/hooks/useMemory.ts

import { useState, useRef, useCallback } from 'react'
import { memoryService } from '../features/ChatFeature/services/memory.service'
import type { BrainMemoryExtraction } from '~/types/api/memory'

const sendLog = async (message: string, data?: any) => {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        data,
        timestamp: new Date().toISOString()
      })
    })
  } catch {
    /* 静默失败 */
  }
}

export const useMemory = (character: string, userId: number) => {
  const [brainMemories, setBrainMemories] = useState<string[]>([])
  const brainMemoriesRef = useRef<string[]>([])

  const syncBrainRefs = useCallback(() => {
    brainMemoriesRef.current = brainMemories
  }, [brainMemories])

  // ===== 加载大脑记忆 =====
  const loadBrainMemories = useCallback(async (): Promise<boolean> => {
    if (userId <= 0) {
      await sendLog('⚠️ [Memory] userId <= 0，跳过加载')
      return false
    }

    await sendLog('🧠 [Memory] 从数据库加载大脑记忆...')
    const result = await memoryService.loadBrainMemories(userId, character)

    if (!result.success || !result.data) {
      await sendLog('❌ [Memory] 加载失败', { error: result.error })
      return false
    }

    const memories = result.data || []
    setBrainMemories(memories)
    setTimeout(() => syncBrainRefs(), 0)

    await sendLog(`🧠 [Memory] 加载了 ${memories.length} 条大脑记忆`)
    return true
  }, [userId, character, syncBrainRefs])

  // ===== 保存大脑记忆 =====
  const saveBrainMemory = useCallback(
    async (content: string) => {
      if (!content || content.trim().length === 0) {
        await sendLog('⚠️ [Memory] 记忆内容为空，跳过保存')
        return { success: false, error: '内容为空' }
      }

      const result = await memoryService.addBrainMemory(
        userId,
        character,
        content
      )
      if (result.success) {
        await sendLog(`🧠 [Memory] 大脑记忆已保存`)
        await loadBrainMemories()
      }
      return result
    },
    [userId, character, loadBrainMemories]
  )

  // ===== 用结构化结果整体同步 =====
  const syncBrainMemories = useCallback(
    async (memories: BrainMemoryExtraction) => {
      const result = await memoryService.syncBrainMemories(
        userId,
        character,
        memories
      )
      if (result.success) {
        await sendLog('🧠 [Memory] 结构化记忆已同步')
        await loadBrainMemories()
      }
      return result
    },
    [userId, character, loadBrainMemories]
  )

  // ===== 清除记忆 =====
  const clearMemories = useCallback(async () => {
    const result = await memoryService.clearBrainMemories(userId, character)
    if (result.success) {
      setBrainMemories([])
      await sendLog('🗑️ [Memory] 所有大脑记忆已清除')
    }
    return result
  }, [userId, character])

  return {
    brainMemories,
    brainMemoriesRef,
    loadBrainMemories,
    saveBrainMemory,
    syncBrainMemories,
    clearMemories,
    syncBrainRefs,
    setBrainMemories
  }
}
