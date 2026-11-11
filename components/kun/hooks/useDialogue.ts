// components/kun/hooks/useDialogue.ts

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  getRandomDialogue,
  getRandomShopDialogue
} from '../KirikoStandee/constants/dialogues'
import type { StandeeConfig } from '../KirikoStandee/types'

interface UseDialogueOptions {
  onHeartEffect?: () => void
}

export const useDialogue = (
  config: StandeeConfig,
  options?: UseDialogueOptions
) => {
  const [showDialogue, setShowDialogue] = useState(false)
  const [dialogueText, setDialogueText] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const clearDialogueTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const showDialogueWithText = useCallback(
    (text: string, duration: number = 5000) => {
      clearDialogueTimer()
      setShowDialogue(false)

      // ✅ 触发爱心效果
      options?.onHeartEffect?.()

      const timer = setTimeout(() => {
        setDialogueText(text)
        setShowDialogue(true)

        timerRef.current = setTimeout(() => {
          setShowDialogue(false)
          timerRef.current = null
        }, duration)
      }, 50)

      timerRef.current = timer
    },
    [clearDialogueTimer, options]
  )

  const showRandomDialogue = useCallback(() => {
    const text = getRandomDialogue(config)
    showDialogueWithText(text, 5000)
  }, [config, showDialogueWithText])

  const showShopDialogue = useCallback(() => {
    const text = getRandomShopDialogue()
    showDialogueWithText(text, 4000)
  }, [showDialogueWithText])

  useEffect(() => {
    return () => {
      clearDialogueTimer()
    }
  }, [clearDialogueTimer])

  return {
    showDialogue,
    dialogueText,
    showRandomDialogue,
    showShopDialogue,
    clearDialogueTimer
  }
}
