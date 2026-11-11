// components/kun/hooks/useConversation.ts

import { useState, useCallback, useRef } from 'react'
import { conversationService } from '../features/ChatFeature/services/conversation.service'
import type { Message, ConversationTurn } from '../features/ChatFeature/types'
import { genMessageId } from '../features/ChatFeature/utils/id'
import { getBeijingTimestamp, parseTimeFromContent } from '~/utils/time'
import { KIRIKO_CHAT_HISTORY_PAGE_SIZE } from '~/config/kiriko'

const HISTORY_PAGE_SIZE = KIRIKO_CHAT_HISTORY_PAGE_SIZE

const messageKey = (message: Message) =>
  message.dbId ??
  (message.turnNumber != null
    ? `${message.turnNumber}:${message.role}`
    : `${message.createdAt ?? ''}:${message.role}:${message.content}`)

const toMessage = (msg: any): Message => {
  const parsed = parseTimeFromContent(msg.content)
  return {
    id: genMessageId(),
    role: msg.role as 'user' | 'assistant',
    content: parsed.cleanContent,
    time: parsed.time,
    fullTime: parsed.fullTime,
    dbId: msg.id,
    turnNumber: msg.turn_number,
    createdAt: msg.created_at
      ? new Date(msg.created_at).toISOString()
      : undefined
  }
}

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

export const useConversation = (character: string, userId: number) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const loadingOlderRef = useRef(false)

  // ✅ 添加消息（不再裁掉旧历史）
  const addMessage = useCallback(
    (
      role: 'user' | 'assistant',
      content: string,
      useCurrentTime = false,
      turnNumber?: number
    ) => {
      const hasTimeStamp = /^\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\]\s*/.test(
        content
      )

      let time: string
      let fullTime: string
      let cleanContent: string
      let createdAt: string

      if (hasTimeStamp && !useCurrentTime) {
        // content 自带时间前缀：解析它作为显示/排序时间
        const parsed = parseTimeFromContent(content)
        time = parsed.time
        fullTime = parsed.fullTime
        cleanContent = parsed.cleanContent
        // 前缀时间不代表"消息创建时刻"，createdAt 用当前真实时刻
        createdAt = new Date().toISOString()
      } else {
        // 无前缀或强制当前时间：用当前北京时间
        const ts = getBeijingTimestamp()
        time = ts.time
        fullTime = ts.fullTime
        cleanContent = content
        createdAt = ts.createdAt
      }

      setMessages((prev) => [
        ...prev,
        {
          id: genMessageId(),
          role,
          content: cleanContent,
          time,
          fullTime,
          turnNumber,
          createdAt
        }
      ])
    },
    []
  )

  // ✅ 初始加载最近一页
  const loadHistory = useCallback(
    async (limit: number = HISTORY_PAGE_SIZE) => {
      if (userId <= 0) return

      const result = await conversationService.loadHistory(
        userId,
        character,
        limit
      )

      if (result.success) {
        const historyMessages: Message[] = (result.data || []).map(toMessage)
        // 初始化历史可能被 StrictMode/重复 effect 请求多次。
        // 如果本地已经有消息（用户刚刚发出），不要让迟到的历史响应覆盖它。
        setMessages((prev) => (prev.length > 0 ? prev : historyMessages))
        setHasMoreHistory(Boolean(result.hasMore))
        await sendLog(
          `✅ [Conversation] 已加载 ${historyMessages.length} 条对话`
        )
      }
    },
    [userId, character]
  )

  // ✅ 向上翻页，加载更早的历史
  const loadOlder = useCallback(
    async (limit: number = HISTORY_PAGE_SIZE): Promise<number> => {
      if (
        userId <= 0 ||
        loadingOlderRef.current ||
        !hasMoreHistory ||
        messages.length === 0
      ) {
        return 0
      }

      const beforeId = messages.find((message) => message.dbId)?.dbId
      if (!beforeId) return 0

      loadingOlderRef.current = true
      setIsLoadingOlder(true)

      try {
        const result = await conversationService.loadHistory(
          userId,
          character,
          limit,
          beforeId
        )
        if (!result.success) return 0

        const incoming: Message[] = (result.data || []).map(toMessage)
        const existingKeys = new Set(messages.map(messageKey))
        const older = incoming.filter(
          (message) => !existingKeys.has(messageKey(message))
        )

        if (older.length > 0) {
          setMessages((prev) => [...older, ...prev])
        }
        setHasMoreHistory(Boolean(result.hasMore))
        return older.length
      } finally {
        loadingOlderRef.current = false
        setIsLoadingOlder(false)
      }
    },
    [userId, character, hasMoreHistory, messages]
  )

  const saveUserMessage = useCallback(
    async (content: string) => {
      const result = await conversationService.save(
        userId,
        character,
        'user',
        content
      )
      if (result.success) {
        addMessage('user', content, true, result.turnNumber)
      }
      return result
    },
    [userId, character, addMessage]
  )

  const saveAssistantReply = useCallback(
    async (content: string) => {
      const result = await conversationService.save(
        userId,
        character,
        'assistant',
        content
      )
      addMessage('assistant', content, true, result.turnNumber)
      return result
    },
    [userId, character, addMessage]
  )

  const getUnsummarizedCount = useCallback(async () => {
    const result = await conversationService.getUnsummarizedCount(
      userId,
      character
    )
    return result.count || 0
  }, [userId, character])

  const getUnsummarizedTurns = useCallback(async (): Promise<
    ConversationTurn[]
  > => {
    const result = await conversationService.getUnsummarizedTurns(
      userId,
      character
    )
    return result.data || []
  }, [userId, character])

  const markAsSummarized = useCallback(
    async (turnNumbers: number[], memoryId: string) => {
      return await conversationService.markTurnsAsSummarized(
        userId,
        character,
        turnNumbers,
        memoryId
      )
    },
    [userId, character]
  )

  const resetConversation = useCallback(() => {
    setMessages([])
  }, [])

  const getLastTurnNumber = useCallback(async () => {
    if (userId <= 0) return 0
    const result = await conversationService.getLastTurnNumber(
      userId,
      character
    )
    return result.turn_number || 0
  }, [userId, character])

  return {
    messages,
    setMessages,
    loadHistory,
    loadOlder,
    hasMoreHistory,
    isLoadingOlder,
    saveUserMessage,
    saveAssistantReply,
    addMessage,
    getUnsummarizedCount,
    getUnsummarizedTurns,
    getLastTurnNumber,
    markAsSummarized,
    resetConversation
  }
}
