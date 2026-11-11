// components/effects/daily-task/TaskCompleteToast.tsx
'use client'

import { useEffect, useRef, useState, memo } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles } from 'lucide-react'

interface TaskCompleteToastProps {
  taskName: string
  reward?: string
  onComplete?: () => void
}

export const TaskCompleteToast = memo(
  ({ taskName, onComplete }: TaskCompleteToastProps) => {
    const [show, setShow] = useState(true)
    const [mounted, setMounted] = useState(false)

    const onCompleteRef = useRef(onComplete)
    onCompleteRef.current = onComplete

    // ✅ 内层 timer 用 ref，只在真正卸载时清
    const innerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      setMounted(true)
    }, [])

    useEffect(() => {
      if (!show) return
      const timer = setTimeout(() => {
        setShow(false)
        // ✅ 内层 timer 存进 ref，不在本 effect 的 cleanup 里清
        innerTimerRef.current = setTimeout(() => onCompleteRef.current?.(), 300)
      }, 3850)

      return () => clearTimeout(timer) // ✅ 只清外层
    }, [show])

    // ✅ 只在真正卸载时清内层 timer
    useEffect(() => {
      return () => {
        if (innerTimerRef.current) {
          clearTimeout(innerTimerRef.current)
          innerTimerRef.current = null
        }
      }
    }, [])

    if (!mounted || !show) return null

    return createPortal(
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-99999 pointer-events-none animate-toast-in">
        <div className="pointer-events-auto bg-linear-to-br from-pink-500/20 via-purple-500/20 to-rose-500/20 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-6 shadow-2xl shadow-rose-500/20 min-w-95 max-w-[90vw]">
          <div className="flex items-start gap-5">
            <div className="shrink-0 mt-0.5">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-pink-400/30 to-rose-400/30 flex items-center justify-center border border-white/15">
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-base tracking-wider">
                  委托完成
                </span>
                <span className="text-[11px] text-white/80 bg-white/20 px-2.5 py-0.5 rounded-full">
                  日課
                </span>
              </div>
              <p className="text-white/95 text-base mt-1 font-ja font-medium truncate">
                {taskName}
              </p>
              <p className="text-pink-400/90 text-sm mt-1 font-medium">
                请前往「日課」面板领取奖励
              </p>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-xs text-pink-400/70 font-ja-maru">
                ✦ 絆 ✦
              </div>
            </div>
          </div>

          <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-pink-400 to-rose-400 rounded-full animate-progress-shrink"
              style={{ animationDuration: '4s' }}
            />
          </div>
        </div>

        <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-in {
          animation: toast-in 0.3s ease-out forwards;
        }
        .animate-progress-shrink {
          animation: progress-shrink 4s linear forwards;
        }
      `}</style>
      </div>,
      document.body
    )
  }
)

TaskCompleteToast.displayName = 'TaskCompleteToast'
