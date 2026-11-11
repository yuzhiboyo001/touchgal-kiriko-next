// features/AchievementFeature/components/AchievementCard.tsx

'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { Achievement } from '../config'

interface AchievementCardProps {
  achievement: Achievement
  unlocked: boolean
}

export const AchievementCard = memo(
  ({ achievement, unlocked }: AchievementCardProps) => {
    const isHidden = achievement.hidden && !unlocked

    return (
      <div
        className={`
          relative flex items-center gap-3 md:gap-6 p-3 md:p-6 rounded-xl md:rounded-2xl border transition-all duration-300
          ${
            unlocked
              ? 'border-zinc-700 md:border-white/15 bg-zinc-800/40 md:bg-white/6 hover:bg-zinc-800/60 md:hover:bg-white/10 hover:border-zinc-600 md:hover:border-white/25 md:hover:scale-[1.01]'
              : 'border-zinc-800 md:border-white/6 bg-zinc-800/20 md:bg-white/2'
          }
        `}
      >
        {/* 圆形图标区域 */}
        <div className="relative shrink-0">
          {/* 外圈光晕（已解锁） */}
          {unlocked && (
            <div
              className={`
                absolute -inset-1 md:-inset-1.5 rounded-full
                bg-linear-to-br ${achievement.gradient}
                opacity-40 blur-lg md:blur-xl
                animate-pulse-slow
              `}
            />
          )}

          {/* 圆形图标容器：手机端 80px，PC端 120px */}
          <div
            className={`
              relative w-20 h-20 md:w-30 md:h-30 rounded-full overflow-hidden
              flex items-center justify-center
              ${
                unlocked
                  ? `bg-linear-to-br ${achievement.gradient} ${achievement.glow} shadow-xl md:shadow-2xl`
                  : 'bg-zinc-800 md:bg-white/4 border border-zinc-700 md:border-white/8'
              }
            `}
          >
            <Image
              src={achievement.image}
              alt={achievement.name}
              width={120}
              height={120}
              className={`
                w-full h-full object-cover transition-all duration-300
                ${
                  isHidden
                    ? 'opacity-15 grayscale brightness-50'
                    : unlocked
                      ? 'opacity-100'
                      : 'opacity-25 grayscale'
                }
              `}
              loading="lazy"
            />

            {/* 隐藏成就：??? 覆盖 */}
            {isHidden && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                <span className="text-white/40 text-3xl md:text-5xl font-bold drop-shadow-lg">
                  ?
                </span>
              </div>
            )}

            {/* 未解锁：锁图标 */}
            {!unlocked && !isHidden && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                <Lock className="w-6 h-6 md:w-9 md:h-9 text-zinc-500 md:text-white/30" />
              </div>
            )}
          </div>

          {/* 已解锁标记 */}
          {unlocked && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-7 md:h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-zinc-900 md:border-gray-900/80 shadow-lg z-20">
              <svg
                className="w-3 h-3 md:w-4 md:h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>

        {/* 文字信息 */}
        <div className="flex-1 min-w-0">
          {/* 日文名（小字） */}
          <div
            className={`
              text-[10px] md:text-xs font-medium tracking-wider transition-colors duration-300 font-ja-maru
              ${unlocked ? 'text-zinc-400 md:text-white/45' : 'text-zinc-600 md:text-white/20'}
            `}
          >
            {isHidden ? '？？？' : achievement.nameJp}
          </div>

          {/* 中文名（大字） */}
          <div
            className={`
              text-sm md:text-lg font-bold mt-0.5 md:mt-1 truncate transition-colors duration-300
              ${unlocked ? 'text-white' : 'text-zinc-500 md:text-white/30'}
            `}
          >
            {isHidden ? '？？？' : achievement.name}
          </div>

          {/* 描述 */}
          <div
            className={`
              text-xs md:text-sm mt-1 md:mt-2 leading-snug md:leading-relaxed line-clamp-2 transition-colors duration-300
              ${unlocked ? 'text-zinc-400 md:text-white/50' : 'text-zinc-600 md:text-white/25'}
            `}
          >
            {isHidden ? '隠し実績' : achievement.description}
          </div>

          {/* 状态标签 */}
          <div className="mt-1.5 md:mt-3">
            {unlocked ? (
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-medium text-green-400 bg-green-500/10 md:bg-green-500/10 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-green-500/20">
                ✓ 已解锁
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-medium text-zinc-500 md:text-white/30 bg-zinc-800 md:bg-white/5 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-zinc-700 md:border-white/5">
                未解锁
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }
)

AchievementCard.displayName = 'AchievementCard'
