// components/kun/hooks/useAffection.ts

'use client'

import { useState, useCallback } from 'react'

interface AffectionFeedbackState {
  show: boolean
  gained: number
  total: number
  leveledUp: boolean
  newLevel: number
  actionLabel?: string
}

interface ShowAffectionFeedbackInput {
  gained: number
  total: number
  leveledUp?: boolean
  newLevel?: number
  actionLabel?: string
}

export const useAffection = () => {
  const [feedback, setFeedback] = useState<AffectionFeedbackState>({
    show: false,
    gained: 0,
    total: 0,
    leveledUp: false,
    newLevel: 1
  })

  // ✅ 新解锁的成就
  const [newAchievements, setNewAchievements] = useState<string[]>([])

  /**
   * 只负责展示结果，不再调用服务端加好感度。
   * 服务端已经在 purchaseItems / 任务事务里完成加值，这里重复调用会导致双倍好感度。
   */
  const showAffectionFeedback = useCallback(
    ({
      gained,
      total,
      leveledUp = false,
      newLevel = 1,
      actionLabel
    }: ShowAffectionFeedbackInput) => {
      if (gained <= 0) return

      setFeedback({
        show: true,
        gained,
        total,
        leveledUp,
        newLevel,
        actionLabel
      })
    },
    []
  )

  const closeFeedback = useCallback(() => {
    setFeedback((prev) => ({ ...prev, show: false }))
  }, [])

  // ✅ 新增：手动添加成就（供 useShop 收集 purchaseItems 的成就）
  const addNewAchievements = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return
    setNewAchievements((prev) => [...prev, ...ids])
  }, [])

  // ✅ 清空成就
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([])
  }, [])

  return {
    feedback,
    showAffectionFeedback,
    closeFeedback,
    newAchievements,
    addNewAchievements,
    clearNewAchievements
  }
}
