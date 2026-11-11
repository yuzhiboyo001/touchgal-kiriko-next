// components/kun/hooks/useHeartEffect.ts

'use client'

import { useState, useCallback, useRef } from 'react'

interface Heart {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  opacity: number
  speed: number
  driftX: number
}

export const useHeartEffect = () => {
  const [hearts, setHearts] = useState<Heart[]>([])
  const idCounterRef = useRef(0)

  const triggerHearts = useCallback((count: number = 5) => {
    const newHearts: Heart[] = Array.from({ length: count }, () => ({
      id: idCounterRef.current++,
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 70,
      size: 12 + Math.random() * 33,
      rotation: Math.random() * 360,
      opacity: 0.3 + Math.random() * 0.4,
      speed: 0.5 + Math.random() * 0.8,
      driftX: (Math.random() - 0.5) * 60
    }))

    setHearts((prev) => [...prev, ...newHearts])

    setTimeout(() => {
      setHearts((prev) =>
        prev.filter((h) => !newHearts.some((nh) => nh.id === h.id))
      )
    }, 1800)
  }, [])

  return { hearts, triggerHearts }
}
