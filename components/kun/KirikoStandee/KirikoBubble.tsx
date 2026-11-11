// components/kun/KirikoStandee/KirikoBubble.tsx
'use client'

import { memo } from 'react'

interface KirikoBubbleProps {
  text: string
  scale: number
  offsetTop: number
  offsetRight: number
  maxWidth: number
  minWidth: number
  minHeight: number
  textSize: number
  textColor: string
  lineHeight: number
  letterSpacing: number
  paddingX: number
  paddingY: number
  triangleSize: number
  triangleOffset: number
}

export const KirikoBubble = memo(
  ({ text, scale, ...props }: KirikoBubbleProps) => {
    return (
      <div
        className="absolute z-30"
        style={{
          top: props.offsetTop,
          right: props.offsetRight,
          maxWidth: props.maxWidth,
          minWidth: props.minWidth,
          minHeight: props.minHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top right'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative bg-white/90 rounded-2xl shadow-xl border border-white/20"
          style={{
            padding: `${props.paddingY}px ${props.paddingX}px`
          }}
        >
          <div
            className="absolute top-0 -translate-y-1/2 w-0 h-0 border-l-transparent border-r-transparent"
            style={{
              right: props.triangleOffset,
              borderWidth: `0 ${props.triangleSize}px ${props.triangleSize}px ${props.triangleSize}px`,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: 'rgba(255,255,255,0.9)'
            }}
          />
          <p
            className="leading-relaxed whitespace-pre-wrap break-words"
            style={{
              fontSize: props.textSize,
              color: props.textColor,
              lineHeight: props.lineHeight,
              letterSpacing: props.letterSpacing
            }}
          >
            {text}
          </p>
        </div>
      </div>
    )
  }
)

KirikoBubble.displayName = 'KirikoBubble'
