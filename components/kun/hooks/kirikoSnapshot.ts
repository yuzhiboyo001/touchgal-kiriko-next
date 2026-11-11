'use client'

import {
  getKirikoSnapshot,
  type KirikoSnapshot
} from '~/components/kun/KirikoStandee/actions'

const CACHE_TTL_MS = 30_000

let cache: {
  uid: number
  value: KirikoSnapshot
  cachedAt: number
} | null = null

let inflight: {
  uid: number
  promise: Promise<KirikoSnapshot | null>
} | null = null

export const loadKirikoSnapshot = async (
  uid: number,
  force = false
): Promise<KirikoSnapshot | null> => {
  if (!uid) return null

  if (
    !force &&
    cache &&
    cache.uid === uid &&
    Date.now() - cache.cachedAt < CACHE_TTL_MS
  ) {
    return cache.value
  }

  if (inflight && inflight.uid === uid) {
    return inflight.promise
  }

  const promise = getKirikoSnapshot()
    .then((value) => {
      if (value && value.uid === uid) {
        cache = {
          uid,
          value,
          cachedAt: Date.now()
        }
      }
      return value
    })
    .finally(() => {
      if (inflight?.promise === promise) {
        inflight = null
      }
    })

  inflight = { uid, promise }
  return promise
}

export const updateCachedKirikoCoins = (uid: number, coins: number) => {
  if (cache?.uid === uid) {
    cache = {
      ...cache,
      value: { ...cache.value, coins },
      cachedAt: Date.now()
    }
  }
}

export const updateCachedKirikoCharacter = (
  uid: number,
  character: string,
  hasProfile = true
) => {
  if (cache?.uid === uid) {
    cache = {
      ...cache,
      value: { ...cache.value, character, hasProfile },
      cachedAt: Date.now()
    }
  }
}

export const invalidateKirikoSnapshot = () => {
  cache = null
  inflight = null
}
