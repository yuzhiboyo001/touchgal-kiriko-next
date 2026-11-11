// components/effects/daily-task/utils/completeTask.ts

'use client'

import { DAILY_TASKS, WEEKLY_TASKS, CHALLENGE_TASKS } from '../config'
import { useTaskStore } from '~/store/taskStore'

const ALL_TASKS = [...DAILY_TASKS, ...WEEKLY_TASKS, ...CHALLENGE_TASKS]

let toastCallback:
  ((taskName: string, reward: string, taskId: string) => void) | null = null

export const setToastCallback = (callback: typeof toastCallback) => {
  toastCallback = callback
}

export const completeTask = async (
  taskId: string,
  options?: { skipIfCompleted?: boolean; silent?: boolean }
): Promise<boolean> => {
  // ✅ 高频任务：本地已完成则跳过 POST
  if (
    options?.skipIfCompleted &&
    useTaskStore.getState().isTaskCompleted(taskId)
  ) {
    return true
  }

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId })
    })
    const data = await res.json()

    if (!data.success) {
      console.error(`❌ 任务 ${taskId} 失败:`, data.message)
      return false
    }

    const { newlyCompleted, completed_at } = data.data ?? {}

    // ✅ 本地乐观更新 store
    if (newlyCompleted !== undefined) {
      useTaskStore
        .getState()
        .markCompleted(taskId, newlyCompleted, completed_at)
    }

    // ✅ 首次完成 + 非 silent 才弹 Toast
    if (newlyCompleted && !options?.silent) {
      const task = ALL_TASKS.find((t) => t.id === taskId)
      if (task && toastCallback) {
        toastCallback(task.title, task.reward, taskId)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Toast] 首次完成: ${taskId} - ${task.title}`)
        }
      }
    }

    return true
  } catch (error) {
    console.error(`❌ 任务 ${taskId} 失败:`, error)
    return false
  }
}
