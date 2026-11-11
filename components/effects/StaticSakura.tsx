'use client'

import { useState, useEffect } from 'react'

interface StaticSakuraProps {
  count?: number
  minSize?: number
  maxSize?: number
  minOpacity?: number
  maxOpacity?: number
  color?: string
  maxAttempts?: number
  minDistance?: number
  showWashi?: boolean
  showGlow?: boolean
  showFrame?: boolean
  showTexture?: boolean
  opacity?: number
}

export const StaticSakura = ({
  count = 24,
  minSize = 30,
  maxSize = 100,
  minOpacity = 0.08,
  maxOpacity = 0.2,
  color = '#ffb7c5',
  maxAttempts = 50,
  minDistance = 6,
  showWashi = true,
  showGlow = true,
  showFrame = true,
  showTexture = true,
  opacity = 0.08
}: StaticSakuraProps) => {
  const [sakuraList, setSakuraList] = useState<
    Array<{
      id: number
      size: number
      opacity: number
      rotation: number
      top: number
      left: number
    }>
  >([])

  useEffect(() => {
    const isMobile = window.innerWidth < 640
    const targetCount = isMobile ? Math.min(count, 15) : count

    const cols = Math.ceil(Math.sqrt(targetCount * (isMobile ? 0.6 : 1.5)))
    const rows = Math.ceil(targetCount / cols)

    const cellWidth = 100 / cols
    const cellHeight = 100 / rows

    // ✅ 修复了这里的 TS 类型报错
    const list: (typeof sakuraList)[number][] = []
    let id = 0

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (id >= targetCount) break

        const paddingX = cellWidth * 0.2
        const paddingY = cellHeight * 0.2

        const left =
          c * cellWidth + paddingX + Math.random() * (cellWidth - paddingX * 2)
        const top =
          r * cellHeight +
          paddingY +
          Math.random() * (cellHeight - paddingY * 2)

        const size = Math.random() * (maxSize - minSize) + minSize
        const op = Math.random() * (maxOpacity - minOpacity) + minOpacity
        const rotation = Math.random() * 360 - 180

        list.push({
          id: id++,
          size,
          opacity: op,
          rotation,
          top,
          left
        })
      }
    }

    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }

    const timer = setTimeout(() => {
      setSakuraList(list)
    }, 0)

    return () => clearTimeout(timer)
  }, [count, minSize, maxSize, minOpacity, maxOpacity])
  if (sakuraList.length === 0) return null

  return (
    <>
      {/* ===== 整体边框 ===== */}
      {showFrame && (
        <div
          className="fixed inset-0 pointer-events-none select-none z-0"
          style={{
            border:
              '2px solid var(--gal-border-color, rgba(200, 180, 180, 0.12))',
            borderRadius: '16px',
            boxShadow: `
              inset 0 0 40px rgba(200, 180, 180, 0.04),
              0 0 40px rgba(200, 180, 180, 0.03)
            `,
            margin: '12px',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* ===== 游戏纹理 ===== */}
      {showTexture && (
        <div
          className="fixed inset-0 pointer-events-none select-none z-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 60px,
                var(--gal-texture-color, rgba(200, 180, 180, 0.015)) 60px,
                var(--gal-texture-color, rgba(200, 180, 180, 0.015)) 61px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 80px,
                var(--gal-texture-color, rgba(200, 180, 180, 0.01)) 80px,
                var(--gal-texture-color, rgba(200, 180, 180, 0.01)) 81px
              ),
              url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")
            `,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* ===== 和纸纹理 ===== */}
      {showWashi && (
        <div
          className="fixed inset-0 pointer-events-none select-none z-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 40px,
                rgba(200, 180, 180, ${opacity * 0.5}) 40px,
                rgba(200, 180, 180, ${opacity * 0.5}) 41px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 60px,
                rgba(200, 180, 180, ${opacity * 0.3}) 60px,
                rgba(200, 180, 180, ${opacity * 0.3}) 61px
              )
            `
          }}
        />
      )}

      {/* ===== 光晕 ===== */}
      {showGlow && (
        <>
          <div
            className="fixed pointer-events-none select-none z-0"
            style={{
              top: '-20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '40%',
              background: `radial-gradient(ellipse, var(--gal-glow-color, rgba(255, 200, 210, 0.08)) 0%, transparent 70%)`,
              borderRadius: '50%'
            }}
          />
          <div
            className="fixed pointer-events-none select-none z-0"
            style={{
              bottom: '-20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '30%',
              background: `radial-gradient(ellipse, var(--gal-glow-color, rgba(255, 180, 200, 0.05)) 0%, transparent 70%)`,
              borderRadius: '50%'
            }}
          />
        </>
      )}

      {/* ===== 樱花 ===== */}
      {sakuraList.map((s) => (
        <span
          key={s.id}
          className="fixed pointer-events-none select-none z-0"
          style={{
            fontSize: `${s.size}px`,
            opacity: s.opacity,
            top: `${s.top}%`,
            left: `${s.left}%`,
            transform: `rotate(${s.rotation}deg)`,
            color: color
          }}
        >
          🌸
        </span>
      ))}
    </>
  )
}
