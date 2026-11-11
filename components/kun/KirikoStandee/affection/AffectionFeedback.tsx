// components/kun/KirikoStandee/affection/AffectionFeedback.tsx

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AffectionFeedbackProps {
  isOpen: boolean
  gained?: number
  total?: number
  leveledUp?: boolean
  isTaskComplete?: boolean
  newLevel?: number
  actionLabel?: string
  onComplete?: () => void
}

export const AffectionFeedback = ({
  isOpen,
  gained = 0,
  total = 0,
  leveledUp = false,
  newLevel = 1,
  actionLabel,
  onComplete
}: AffectionFeedbackProps) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const showTimer = setTimeout(() => setShow(true), 0)
    const timer = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, 4000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(timer)
    }
  }, [isOpen, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-200 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-linear-to-b from-background/98 via-background/95 to-background/98
              backdrop-blur-xl rounded-2xl border border-white/15
              p-8 text-center pointer-events-auto min-w-70 max-w-[90vw]
              shadow-[0_0_60px_rgba(236,72,153,0.08)]"
          >
            {/* 和风装饰线 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-linear-to-r from-transparent via-pink-400/50 to-transparent" />

            {/* 背景爱心 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-[150px] text-pink-400/15 select-none"
              >
                ❤️
              </motion.div>
            </div>

            {/* 数值 / 标题 */}
            <div className="relative flex flex-col items-center">
              {leveledUp ? (
                <>
                  {/* ✅ 升级时：显示 Lv.X */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', delay: 0.15, damping: 15 }}
                    className="text-5xl font-bold bg-linear-to-r from-pink-300 via-pink-400 to-rose-400 bg-clip-text text-transparent tracking-wider"
                  >
                    Lv.{newLevel}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-sm text-pink-400/70 font-ja tracking-wider mt-1"
                  >
                    ✦ 等级提升 ✦
                  </motion.div>
                </>
              ) : (
                <>
                  {/* ✅ 普通加好感度时：显示 +X */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', delay: 0.15, damping: 15 }}
                    className="text-5xl font-bold bg-linear-to-r from-pink-300 via-pink-400 to-rose-400 bg-clip-text text-transparent"
                  >
                    {gained}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-sm text-pink-400/70 font-ja tracking-wider mt-0.5"
                  >
                    好感度↑
                  </motion.div>
                </>
              )}
            </div>

            {/* 行为描述 */}
            {actionLabel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative text-sm text-foreground/70 font-ja tracking-wider mt-3"
              >
                {actionLabel}
              </motion.div>
            )}

            {/* 分割线 */}
            <div className="relative flex items-center justify-center gap-3 my-3">
              <div className="w-12 h-px bg-linear-to-r from-transparent to-pink-400/30" />
              <span className="text-[10px] text-pink-400/40 font-ja tracking-widest">
                ❀ 絆 ❀
              </span>
              <div className="w-12 h-px bg-linear-to-l from-transparent to-pink-400/30" />
            </div>

            {/* 当前好感度 + 等级 */}
            <div className="relative flex items-center justify-center gap-4 text-sm">
              <span className="text-foreground/50 font-ja tracking-wider">
                好感度{' '}
                <span className="text-foreground/80 font-medium">{total}</span>
              </span>
              <span className="text-foreground/30">|</span>
              <span className="text-foreground/50 font-ja tracking-wider">
                Lv.
                <span className="text-foreground/80 font-medium">
                  {newLevel}
                </span>
              </span>
            </div>

            {/* 等级提升标签 */}
            {leveledUp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="relative mt-4 px-4 py-1.5 rounded-full
                  bg-linear-to-r from-pink-500/25 to-rose-500/25
                  border border-pink-400/40 inline-block"
              >
                <span className="text-xs font-bold text-pink-400 font-ja tracking-wider">
                  ✦ レベルアップ ✦
                </span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
