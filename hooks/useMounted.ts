import { useSyncExternalStore } from 'react'

const subscribe = () => () => undefined

export const useMounted = () => {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
