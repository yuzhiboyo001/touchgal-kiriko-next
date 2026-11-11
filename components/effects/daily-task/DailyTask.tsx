// components/effects/daily-task/DailyTask.tsx

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Sparkles, Check } from 'lucide-react'
import { DAILY_TASKS, WEEKLY_TASKS, CHALLENGE_TASKS } from './config'
import { PanelHeader, TaskListContent } from './components'
import { useUserStore } from '~/store/userStore'
import { useTaskStore } from '~/store/taskStore'
import { completeTask, setToastCallback } from './utils/completeTask'
import type { Task } from './types'
import { TaskCompleteToast } from './TaskCompleteToast'
import { getLevel } from '~/components/kun/KirikoStandee/affection/constants'
import { RewardFloat, type RewardItem } from './components'

interface DailyTaskProps {
  isOpen: boolean
  onClose: () => void
}

export const DailyTask = ({ isOpen, onClose }: DailyTaskProps) => {
  const user = useUserStore((state) => state.user)
  const isLoggedIn = user.uid !== 0

  const [tasks, setTasks] = useState<Task[]>(() => [
    ...DAILY_TASKS,
    ...WEEKLY_TASKS,
    ...CHALLENGE_TASKS
  ])
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'challenge'>(
    'daily'
  )
  const [mounted, setMounted] = useState(false)

  const [toastState, setToastState] = useState({
    show: false,
    taskName: '',
    taskId: '',
    seq: 0
  })
  const [rewardFloat, setRewardFloat] = useState<{
    show: boolean
    rewards: RewardItem[]
    key: number
  }>({ show: false, rewards: [], key: 0 })
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const taskStatus = useTaskStore((state) => state.taskStatus)
  const isLoading = useTaskStore((state) => state.isLoading)
  const isTaskCompleted = useTaskStore((state) => state.isTaskCompleted)
  const fetchTasks = useTaskStore((state) => state.fetchTasks)

  useEffect(() => {
    setToastCallback((taskName, _reward, taskId) => {
      setToastState((prev) => ({
        show: true,
        taskName,
        taskId,
        seq: prev.seq + 1
      }))
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          completed: isTaskCompleted(t.id),
          completed_at: taskStatus[t.id]?.completed_at || null
        }))
      )
    }, 0)

    return () => clearTimeout(timer)
  }, [taskStatus, isTaskCompleted])

  // ✅ 打开面板时对齐一次服务端（UI 卡片状态）
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchTasks(true)
    }
  }, [isOpen, isLoggedIn, fetchTasks])

  const filteredTasks = useMemo(
    () => tasks.filter((t) => t.category === activeTab),
    [tasks, activeTab]
  )

  const dailyTasks = useMemo(
    () => tasks.filter((t) => t.category === 'daily'),
    [tasks]
  )
  const completedCount = useMemo(
    () => dailyTasks.filter((t) => t.completed).length,
    [dailyTasks]
  )
  const totalTasks = dailyTasks.length

  const currentActivity = Math.min(completedCount * 20, 100)
  const maxActivity = 100

  // ✅ d1 自动完成：只走 completeTask，服务端 newlyCompleted 裁决弹不弹
  useEffect(() => {
    if (!isOpen || !isLoggedIn || isLoading) return
    if (tasks.length === 0) return

    const loginTask = tasks.find((t) => t.id === 'd1')
    if (!loginTask || loginTask.completed) return

    const timer = setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === 'd1' ? { ...t, completed: true } : t))
      )
      completeTask('d1')
    }, 0)

    return () => clearTimeout(timer)
  }, [isOpen, isLoggedIn, isLoading, tasks])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleToastComplete = useCallback(() => {
    setToastState((prev) => ({ ...prev, show: false }))
  }, [])

  const handleClaim = async (taskId: string) => {
    if (claimingId) return
    setClaimingId(taskId)

    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.message)

      // ✅ 本地标记已领取（不 fetchTasks）
      useTaskStore.getState().markClaimed(taskId)

      // ✅ 触发奖励飘字
      const task = tasks.find((t) => t.id === taskId)
      const rewards: RewardItem[] = []
      if (task?.affection && task.affection > 0) {
        rewards.push({ type: 'affection', amount: task.affection })
      }
      if (task?.coins && task.coins > 0) {
        rewards.push({ type: 'coins', amount: task.coins })
      }
      if (rewards.length > 0) {
        setRewardFloat((prev) => ({
          show: true,
          rewards,
          key: prev.key + 1 // 强制重挂载，连续领奖重新飘
        }))
      }

      // ✅ 好感度等级提示（保留）
      if (data.data.totalAffection !== undefined) {
        const newTotalAffection = data.data.totalAffection
        const newLevel = getLevel(newTotalAffection)
        const lastLevel = Number(
          localStorage.getItem('last-affection-level') || '1'
        )

        if (newLevel > lastLevel) {
          useUserStore.getState().setLevelUpToast({
            show: true,
            level: newLevel,
            total: newTotalAffection
          })
          localStorage.setItem('last-affection-level', String(newLevel))
        }
      }
    } catch (error) {
      console.error('领奖失败', error)
    } finally {
      setClaimingId(null)
    }
  }

  if (!isLoggedIn || !mounted) return null

  return (
    <>
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-[fadeIn_0.2s_ease-out]">
            <div
              className={`relative w-[92vw] md:w-[980px] max-h-[85vh] md:max-h-[80vh] overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-700 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col animate-[scaleIn_0.2s_ease-out]`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* ================= 异环风 顶部活跃度区 ================= */}
              <div className="relative pt-6 px-6 md:px-8 pb-6 flex-shrink-0 z-10 border-b border-zinc-800">
                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-pink-500/10 border-2 border-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                      <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-pink-400" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight">
                          {currentActivity}
                        </span>
                        <span className="text-xs md:text-sm font-bold text-zinc-500">
                          / {maxActivity}
                        </span>
                      </div>
                      <span className="text-[10px] md:text-xs text-pink-400 font-bold mt-1 tracking-widest">
                        活跃度
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 relative mt-2 md:mt-0 w-full pl-3 pr-12 md:pl-4 md:pr-16">
                    <div className="relative h-12 w-full">
                      <div className="absolute left-0 right-0 top-3 md:top-3.5 h-1.5 bg-zinc-800 rounded-full z-0" />

                      <div
                        className="absolute left-0 top-3 md:top-3.5 h-1.5 bg-gradient-to-r from-pink-500 to-rose-400 rounded-full z-0 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                        style={{ width: `${currentActivity}%` }}
                      />

                      {[20, 40, 60, 80, 100].map((m) => {
                        const isPassed = currentActivity >= m
                        const isHiddenOnMobile =
                          m !== 20 && m !== 60 && m !== 100

                        return (
                          <div
                            key={m}
                            className={`absolute top-0 z-10 -translate-x-1/2 flex-col items-center ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'}`}
                            style={{ left: `${m}%` }}
                          >
                            <div
                              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                isPassed
                                  ? 'bg-pink-500 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                                  : 'bg-zinc-900 border-zinc-600 text-zinc-600'
                              }`}
                            >
                              {isPassed ? (
                                <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                              )}
                            </div>
                            <span
                              className={`text-[10px] md:text-[11px] mt-1.5 font-bold ${
                                isPassed ? 'text-pink-400' : 'text-zinc-500'
                              }`}
                            >
                              {m}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= 分类 Tab ================= */}
              <div className="px-6 md:px-8 pt-4 z-10">
                <PanelHeader
                  completedCount={completedCount}
                  totalTasks={totalTasks}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onMouseDown={() => {}}
                  isLoading={isLoading}
                />
              </div>

              {/* ================= 任务卡片区 ================= */}
              <div className="relative overflow-hidden py-5 flex-1 z-10 flex flex-col">
                <TaskListContent
                  isLoading={isLoading}
                  filteredTasks={filteredTasks}
                  onClaim={handleClaim}
                  isClaiming={claimingId}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {toastState.show && (
        <TaskCompleteToast
          key={`toast-${toastState.seq}`}
          taskName={toastState.taskName}
          onComplete={handleToastComplete}
        />
      )}

      {rewardFloat.show && (
        <RewardFloat
          key={`reward-${rewardFloat.key}`}
          rewards={rewardFloat.rewards}
          onComplete={() =>
            setRewardFloat((prev) => ({ ...prev, show: false }))
          }
        />
      )}
    </>
  )
}
