'use client'

import { useEffect, useRef } from 'react'
import { CROSS_TAB_SIGNAL_PREFIX } from '~/store/crossTab'
import { useSearchStore } from '~/store/searchStore'
import { useSettingStore } from '~/store/settingStore'
import { useTaskStore } from '~/store/taskStore'
import { useUserStore } from '~/store/userStore'
import { useSessionStore } from '~/store/sessionStore'
import { useFeatureAccessStore } from '~/store/featureAccessStore'
import { refreshSession, resetUserScopedStores } from '~/store/sync'

const USER_STORE_KEY = 'kun-patch-user-store'
const TASK_STORE_KEY = 'task-storage'
const SEARCH_STORE_KEY = 'kun-patch-search-store-v3'

/**
 * 监听其他标签页写入 localStorage 的事件。
 * - userStore 变化：登录/退出跨标签同步
 * - task/search/kiriko：重新 hydrate
 * - settingStore 用 cookie 存储，靠 broadcastStoreChange 的 signal key 通知
 *
 * 注意：editStore 草稿不做实时同步，避免 A 标签的编辑覆盖 B 标签未保存的草稿；
 * 它只在退出登录时由 resetUserScopedStores 清空。
 */
export const StoreSync = () => {
  const previousUidRef = useRef<number | null>(null)

  useEffect(() => {
    previousUidRef.current = useUserStore.getState().user.uid

    const handleStorage = async (event: StorageEvent) => {
      if (!event.key) {
        return
      }

      if (event.key.startsWith(`${CROSS_TAB_SIGNAL_PREFIX}:`)) {
        if (event.key === `${CROSS_TAB_SIGNAL_PREFIX}:setting`) {
          await useSettingStore.persist.rehydrate()
        }
        if (event.key === `${CROSS_TAB_SIGNAL_PREFIX}:feature-access`) {
          useFeatureAccessStore.getState().reset()
          void useFeatureAccessStore.getState().load(true)
        }
        return
      }

      switch (event.key) {
        case USER_STORE_KEY: {
          await useUserStore.persist.rehydrate()

          const nextUid = useUserStore.getState().user.uid
          const previousUid = previousUidRef.current
          previousUidRef.current = nextUid

          // 资料更新：uid 没变，不刷新 session
          if (nextUid === previousUid) {
            await useSettingStore.persist.rehydrate()
            break
          }

          // 登录 / 切换账号：0 → uid，或 uidA → uidB
          if (nextUid > 0) {
            useSessionStore.getState().hydrate('pending')
            await refreshSession({ writeUserStore: false })
            await useSettingStore.persist.rehydrate()
            break
          }

          // 退出登录 / 会话失效：uid → 0
          useSessionStore.getState().markAnonymous()
          resetUserScopedStores()
          break
        }
        case TASK_STORE_KEY:
          await useTaskStore.persist.rehydrate()
          break
        case SEARCH_STORE_KEY:
          await useSearchStore.persist.rehydrate()
          break
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return null
}
