// components/effects/daily-task/components/TaskListContent.tsx

'use client'

import { memo, useRef, useState, useEffect } from 'react'
import {
  Loader2,
  Check,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Coins,
  Heart
} from 'lucide-react'
import type { Task } from '~/components/effects/daily-task/types'
import { useTaskStore } from '~/store/taskStore'

interface TaskListContentProps {
  isLoading: boolean
  filteredTasks: Task[]
  onClaim: (taskId: string) => void
  isClaiming: string | null
}

export const TaskListContent = memo(
  ({ isLoading, filteredTasks, onClaim, isClaiming }: TaskListContentProps) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(true)

    const taskStatus = useTaskStore((state) => state.taskStatus)

    const checkScroll = () => {
      if (!scrollRef.current) return
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }

    useEffect(() => {
      checkScroll()
      window.addEventListener('resize', checkScroll)
      return () => window.removeEventListener('resize', checkScroll)
    }, [filteredTasks])

    useEffect(() => {
      const el = scrollRef.current
      if (!el) return
      const onWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault()
          el.scrollLeft += e.deltaY
        }
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => el.removeEventListener('wheel', onWheel)
    }, [])

    if (isLoading && filteredTasks.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      )
    }

    if (filteredTasks.length === 0) {
      return (
        <div className="text-center py-16 text-zinc-500 text-sm">
          暂无任务，休息一下吧~
        </div>
      )
    }

    return (
      <div className="relative w-full h-full flex flex-col justify-center">
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-6 w-12 md:w-16 bg-gradient-to-r from-zinc-900 to-transparent z-10 pointer-events-none flex items-center justify-start pl-2">
            <ChevronLeft className="w-5 h-5 text-zinc-400 animate-pulse" />
          </div>
        )}

        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-6 w-12 md:w-16 bg-gradient-to-l from-zinc-900 to-transparent z-10 pointer-events-none flex items-center justify-end pr-2">
            <ChevronRight className="w-5 h-5 text-zinc-400 animate-pulse" />
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex flex-row overflow-x-auto gap-4 md:gap-5 pb-6 pt-2 px-6 md:px-8 snap-x snap-mandatory custom-horizontal-scrollbar"
        >
          {filteredTasks.map((task) => {
            const isClaimed = taskStatus[task.id]?.claimed || false

            return (
              <div
                key={task.id}
                className={`
                  flex-shrink-0 flex flex-col justify-between w-[150px] md:w-[170px] min-h-[270px] md:min-h-[280px] snap-center
                  p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden select-none
                  ${
                    isClaimed
                      ? 'bg-[#151515]/90 border-zinc-800/80 opacity-70'
                      : task.completed
                        ? 'bg-[#201a1e] border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.15)] group'
                        : 'bg-gradient-to-b from-[#2a2a2e] to-[#1c1c1e] border-zinc-700/80 shadow-lg group'
                  }
                `}
              >
                <div
                  className={`absolute -bottom-4 -right-4 pointer-events-none transition-colors duration-300 ${isClaimed ? 'text-zinc-800/20' : 'text-pink-500/5 group-hover:text-pink-500/10'}`}
                >
                  <Sparkles className="w-24 h-24" />
                </div>

                {/* ================= 右上角：打勾圆圈 ================= */}
                <div className="absolute top-3 right-3 z-10">
                  <div
                    className={`
                      flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${
                        task.completed
                          ? 'bg-pink-500 border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                          : 'bg-zinc-800/80 border-zinc-600 group-hover:border-pink-400 group-hover:bg-pink-500/20'
                      }
                    `}
                  >
                    {task.completed ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-zinc-500 group-hover:bg-pink-400 transition-colors" />
                    )}
                  </div>
                </div>

                {/* ================= 上半部分：标题描述 ================= */}
                <div className="flex shrink-0 flex-col mt-5">
                  <h3
                    className={`font-bold text-[15px] leading-[1.7] pt-0.5 pb-1 break-words pr-6 ${isClaimed ? 'text-zinc-500' : 'text-zinc-100'}`}
                  >
                    {task.title}
                  </h3>
                  <p
                    className={`text-xs mt-1.5 leading-[1.7] break-words ${isClaimed ? 'text-zinc-600' : 'text-zinc-400'}`}
                  >
                    {task.description}
                  </p>
                </div>

                {/* ================= ✅ 中间偏下：紧凑型奖励标签，上下两行排列 ================= */}
                <div className="flex shrink-0 flex-col items-start gap-1.5 mt-auto mb-6">
                  {/* 好感度固定在第一行 */}
                  {task.affection && task.affection > 0 && (
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
                        isClaimed
                          ? 'bg-zinc-800/50 text-zinc-500'
                          : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>+{task.affection}</span>
                    </span>
                  )}

                  {/* 金币固定在第二行 */}
                  {task.coins && task.coins > 0 && (
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
                        isClaimed
                          ? 'bg-zinc-800/50 text-zinc-500'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{task.coins}</span>
                    </span>
                  )}
                </div>

                {/* ================= 底部按钮：纯文字无图标 ================= */}
                <div className="relative z-10 shrink-0">
                  {isClaimed ? (
                    <div className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-[13px] font-bold bg-zinc-800/50 text-zinc-500 border border-zinc-700/30">
                      已领取
                    </div>
                  ) : task.completed ? (
                    <button
                      onClick={() => onClaim(task.id)}
                      disabled={isClaiming === task.id}
                      className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-[13px] font-bold bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:bg-pink-400 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isClaiming === task.id ? '领取中...' : '领取'}
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-[13px] font-bold bg-zinc-800/30 text-zinc-500 border border-zinc-700/50">
                      进行中
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

TaskListContent.displayName = 'TaskListContent'
