// features/AchievementFeature/components/AchievementToast.tsx

'use client'

import { memo, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import type { Achievement } from '../config'

interface AchievementToastProps {
  achievement: Achievement
  onComplete: () => void
  duration?: number
}

export const AchievementToast = memo(
  ({ achievement, onComplete, duration = 6000 }: AchievementToastProps) => {
    const [show, setShow] = useState(false)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
      // ✅ 用 requestAnimationFrame 代替 setTimeout
      const raf = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(raf)
    }, [])

    const handleClose = useCallback(() => {
      setIsExiting(true)
      setTimeout(() => onComplete(), 250)
    }, [onComplete])

    return (
      <div
        className={`
          fixed inset-0 z-9999 flex items-center justify-center
          transition-opacity duration-300
          ${isExiting ? 'opacity-0' : 'opacity-100'}
        `}
      >
        {/* ✅ 背景遮罩 -用纯色 */}
        <div
          className={`
            absolute inset-0 bg-black/70
            transition-opacity duration-300
            ${show && !isExiting ? 'opacity-100' : 'opacity-0'}
          `}
          onClick={handleClose}
        />

        {/* 弹窗 */}
        <div
          className={`
            relative
            bg-linear-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20
            border border-amber-400/40 rounded-3xl
            px-10 py-8 min-w-100 max-w-[90vw]
            shadow-2xl shadow-amber-500/30
            transition-all duration-500 ease-out
            ${
              show && !isExiting
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-90 translate-y-4'
            }
          `}
          style={{
            // ✅ 使用 will-change 提示浏览器优化
            willChange: 'transform, opacity'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 顶部闪光装饰 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>

          {/* 标题 */}
          <div className="text-center mb-6">
            <div className="text-xs tracking-[0.3em] text-amber-400/80 font-ja-maru">
              ACHIEVEMENT UNLOCKED
            </div>
            <div className="text-sm text-amber-300/60 mt-1">✦ 成就解锁 ✦</div>
          </div>

          {/* 成就图标 */}
          <div className="relative w-36 h-36 mx-auto mb-6">
            {/* ✅ 去掉旋转光环，只保留一个静态光晕 */}
            <div
              className={`
                absolute -inset-1.5 rounded-full
                bg-linear-to-br ${achievement.gradient}
                opacity-40 blur-xl
              `}
              style={{ willChange: 'opacity' }}
            />
            {/* 图片 */}
            <div className="relative w-full h-full rounded-full overflow-hidden bg-linear-to-br from-amber-400/30 to-yellow-500/30 border-2 border-amber-400/50 shadow-2xl">
              <Image
                src={achievement.image}
                alt={achievement.name}
                width={144}
                height={144}
                className="w-full h-full object-cover"
                priority
                // ✅ 添加 sizes 优化加载
                sizes="144px"
              />
            </div>
          </div>

          {/* 日文名 */}
          <div className="text-center text-sm text-amber-400/70 font-ja-maru tracking-wider">
            {achievement.nameJp}
          </div>

          {/* 中文名 */}
          <div className="text-center text-2xl font-bold text-white mt-1.5">
            {achievement.name}
          </div>

          {/* 描述 */}
          <div className="text-center text-sm text-white/60 mt-3 leading-relaxed">
            {achievement.description}
          </div>

          {/* 装饰分隔线 */}
          <div className="flex items-center justify-center gap-3 my-5">
            <div className="h-px w-16 bg-linear-to-r from-transparent to-amber-400/40" />
            <span className="text-amber-400/40 text-xs">✦</span>
            <div className="h-px w-16 bg-linear-to-l from-transparent to-amber-400/40" />
          </div>

          {/* 确认按钮 */}
          <button
            onClick={handleClose}
            className="
              w-full py-3 rounded-2xl
              bg-linear-to-r from-amber-500 to-yellow-500
              hover:from-amber-400 hover:to-yellow-400
              text-white font-bold text-base
              shadow-lg shadow-amber-500/30
              transition-transform duration-200
              hover:scale-[1.02] active:scale-[0.98]
            "
          >
            太好了！
          </button>
        </div>
      </div>
    )
  }
)

AchievementToast.displayName = 'AchievementToast'
