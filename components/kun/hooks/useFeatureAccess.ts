'use client'

import { useEffect } from 'react'
import { useFeatureAccessStore } from '~/store/featureAccessStore'

export const useFeatureAccess = () => {
  const capabilities = useFeatureAccessStore((state) => state.capabilities)
  const load = useFeatureAccessStore((state) => state.load)

  useEffect(() => {
    void load()
  }, [load])

  return capabilities
}
