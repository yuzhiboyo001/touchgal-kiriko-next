// store/taskStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TaskStatus {
  completed: boolean
  completed_at?: string | null
  claimed?: boolean
}

interface TaskState {
  // 数据
  taskStatus: Record<string, TaskStatus>
  isLoading: boolean
  lastFetched: number | null

  // 操作
  fetchTasks: (force?: boolean) => Promise<void>
  isTaskCompleted: (taskId: string) => boolean
  isTaskJustCompleted: (taskId: string, seconds?: number) => boolean
  getTaskCompletedAt: (taskId: string) => string | null | undefined

  // ✅ 本地乐观更新（不额外发 GET）
  markCompleted: (
    taskId: string,
    newlyCompleted: boolean,
    completedAt?: string | null
  ) => void
  markClaimed: (taskId: string) => void

  // 重置
  reset: () => void
}

const CACHE_TTL = 3000 // 3秒缓存

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      taskStatus: {},
      isLoading: false,
      lastFetched: null,

      fetchTasks: async (force = false) => {
        const { lastFetched, isLoading } = get()
        const now = Date.now()

        if (isLoading) return

        if (!force && lastFetched && now - lastFetched < CACHE_TTL) {
          return
        }

        set({ isLoading: true })

        try {
          const res = await fetch('/api/tasks')
          const data = await res.json()

          if (data.success) {
            set({
              taskStatus: data.data,
              lastFetched: now,
              isLoading: false
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('TaskStore 获取任务失败:', error)
          }
          set({ isLoading: false })
        }
      },

      isTaskCompleted: (taskId: string) => {
        const status = get().taskStatus[taskId]
        return status?.completed ?? false
      },

      isTaskJustCompleted: (taskId: string, seconds: number = 3) => {
        const status = get().taskStatus[taskId]
        if (!status?.completed || !status?.completed_at) return false

        const now = Date.now()
        const completedTime = new Date(status.completed_at).getTime()
        const diffSeconds = (now - completedTime) / 1000
        return diffSeconds < seconds
      },

      getTaskCompletedAt: (taskId: string) => {
        const status = get().taskStatus[taskId]
        return status?.completed_at
      },
      markClaimed: (taskId) => {
        set((state) => {
          const prev = state.taskStatus[taskId]
          if (!prev) return state
          if (prev.claimed) return state // 已 claimed，无变化，返回原引用
          return {
            taskStatus: {
              ...state.taskStatus,
              [taskId]: { ...prev, claimed: true }
            }
          }
        })
      },
      markCompleted: (taskId, newlyCompleted, completedAt) => {
        set((state) => {
          const prev = state.taskStatus[taskId] ?? {}

          // ✅ 非首次完成：本地已 completed 则无变化，返回原 state 引用（避免下游重渲染）
          if (!newlyCompleted) {
            if (prev.completed) return state
            return {
              taskStatus: {
                ...state.taskStatus,
                [taskId]: {
                  ...prev,
                  completed: true,
                  completed_at: prev.completed_at ?? completedAt ?? null
                }
              }
            }
          }

          // ✅ 首次完成：写 completed + completed_at
          return {
            taskStatus: {
              ...state.taskStatus,
              [taskId]: {
                ...prev,
                completed: true,
                completed_at: completedAt ?? new Date().toISOString()
              }
            }
          }
        })
      },

      reset: () => {
        set({
          taskStatus: {},
          lastFetched: null,
          isLoading: false
        })
      }
    }),
    {
      name: 'task-storage',
      partialize: (state) => ({
        taskStatus: state.taskStatus,
        lastFetched: state.lastFetched
      })
    }
  )
)
