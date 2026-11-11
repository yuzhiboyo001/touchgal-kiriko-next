// components/kun/hooks/useChat.ts

'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useUserStore } from '~/store/userStore'
import { useMemory } from './useMemory'
import { useConversation } from './useConversation'
import { memoryService } from '../features/ChatFeature/services/memory.service'
import type { Message } from '../features/ChatFeature/types'
import type { BrainMemoryExtraction } from '~/types/api/memory'
import { genMessageId } from '../features/ChatFeature/utils/id'
import {
  getKirikoChatDailyLimit,
  KIRIKO_BRAIN_EXTRACT_INTERVAL,
  KIRIKO_CHAT_INITIAL_HISTORY,
  KIRIKO_MAX_BRAIN_MEMORIES
} from '~/config/kiriko'

export const MAX_DAILY_CHATS = getKirikoChatDailyLimit(1)
const BRAIN_MEMORY_INTERVAL = KIRIKO_BRAIN_EXTRACT_INTERVAL
const CHAT_API = '/api/kiriko/chat'
const BRAIN_API = '/api/kiriko/brain-memory'
const HEALTH_API = '/api/kiriko/health'
const STATUS_API = '/api/kiriko/status'

export const useChat = (character: string) => {
  const user = useUserStore((state) => state.user)
  const userId = user?.uid || 0
  const [dailyLimit, setDailyLimit] = useState(() =>
    getKirikoChatDailyLimit(user?.role ?? 1)
  )

  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [remainingQuota, setRemainingQuota] = useState(dailyLimit)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const initializedUserRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [newAchievements, setNewAchievements] = useState<string[]>([])
  const [budgetExhausted, setBudgetExhausted] = useState(false)
  const [userLocation, setUserLocation] = useState('便利店')
  const [chatMode, setChatMode] = useState<'online' | 'offline'>('online')

  const {
    messages,
    setMessages,
    loadHistory,
    loadOlder,
    hasMoreHistory,
    isLoadingOlder,
    saveUserMessage,
    saveAssistantReply,
    getLastTurnNumber
  } = useConversation(character, userId)

  const {
    brainMemories,
    brainMemoriesRef,
    loadBrainMemories,
    syncBrainMemories,
    syncBrainRefs
  } = useMemory(character, userId)

  // ✅ 标记：是否已经完成首次滚动
  const hasScrolledInitiallyRef = useRef(false)

  // ===== 加载配额 =====
  const loadQuota = useCallback(async () => {
    if (userId <= 0) return
    try {
      const result = await memoryService.getQuota(userId)
      if (result.success) {
        if (typeof result.limit === 'number') {
          setDailyLimit(result.limit)
        }
        setRemainingQuota(result.remaining || 0)
      }
    } catch (error) {
      console.error('❌ 加载配额失败:', error)
    }
  }, [userId])

  // ===== 初始化 =====
  // 只初始化一次。避免 loadHistory 多次返回时把用户刚发的新消息覆盖掉。
  useEffect(() => {
    if (userId <= 0 || initializedUserRef.current === userId) return

    initializedUserRef.current = userId
    setIsDataLoaded(false)

    Promise.all([
      loadQuota(),
      loadHistory(KIRIKO_CHAT_INITIAL_HISTORY),
      loadBrainMemories()
    ])
      .then(() => setIsDataLoaded(true))
      .catch((error) => {
        console.error('❌ 聊天初始化失败:', error)
        initializedUserRef.current = null
      })
  }, [userId, loadQuota, loadHistory, loadBrainMemories])

  // ===== AI 余额锁检查 =====
  const checkAiAvailability = useCallback(async () => {
    if (userId <= 0) {
      return false
    }

    try {
      const response = await fetch(STATUS_API, {
        cache: 'no-store',
        credentials: 'same-origin'
      })
      if (!response.ok) {
        return false
      }

      const data = (await response.json()) as { locked?: boolean }
      if (data.locked) {
        setBudgetExhausted(true)
        setRemainingQuota(0)
        return true
      }

      setBudgetExhausted(false)
      return false
    } catch {
      return false
    }
  }, [userId])

  // 进入聊天、切回页面时检查；锁文件存在时立即禁用输入
  useEffect(() => {
    if (userId <= 0) {
      return
    }

    const check = () => {
      if (document.visibilityState === 'visible') {
        void checkAiAvailability()
      }
    }

    const timer = setInterval(check, 30_000)
    check()

    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [userId, checkAiAvailability])

  // ===== 连接检查 =====
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(HEALTH_API, {
        signal: AbortSignal.timeout(3000)
      })
      setIsConnected(res.ok)
      return res.ok
    } catch {
      setIsConnected(false)
      return false
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkConnection()
    }, 0)
    const interval = setInterval(checkConnection, 30000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [checkConnection])

  // ✅ 滚动到底部（瞬间滚动，不占用主线程）
  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return
    const container = messagesEndRef.current.parentElement
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  // ✅ 只在首次加载完成后滚动一次
  useEffect(() => {
    // 数据还没加载完，跳过
    if (!isDataLoaded) return
    // 已经滚动过了，跳过
    if (hasScrolledInitiallyRef.current) return
    // 没有消息，跳过
    if (messages.length === 0) return

    // ✅ 用 requestAnimationFrame 确保 DOM 已渲染
    requestAnimationFrame(() => {
      scrollToBottom()
      hasScrolledInitiallyRef.current = true
      if (process.env.NODE_ENV === 'development') {
        console.log('[useChat] 首次加载滚动到底部')
      }
    })
  }, [isDataLoaded, messages.length, scrollToBottom])

  // ===== 大脑分支API =====
  const callBrainMemoryAPI = useCallback(
    async (
      recentDialogue: { role: string; content: string }[],
      existingMemories: string[]
    ): Promise<BrainMemoryExtraction | null> => {
      try {
        const res = await fetch(BRAIN_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'kun-fetch'
          },
          body: JSON.stringify({
            character,
            user_id: String(userId),
            user_name: user?.name || '你',
            recent_dialogue: recentDialogue,
            existing_memories: existingMemories.slice(
              -KIRIKO_MAX_BRAIN_MEMORIES
            ),
            total_memories: brainMemoriesRef.current.length,
            max_memories: KIRIKO_MAX_BRAIN_MEMORIES,
            user_location: userLocation
          })
        })
        const data = await res.json()
        return data.success &&
          data.memories &&
          typeof data.memories === 'object'
          ? (data.memories as BrainMemoryExtraction)
          : null
      } catch (error) {
        console.error('❌ 大脑API调用失败:', error)
        return null
      }
    },
    [character, userId, user?.name, brainMemoriesRef]
  )

  // ===== 构建上下文（✅ 修复 422：过滤多余字段） =====
  const buildContext = useCallback(
    (userMessage: string) => {
      syncBrainRefs()
      return {
        // ✅ 只带最近 10 轮（20 条）和最多 20 条大脑记忆
        conversations: messages.slice(-20).map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        memories: brainMemoriesRef.current.slice(-KIRIKO_MAX_BRAIN_MEMORIES),
        currentMessage: userMessage
      }
    },
    [messages, brainMemoriesRef, syncBrainRefs]
  )

  // ===== 发送消息 =====
  const sendMessage = useCallback(
    async (input: string): Promise<{ chatDailyCount?: number }> => {
      if (!input.trim() || isLoading || remainingQuota <= 0) return {}

      if (await checkAiAvailability()) {
        return {}
      }

      if (!isConnected && !(await checkConnection())) {
        setMessages((prev) => [
          ...prev,
          {
            id: genMessageId(),
            role: 'assistant' as const,
            content: '⚠️ 连接服务器失败，请检查 FastAPI 服务是否运行'
          }
        ])
        return {}
      }

      const userMessage = input.trim()

      // ✅ 声明 chatDailyCount（必须在 if 外面，return 用得到）
      let chatDailyCount: number | undefined

      if (userId > 0) {
        const saveResult = await saveUserMessage(userMessage)

        if (saveResult?.success === false) {
          setMessages((prev) => [
            ...prev,
            {
              id: genMessageId(),
              role: 'assistant' as const,
              content: saveResult.error || '今日对话次数已用完'
            }
          ])
          return {}
        }

        // ✅ 用局部变量收窄类型，避免 TS 报 undefined
        const achievements = saveResult?.newAchievements
        if (achievements && achievements.length > 0) {
          setNewAchievements((prev) => [...prev, ...achievements])
        }

        chatDailyCount = saveResult?.chatDailyCount
        if (chatDailyCount !== undefined) {
          setRemainingQuota(Math.max(0, dailyLimit - chatDailyCount))
        }
      }
      setIsLoading(true)

      try {
        const context = buildContext(userMessage)

        const res = await fetch(CHAT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'kun-fetch'
          },
          body: JSON.stringify({
            character,
            message: userMessage,
            user_id: String(userId),
            user_name: user?.name || '你',
            conversations: context.conversations,
            memories: context.memories,
            user_location: userLocation,
            chat_mode: chatMode
          })
        })

        if (res.status === 402) {
          setBudgetExhausted(true)
          setRemainingQuota(0)
          return { chatDailyCount }
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const reply = data.reply

        if (userId > 0) await saveAssistantReply(reply)

        const turn = await getLastTurnNumber()
        if (turn > 0 && turn % BRAIN_MEMORY_INTERVAL === 0) {
          const recent = messages.slice(-20).map((msg) => ({
            role: msg.role,
            content: msg.content,
            turn_number: msg.turnNumber ?? null
          }))
          const extracted = await callBrainMemoryAPI(
            recent,
            brainMemoriesRef.current.slice(-KIRIKO_MAX_BRAIN_MEMORIES)
          )
          if (extracted) {
            await syncBrainMemories(extracted)
          }
        }
      } catch (error) {
        console.error('❌ Chat error:', error)
        setMessages((prev) => [
          ...prev,
          {
            id: genMessageId(), // ✅ 恢复：必须有 id
            role: 'assistant' as const,
            content: '💤 连接服务失败，请稍后再试…'
          }
        ])
      } finally {
        setIsLoading(false)
        await loadQuota()
      }
      return { chatDailyCount }
    },
    [
      character,
      isLoading,
      remainingQuota,
      isConnected,
      userId,
      user?.name,
      dailyLimit,
      messages,
      brainMemoriesRef,
      userLocation,
      chatMode,
      buildContext,
      checkAiAvailability,
      checkConnection,
      saveUserMessage,
      saveAssistantReply,
      getLastTurnNumber,
      callBrainMemoryAPI,
      syncBrainMemories,
      setMessages,
      loadQuota
    ]
  )

  const resetChat = useCallback(() => {
    setMessages([])
    hasScrolledInitiallyRef.current = false // ✅ 重置滚动标记
    loadQuota()
  }, [loadQuota, setMessages])

  // ✅ 新增：稳定引用
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([])
  }, [])

  // ✅ 用 useMemo 缓存返回对象（避免每次新引用）
  return useMemo(
    () => ({
      messages,
      isLoading,
      remainingQuota,
      isQuotaExceeded: remainingQuota <= 0,
      isConnected,
      sendMessage,
      resetChat,
      scrollToBottom,
      messagesEndRef,
      checkConnection,
      userLocation,
      setUserLocation,
      chatMode,
      setChatMode,
      loadQuota,
      isDataLoaded,
      dailyLimit,
      hasMoreHistory,
      isLoadingOlder,
      loadOlder,
      newAchievements,
      clearNewAchievements,
      budgetExhausted,
      dismissBudgetExhausted: () => setBudgetExhausted(false)
    }),
    [
      messages,
      isLoading,
      remainingQuota,
      isConnected,
      sendMessage,
      resetChat,
      scrollToBottom,
      checkConnection,
      userLocation,
      chatMode,
      loadQuota,
      isDataLoaded,
      dailyLimit,
      hasMoreHistory,
      isLoadingOlder,
      loadOlder,
      newAchievements,
      clearNewAchievements,
      budgetExhausted
    ]
  )
}
