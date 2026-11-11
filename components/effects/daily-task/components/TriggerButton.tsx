// components/effects/daily-task/components/TriggerButton.tsx

'use client'

import { memo, useRef, useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { THEME, SIZES } from '../config'

interface TriggerButtonProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  completedCount: number
  totalTasks: number
  onMouseDown: (e: React.MouseEvent) => void
  innerRef: React.RefObject<HTMLButtonElement | null>
  isLoading?: boolean
}

export const TriggerButton = memo(
  ({
    isOpen,
    setIsOpen,
    completedCount,
    totalTasks,
    onMouseDown,
    innerRef,
    isLoading
  }: TriggerButtonProps) => {
    const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)
    // ✅ 用 ref 存储 isOpen，避免 useCallback 依赖变化
    const isOpenRef = useRef(isOpen)

    // ✅ 同步 ref
    isOpenRef.current = isOpen

    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        if (!mouseDownPosRef.current) return
        const dx = e.clientX - mouseDownPosRef.current.x
        const dy = e.clientY - mouseDownPosRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        mouseDownPosRef.current = null
        // ✅ 只有轻微移动才触发切换（真正的点击）
        if (distance < 5) {
          setIsOpen(!isOpenRef.current)
        }
      },
      [setIsOpen] // ✅ 只依赖 setIsOpen
    )

    // ✅ 使用 useMemo 缓存样式类
    const buttonClasses = `flex items-center ${SIZES.triggerGap} ${SIZES.triggerPadding} rounded-full ${THEME.triggerBtn} transition-all duration-150 shadow-lg cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-[0.98]`

    return (
      <button
        ref={innerRef}
        onMouseDown={(e) => {
          mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
          onMouseDown(e)
        }}
        onMouseUp={handleMouseUp}
        // ✅ 使用 useMemo 缓存的类名
        className={buttonClasses}
        style={{
          touchAction: 'none',
          // ✅ 添加硬件加速
          willChange: 'transform'
        }}
      >
        <span
          className={`${SIZES.triggerSize} font-ja-maru tracking-wider ${THEME.textTitle}`}
        >
          日課
        </span>
        {isOpen ? (
          <ChevronDown
            className={`${SIZES.triggerIconSize} ${THEME.textDesc}`}
          />
        ) : (
          <ChevronUp className={`${SIZES.triggerIconSize} ${THEME.textDesc}`} />
        )}
        <span className={`${SIZES.triggerProgressSize} ${THEME.textDesc}`}>
          {isLoading ? '...' : `${completedCount}/${totalTasks}`}
        </span>
      </button>
    )
  }
)

TriggerButton.displayName = 'TriggerButton'
