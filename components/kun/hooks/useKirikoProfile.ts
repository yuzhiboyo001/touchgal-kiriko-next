// components/kun/hooks/useKirikoProfile.ts
// 查库失败时静默重试一次；仍失败则弹选择框（避免空白死路）

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useUserStore } from '~/store/userStore'
import { selectKirikoCharacter } from '~/components/kun/KirikoStandee/actions'
import {
  loadKirikoSnapshot,
  updateCachedKirikoCharacter
} from '~/components/kun/hooks/kirikoSnapshot'

const CACHE_KEY = 'kiriko_profile_cache'
const CACHE_VERSION = 2
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const PROFILE_TIMEOUT_MS = 5000
const MAX_RETRY = 1
const RETRY_DELAY = 800
const ALLOWED_CHARACTERS = new Set(['rin', 'sayo', 'shunv'])

interface ProfileCache {
  version: number
  uid: number
  character: string
  hasProfile: boolean
  cachedAt: number
}

const readProfileCache = (uid: number): ProfileCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const cache = JSON.parse(raw) as ProfileCache
    if (
      cache?.version !== CACHE_VERSION ||
      cache?.uid !== uid ||
      cache?.hasProfile !== true ||
      !ALLOWED_CHARACTERS.has(cache.character) ||
      typeof cache.cachedAt !== 'number' ||
      Date.now() - cache.cachedAt > CACHE_TTL_MS
    ) {
      return null
    }

    return cache
  } catch {
    return null
  }
}

const writeProfileCache = (cache: ProfileCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // 隐私模式/存储配额满时忽略
  }
}

const clearProfileCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem('kiriko_has_profile')
    localStorage.removeItem('kiriko_character')
    localStorage.removeItem('kiriko_user_id')
  } catch {
    // ignore
  }
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('profile timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })

export const useKirikoProfile = (defaultCharacter: string = 'shunv') => {
  const user = useUserStore((state) => state.user)
  const isLoggedIn = user.uid !== 0 && !!user.name

  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState(defaultCharacter)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 防止并发 checkProfile 互相覆盖状态
  const checkingRef = useRef(false)

  const checkProfile = useCallback(async () => {
    if (!isLoggedIn) {
      setHasProfile(false)
      setShowSelectModal(false)
      setSelectedCharacter(defaultCharacter)
      return
    }

    if (checkingRef.current) return
    checkingRef.current = true

    try {
      const cached = readProfileCache(user.uid)
      if (cached) {
        setHasProfile(true)
        setSelectedCharacter(cached.character)
        setShowSelectModal(false)
        return
      }

      const fetchProfile = async () => {
        try {
          const result = await withTimeout(
            loadKirikoSnapshot(user.uid),
            PROFILE_TIMEOUT_MS
          )
          return { ok: true as const, result }
        } catch (error) {
          return { ok: false as const, error }
        }
      }

      let attempt = 0
      let lastError: unknown = null

      while (attempt <= MAX_RETRY) {
        const res = await fetchProfile()

        if (res.ok) {
          const result = res.result
          if (result?.hasProfile && result.character) {
            const character = ALLOWED_CHARACTERS.has(result.character)
              ? result.character
              : 'rin'

            setHasProfile(true)
            setSelectedCharacter(character)
            setShowSelectModal(false)
            writeProfileCache({
              version: CACHE_VERSION,
              uid: user.uid,
              character,
              hasProfile: true,
              cachedAt: Date.now()
            })
          } else {
            setHasProfile(false)
            setShowSelectModal(true)
            clearProfileCache()
          }
          return
        }

        lastError = res.error
        attempt++
        if (attempt <= MAX_RETRY) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY))
        }
      }

      // 超时/失败：给用户选择入口，不返回空组件
      console.error('检查角色失败（已重试）:', lastError)
      setHasProfile(false)
      setShowSelectModal(true)
    } finally {
      checkingRef.current = false
    }
  }, [isLoggedIn, user.uid, defaultCharacter])

  const selectCharacter = useCallback(
    async (characterId: string) => {
      if (!user) return

      setIsLoading(true)
      try {
        const result = await selectKirikoCharacter(characterId)
        if (result.success) {
          const character = ALLOWED_CHARACTERS.has(characterId)
            ? characterId
            : 'rin'

          setSelectedCharacter(character)
          setHasProfile(true)
          setShowSelectModal(false)
          updateCachedKirikoCharacter(user.uid, character)
          writeProfileCache({
            version: CACHE_VERSION,
            uid: user.uid,
            character,
            hasProfile: true,
            cachedAt: Date.now()
          })
        }
      } catch (error) {
        console.error('选择角色失败:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [user]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkProfile()
    }, 0)

    return () => clearTimeout(timer)
  }, [user, checkProfile])

  return {
    hasProfile,
    selectedCharacter,
    showSelectModal,
    isLoading,
    selectCharacter,
    setShowSelectModal,
    refetch: checkProfile
  }
}
