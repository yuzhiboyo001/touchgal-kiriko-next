// components/effects/daily-task/components/RewardFloat.tsx

'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Heart, Coins } from 'lucide-react'

export interface RewardItem {
  type: 'affection' | 'coins'
  amount: number
}

interface RewardFloatProps {
  rewards: RewardItem[]
  onComplete?: () => void
}

export const RewardFloat = ({ rewards, onComplete }: RewardFloatProps) => {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<'enter' | 'hold' | 'leave'>('enter')

  // 挂载 + 下一帧进入
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true)
      setPhase('hold')
    })

    return () => cancelAnimationFrame(raf)
  }, [])

  // 停留 2s 后上移消失
  useEffect(() => {
    if (phase !== 'hold') return
    const timer = setTimeout(() => {
      setPhase('leave')
      // 消失动画 600ms 后通知父组件卸载
      setTimeout(() => onComplete?.(), 600)
    }, 2000)
    return () => clearTimeout(timer)
  }, [phase, onComplete])

  if (!mounted || rewards.length === 0) return null

  return createPortal(
    <div
      className="fixed z-[100000] pointer-events-none select-none"
      style={{ left: '24px', top: '50%', transform: 'translateY(-50%)' }}
    >
      <div className="flex flex-col gap-2">
        {rewards.map((reward, i) => {
          const isEnter = phase === 'enter'
          const isLeave = phase === 'leave'
          const isAffection = reward.type === 'affection'

          return (
            <div
              key={`${reward.type}-${i}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg ${
                isAffection
                  ? 'bg-pink-600/90 border border-pink-300/50 text-white'
                  : 'bg-amber-400/95 border border-amber-200/70 text-amber-950'
              }`}
              style={{
                // 初始：从左侧外滑入；hold：原地；leave：上移消失
                transform: isEnter
                  ? 'translateX(-60px) translateY(0)'
                  : isLeave
                    ? 'translateX(0) translateY(-80px)'
                    : 'translateX(0) translateY(0)',
                opacity: isEnter || isLeave ? 0 : 1,
                transition: 'all 0.5s ease-out',
                transitionDelay: `${i * 80}ms`
              }}
            >
              {isAffection ? (
                <Heart className="w-4 h-4" />
              ) : (
                <Coins className="w-4 h-4" />
              )}
              <span>+{reward.amount}</span>
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  )
}
