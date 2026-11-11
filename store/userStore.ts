// store/userStore.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useSettingStore } from './settingStore'

export interface UserState {
  uid: number
  name: string
  avatar: string
  bio: string
  moemoepoint: number
  role: number
  coins: number
  dailyCheckIn: number
  dailyImageLimit: number
  dailyUploadLimit: number
  enableEmailNotice: boolean
  allowPrivateMessage: boolean
  blockedTagIds: number[]
  enableRedirect: boolean
  excludedDomains: string[]
  delaySeconds: number
}

export interface UserStore {
  user: UserState
  setUser: (user: UserState) => void
  logout: () => void

  // ✅ 只存数据：升级弹窗需要的 等级、好感度总值、以及是否显示
  levelUpToast: { show: boolean; level: number; total: number }
  setLevelUpToast: (data: {
    show: boolean
    level: number
    total: number
  }) => void // ✅ 纯设置数据
}

const initialUserStore: UserState = {
  uid: 0,
  name: '',
  avatar: '',
  bio: '',
  coins: 0,
  moemoepoint: 0,
  role: 1,
  dailyCheckIn: 0,
  dailyImageLimit: 0,
  dailyUploadLimit: 0,
  enableEmailNotice: false,
  allowPrivateMessage: true,
  blockedTagIds: [],
  enableRedirect: true,
  excludedDomains: [],
  delaySeconds: 5
}

const syncBlockedTagCache = (blockedTagIds: number[]) => {
  const { data, setData } = useSettingStore.getState()
  setData({ ...data, kunBlockedTagIds: blockedTagIds })
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: initialUserStore,
      setUser: (user: UserState) => {
        syncBlockedTagCache(user.blockedTagIds)
        set({ user })
      },
      logout: () => {
        syncBlockedTagCache([])
        set({ user: initialUserStore })
      },

      // ✅ 仅仅是纯数据状态
      levelUpToast: { show: false, level: 1, total: 0 },
      setLevelUpToast: (data) => set({ levelUpToast: data })
    }),
    {
      name: 'kun-patch-user-store',
      storage: createJSONStorage(() => window.localStorage)
    }
  )
)
