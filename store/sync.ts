import { useCreatePatchStore } from './editStore'
import { useRewritePatchStore } from './rewriteStore'
import { useMessageStore } from './messageStore'
import { useSearchStore } from './searchStore'
import { useSettingStore } from './settingStore'
import { useTaskStore } from './taskStore'
import { useUserStore } from './userStore'
import { useSessionStore } from './sessionStore'
import { useFeatureAccessStore } from './featureAccessStore'
import { useKirikoUiStore } from './kirikoUiStore'
import type { UserSession } from '~/types/api/session'

/**
 * 退出登录 / 会话失效 / 其他标签页登出时，清空所有“属于当前用户”的本地状态。
 * 注意：不要清 breadcrumb/milkdown 这类纯 UI 状态。
 */
export const resetUserScopedStores = () => {
  useSessionStore.getState().markAnonymous()
  useFeatureAccessStore.getState().reset()
  useMessageStore.getState().resetUnreadMessageStatus()
  useSettingStore.getState().resetData()
  useTaskStore.getState().reset()
  useSearchStore.getState().resetData()
  useCreatePatchStore.getState().resetData()
  useRewritePatchStore.getState().resetData()
  // 看板娘是内存 Zustand 状态，删除 localStorage 不会清掉它。
  useKirikoUiStore.getState().reset()

  // 这些不是 Zustand store，而是手动写入的本地缓存。
  if (typeof window !== 'undefined') {
    // 用户数据/草稿/搜索/任务缓存直接删除，而不是只写回空状态。
    // 主题、语言、UI 偏好不在这个列表里，继续保留。
    for (const key of [
      'kun-kiriko-store',
      'task-storage',
      'kun-patch-search-store-v3',
      'kun-patch-edit-store'
    ]) {
      localStorage.removeItem(key)
    }

    localStorage.removeItem('kiriko_profile_cache')
    localStorage.removeItem('kiriko_has_profile')
    localStorage.removeItem('kiriko_character')
    localStorage.removeItem('kiriko_user_id')

    // 清理每日任务打开记录，避免越积越多
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith('task-opened-')) {
        localStorage.removeItem(key)
      }
    }

    // 下次登录重新展示一次看板娘滑动提示
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key?.startsWith('kiriko-swipe-hint-shown:')) {
        sessionStorage.removeItem(key)
      }
    }
  }
}

export type RefreshResult = 'ok' | 'invalid' | 'unavailable'

let refreshPromise: Promise<RefreshResult> | null = null

interface RefreshSessionOptions {
  /** 跨标签页同步时不要回写 userStore，避免 storage 事件来回触发 */
  writeUserStore?: boolean
}

/**
 * 校验服务端 session，并同步 sessionStore / userStore / 未读 / 任务。
 * 同一时间只允许一个请求，避免登录、跨标签页、focus 同时刷新。
 */
export const refreshSession = (
  options: RefreshSessionOptions = {}
): Promise<RefreshResult> => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async (): Promise<RefreshResult> => {
    const wasAuthenticated =
      useSessionStore.getState().status === 'authenticated'

    try {
      const res = await fetch('/api/user/session', {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000)
      })

      if (res.status === 401) {
        useUserStore.getState().logout()
        resetUserScopedStores()
        return 'invalid'
      }

      if (!res.ok) {
        useSessionStore.getState().markUnavailable()
        return 'unavailable'
      }

      const session = (await res.json()) as UserSession
      if (!session?.user?.uid) {
        useUserStore.getState().logout()
        resetUserScopedStores()
        return 'invalid'
      }

      if (options.writeUserStore !== false) {
        useUserStore.getState().setUser(session.user)
      }
      useSessionStore.getState().markAuthenticated(session.capabilities)
      useMessageStore.getState().setUnreadMessageStatus(session.unread)

      if (
        !wasAuthenticated ||
        useFeatureAccessStore.getState().loadedAt === null
      ) {
        useFeatureAccessStore.getState().reset()
        void useFeatureAccessStore.getState().load(true)
      }

      // session 已确认后立即返回，设置/任务在后台刷新，避免拖慢登录跳转
      void Promise.all([
        useSettingStore.persist.rehydrate(),
        useTaskStore.getState().fetchTasks(true)
      ]).catch((error) => {
        // session 已确认有效，附属数据刷新失败不应把登录态降级
        console.error('session 附属数据刷新失败:', error)
      })

      return 'ok'
    } catch {
      useSessionStore.getState().markUnavailable()
      return 'unavailable'
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * 登录后 / 其他标签页登录后，按服务端 session 重新对齐用户、未读、任务。
 * 这是唯一的“全量刷新”入口，不要在每个页面加载时调用。
 */
export const refreshAll = async (): Promise<RefreshResult> => {
  return refreshSession()
}
