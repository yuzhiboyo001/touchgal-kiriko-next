import { create } from 'zustand'

export type KirikoCharacter = 'rin' | 'sayo' | 'shunv'

const PROFILE_CACHE_KEY = 'kiriko_profile_cache'
const PROFILE_CACHE_VERSION = 2
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CHARACTERS = new Set<KirikoCharacter>(['rin', 'sayo', 'shunv'])

interface KirikoUiState {
  isOpen: boolean
  character: KirikoCharacter | null
  setCharacter: (character: KirikoCharacter) => void
  clearCharacter: () => void
  reset: () => void
  hydrateCharacter: (uid: number) => void
  open: () => void
  close: () => void
}

export const useKirikoUiStore = create<KirikoUiState>((set) => ({
  isOpen: false,
  // Do not default to a character. The bottom nav would otherwise flash 静香
  // on every refresh before the cached profile is read.
  character: null,
  setCharacter: (character) => set({ character }),
  clearCharacter: () => set({ character: null }),
  reset: () => set({ isOpen: false, character: null }),
  hydrateCharacter: (uid) => {
    if (uid <= 0 || typeof window === 'undefined') return

    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY)
      if (!raw) return

      const cache = JSON.parse(raw) as {
        version?: number
        uid?: number
        character?: string
        hasProfile?: boolean
        cachedAt?: number
      }

      if (
        cache.version !== PROFILE_CACHE_VERSION ||
        cache.uid !== uid ||
        cache.hasProfile !== true ||
        !CHARACTERS.has(cache.character as KirikoCharacter) ||
        typeof cache.cachedAt !== 'number' ||
        Date.now() - cache.cachedAt > CACHE_TTL_MS
      ) {
        return
      }

      set({ character: cache.character as KirikoCharacter })
    } catch {
      // 隐私模式或损坏的缓存忽略即可，后续由 profile 请求补正。
    }
  },
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false })
}))
