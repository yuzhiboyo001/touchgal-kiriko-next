// features/ChatFeature/types.ts
import type { StandeeConfig } from '../../KirikoStandee/types'

export interface ChatFeatureProps {
  config: StandeeConfig
  onClose: () => void
  scale?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time?: string
  fullTime?: string
  dbId?: string // ✅ conversation_log.id，分页游标
  turnNumber?: number // ✅ 后端 turn_number，排序主键
  createdAt?: string // ✅ 后端 created_at ISO 字符串，排序次键
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  remainingQuota: number
  isQuotaExceeded: boolean
}

// ===== 🆕 新增类型（方便服务使用） =====
export interface MemoryData {
  shortTerm: string[]
  midTerm: string[]
  longTerm: string | null
}

export interface ConversationTurn {
  turn_number: number
  role: string
  content: string
}
