import { create } from 'zustand'
import type { FeatureCapabilities } from '~/types/api/session'

const CACHE_TTL_MS = 30_000

const DEFAULT_CAPABILITIES: FeatureCapabilities = {
  canPublishResource: false,
  canUseDlsiteImport: false
}

interface FeatureAccessStore {
  capabilities: FeatureCapabilities
  loadedAt: number | null
  load: (force?: boolean) => Promise<void>
  reset: () => void
}

let inFlight: Promise<void> | null = null
let requestId = 0

export const useFeatureAccessStore = create<FeatureAccessStore>((set, get) => ({
  capabilities: DEFAULT_CAPABILITIES,
  loadedAt: null,

  load: async (force = false) => {
    const { loadedAt } = get()
    if (!force && loadedAt && Date.now() - loadedAt < CACHE_TTL_MS) {
      return
    }
    if (inFlight) {
      return inFlight
    }

    const currentRequestId = ++requestId

    inFlight = (async () => {
      try {
        const res = await fetch('/api/feature-access', {
          cache: 'no-store'
        })
        const data = await res.json()
        if (currentRequestId !== requestId || !data?.success) {
          return
        }
        set({
          capabilities: {
            canPublishResource: data.data?.publishResource === true,
            canUseDlsiteImport: data.data?.dlsiteImport === true
          },
          loadedAt: Date.now()
        })
      } catch {
        // 读取失败保持关闭，避免误显示高风险按钮
      } finally {
        if (currentRequestId === requestId) {
          inFlight = null
        }
      }
    })()

    return inFlight
  },

  reset: () => {
    requestId += 1
    inFlight = null
    set({ capabilities: DEFAULT_CAPABILITIES, loadedAt: null })
  }
}))
