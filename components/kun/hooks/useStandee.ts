// components/kun/hooks/useStandee.ts

import { useState, useRef, useEffect } from 'react'

interface UseStandeeOptions {
  position: 'left' | 'right'
  defaultX?: number
  defaultY?: number
  defaultScale: number
  minScale: number
  maxScale: number
  baseWidth: number
  baseHeight: number
}

const readStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // 隐私模式/存储配额满时忽略
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max))

export const useStandee = ({
  position,
  defaultX,
  defaultY,
  defaultScale,
  minScale,
  maxScale,
  baseWidth,
  baseHeight
}: UseStandeeOptions) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(defaultScale)
  const [hovered, setHovered] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef({ x: 0, y: 0 })

  const scaledWidth = Math.round(baseWidth * scale)
  const scaledHeight = Math.round(baseHeight * scale)

  const clampPosition = (x: number, y: number) => ({
    x: clamp(x, 0, window.innerWidth - scaledWidth),
    y: clamp(y, 0, window.innerHeight - scaledHeight)
  })

  // 初始化
  useEffect(() => {
    if (typeof window === 'undefined') return

    const timer = setTimeout(() => {
      const savedPos = readStorage(`kiriko-${position}-pos`)
      const savedScale = readStorage(`kiriko-${position}-scale`)
      const savedVisible = readStorage(`kiriko-${position}-visible`)

      if (savedPos) {
        try {
          const parsed = JSON.parse(savedPos) as { x?: unknown; y?: unknown }
          if (
            typeof parsed?.x === 'number' &&
            Number.isFinite(parsed.x) &&
            typeof parsed?.y === 'number' &&
            Number.isFinite(parsed.y)
          ) {
            setPos(clampPosition(parsed.x, parsed.y))
          }
        } catch {
          // 损坏的位置缓存直接忽略
        }
      } else if (defaultX !== undefined && defaultY !== undefined) {
        setPos(clampPosition(defaultX, defaultY))
      } else {
        const x =
          position === 'left'
            ? 20
            : window.innerWidth - baseWidth * defaultScale - 20
        // PC 端默认放在左侧空白区域，并垂直居中
        const y = Math.max(
          20,
          (window.innerHeight - baseHeight * defaultScale) / 2
        )
        setPos(clampPosition(x, y))
      }

      if (savedScale) {
        const parsedScale = Number.parseFloat(savedScale)
        if (Number.isFinite(parsedScale)) {
          setScale(clamp(parsedScale, minScale, maxScale))
        }
      }
      if (savedVisible !== null) setIsVisible(savedVisible === 'true')
    }, 0)

    return () => clearTimeout(timer)
  }, [position, defaultX, defaultY, defaultScale, minScale, maxScale])

  // 保存
  useEffect(() => {
    if (pos.x !== 0 || pos.y !== 0) {
      writeStorage(`kiriko-${position}-pos`, JSON.stringify(pos))
    }
    writeStorage(`kiriko-${position}-scale`, String(scale))
    writeStorage(`kiriko-${position}-visible`, String(isVisible))
  }, [pos, position, scale, isVisible])

  // 窗口变化时把看板娘拉回可视区域
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => clampPosition(prev.x, prev.y))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [scaledWidth, scaledHeight])

  // 滚轮缩放
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!dragRef.current) return
      const rect = dragRef.current.getBoundingClientRect()
      const isHovering =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      if (!isHovering) return

      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      setScale((prev) => {
        const newScale = Math.min(Math.max(prev + delta, minScale), maxScale)
        return Math.round(newScale * 100) / 100
      })
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [minScale, maxScale])

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.close-btn')) return
    if (target.closest('.func-btn')) return
    setIsDragging(true)
    const rect = dragRef.current?.getBoundingClientRect()
    if (rect) {
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      setPos(
        clampPosition(
          e.clientX - offsetRef.current.x,
          e.clientY - offsetRef.current.y
        )
      )
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, scaledWidth, scaledHeight])

  return {
    isVisible,
    setIsVisible,
    isDragging,
    pos,
    scale,
    scaledWidth,
    scaledHeight,
    hovered,
    setHovered,
    dragRef,
    handleMouseDown
  }
}
