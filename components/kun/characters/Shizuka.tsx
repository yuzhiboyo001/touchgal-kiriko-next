'use client'

import { useState } from 'react'
import { useStandee } from '../hooks/useStandee'
import { KirikoBase } from '../KirikoStandee/KirikoBase'
import {
  CHARACTER_CONFIGS,
  BASE_WIDTH,
  BASE_HEIGHT,
  MIN_SCALE,
  MAX_SCALE,
  DEFAULT_SCALE
} from '../KirikoStandee/config'
import type { StandeeProps } from '../KirikoStandee/types'

export const Shizuka = (props: StandeeProps) => {
  const [imageError, setImageError] = useState(false)
  const config = CHARACTER_CONFIGS.shunv

  const state = useStandee({
    position: props.position || 'right',
    defaultX: props.defaultX,
    defaultY: props.defaultY,
    defaultScale: props.defaultScale || DEFAULT_SCALE,
    minScale: props.minScale || MIN_SCALE,
    maxScale: props.maxScale || MAX_SCALE,
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT
  })

  return (
    <KirikoBase
      config={config}
      {...state}
      imageError={imageError}
      setImageError={setImageError}
    />
  )
}
