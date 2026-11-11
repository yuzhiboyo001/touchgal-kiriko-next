// components/kun/KirikoStandee/components/KirikoHeader.tsx

'use client'

import { memo } from 'react'
import { Sparkles } from 'lucide-react'

interface KirikoHeaderProps {
  name: string
  nameColor: string
  scale: number
  nameFontSize: number
  starSize: number
  dotSize: number
}

export const KirikoHeader = memo(
  ({
    name,
    nameColor,
    scale,
    nameFontSize,
    starSize,
    dotSize
  }: KirikoHeaderProps) => {
    return (
      <div
        className="absolute top-3 left-4 z-10 flex items-center gap-2"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          willChange: 'transform'
        }}
      >
        <Sparkles
          className={nameColor}
          style={{ width: starSize, height: starSize, opacity: 0.6 }}
        />
        <span
          className={`font-bold tracking-wide ${nameColor}`}
          style={{ fontSize: nameFontSize }}
        >
          {name}
        </span>
        <div className="ml-1 flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`rounded-full ${i === 0 ? nameColor : 'bg-white/10'}`}
              style={{ width: dotSize, height: dotSize }}
            />
          ))}
        </div>
      </div>
    )
  }
)

KirikoHeader.displayName = 'KirikoHeader'
