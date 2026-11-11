// components/effects/daily-task/hooks/useDraggable.ts
'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

interface Position {
  x: number
  y: number
}

// ===== 节流函数（修复类型） =====
const throttle = <T extends (...args: number[]) => void>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }) as (...args: Parameters<T>) => void
}

export const useDraggable = (initialPosition?: Position) => {
  const defaultPosition = useMemo(() => {
    if (initialPosition) return initialPosition
    if (typeof window !== 'undefined') {
      return {
        x: window.innerWidth - 320,
        y: 100
      }
    }
    return { x: 0, y: 100 }
  }, [initialPosition])

  const [position, setPosition] = useState<Position>(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingTrigger, setIsDraggingTrigger] = useState(false)

  const dragRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const dragTargetRef = useRef<'panel' | 'trigger' | null>(null)
  const rafRef = useRef<number | null>(null)

  // ===== 节流更新位置 =====
  const throttledSetPosition = useMemo(
    () =>
      throttle((newX: number, newY: number) => {
        setPosition({ x: newX, y: newY })
      }, 16),
    []
  )

  // ===== 边界计算 =====
  const getBounds = useCallback((element: HTMLElement | null) => {
    if (!element)
      return { maxX: window.innerWidth - 200, maxY: window.innerHeight - 100 }
    const rect = element.getBoundingClientRect()
    return {
      maxX: Math.max(window.innerWidth - rect.width - 20, 0),
      maxY: Math.max(window.innerHeight - rect.height - 20, 0)
    }
  }, [])

  // ===== 面板拖动 =====
  const handlePanelMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.no-drag')) return

    dragTargetRef.current = 'panel'
    setIsDragging(true)
    const rect = dragRef.current?.getBoundingClientRect()
    if (rect) {
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
  }, [])

  // ===== 触发按钮拖动 =====
  const handleTriggerMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dragTargetRef.current = 'trigger'
    setIsDraggingTrigger(true)
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
  }, [])

  // ===== 使用 requestAnimationFrame 优化拖拽动画 =====
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isDraggingTrigger) return

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      rafRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - offsetRef.current.x
        const newY = e.clientY - offsetRef.current.y

        const targetElement =
          dragTargetRef.current === 'panel'
            ? dragRef.current
            : triggerRef.current

        const { maxX, maxY } = getBounds(targetElement)

        throttledSetPosition(
          Math.min(Math.max(newX, 0), maxX),
          Math.min(Math.max(newY, 0), maxY)
        )
      })
    }

    const handleMouseUp = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      setIsDragging(false)
      setIsDraggingTrigger(false)
      dragTargetRef.current = null
    }

    if (isDragging || isDraggingTrigger) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      window.addEventListener('mouseup', handleMouseUp, { passive: true })
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isDragging, isDraggingTrigger, getBounds, throttledSetPosition])

  // ===== 窗口变化时调整位置（防抖） =====
  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const targetRect = dragRef.current?.getBoundingClientRect()
        if (targetRect) {
          const { maxX, maxY } = getBounds(dragRef.current)
          setPosition((prev) => ({
            x: Math.min(Math.max(prev.x, 0), maxX),
            y: Math.min(Math.max(prev.y, 0), maxY)
          }))
        }
      }, 100)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [getBounds])

  return {
    position,
    isDragging,
    isDraggingTrigger,
    dragRef,
    triggerRef,
    handlePanelMouseDown,
    handleTriggerMouseDown
  }
}
