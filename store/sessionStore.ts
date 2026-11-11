import { create } from 'zustand'
import type { GlobalCapabilities, SessionStatus } from '~/types/api/session'

interface SessionStore {
  status: SessionStatus
  capabilities: GlobalCapabilities | null

  hydrate: (
    status: SessionStatus,
    capabilities?: GlobalCapabilities | null
  ) => void
  markAuthenticated: (capabilities?: GlobalCapabilities | null) => void
  markAnonymous: () => void
  markUnavailable: () => void
}

/**
 * 登录状态的唯一客户端来源。
 *
 * 只保存 session 状态和角色型全局能力。
 * 用户资料在 userStore，未读在 messageStore。
 */
export const useSessionStore = create<SessionStore>((set) => ({
  status: 'pending',
  capabilities: null,

  hydrate: (status, capabilities = null) => set({ status, capabilities }),

  markAuthenticated: (capabilities = null) =>
    set({ status: 'authenticated', capabilities }),

  markAnonymous: () => set({ status: 'anonymous', capabilities: null }),

  markUnavailable: () => set({ status: 'unavailable', capabilities: null })
}))
