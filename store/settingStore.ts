import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { cookieStorage } from './_cookie'
import { broadcastStoreChange } from './crossTab'

export interface KunSettingData {
  kunNsfwEnable: string
  kunBlockedTagIds: number[]
}

interface StoreState {
  data: KunSettingData
  getData: () => KunSettingData
  setData: (data: KunSettingData) => void
  resetData: () => void
}

const initialState: KunSettingData = {
  kunNsfwEnable: 'sfw',
  kunBlockedTagIds: []
}

export const useSettingStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: initialState,
      getData: () => get().data,
      setData: (data: KunSettingData) => {
        set({ data })
        broadcastStoreChange('setting')
      },
      resetData: () => {
        set({ data: initialState })
        broadcastStoreChange('setting')
      }
    }),
    {
      name: 'kun-patch-setting-store',
      storage: createJSONStorage(() => cookieStorage),
      skipHydration: true
    }
  )
)
