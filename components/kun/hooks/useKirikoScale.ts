// components/kun/hooks/useKirikoScale.ts

'use client'

import { useMemo } from 'react'

export const useKirikoScale = (scale: number) => {
  const nameFontSize = useMemo(
    () => Math.max(27, Math.min(36, 28 * scale)),
    [scale]
  )

  const starSize = useMemo(
    () => Math.max(27, Math.min(54, 27 * scale)),
    [scale]
  )

  const dotSize = useMemo(() => Math.max(4, Math.min(10, 8 * scale)), [scale])

  const bubbleParams = useMemo(
    () => ({
      offsetTop: 20,
      offsetRight: 10,
      maxWidth: 300,
      minWidth: 200,
      minHeight: 80,
      textSize: 25,
      textColor: '#1f2937',
      lineHeight: 1.8,
      letterSpacing: 0.5,
      paddingX: 20,
      paddingY: 16,
      triangleSize: 5,
      triangleOffset: 10,
      scale
    }),
    [scale]
  )

  return { nameFontSize, starSize, dotSize, bubbleParams }
}
