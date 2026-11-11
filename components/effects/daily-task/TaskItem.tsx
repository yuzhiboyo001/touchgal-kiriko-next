// components/effects/daily-task/TaskItem.tsx

'use client'

import { memo } from 'react'
import { Check } from 'lucide-react'
import { THEME, SIZES } from './config'
import type { Task } from './types'

interface TaskItemProps {
  task: Task
}

export const TaskItem = memo(({ task }: TaskItemProps) => {
  return (
    <div
      className={`
        ${SIZES.taskPadding} rounded-xl transition-all duration-150
        ${task.completed ? THEME.taskCompleted : THEME.taskUncompleted}
      `}
    >
      <div className={`flex items-start ${SIZES.taskGap}`}>
        <div
          className={`
            mt-0.5 ${SIZES.checkboxSize} rounded-full border-2
            flex items-center justify-center flex-shrink-0 transition-all duration-150
            ${task.completed ? THEME.checkboxDone : THEME.checkboxBorder}
          `}
        >
          {task.completed && (
            <Check className={`${SIZES.checkIconSize} text-white`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`
              ${SIZES.taskTitleSize} font-medium transition-all duration-150
              ${task.completed ? THEME.textTitleDone : THEME.textTitle}
            `}
          >
            {task.title}
          </p>
          <p className={`${SIZES.taskDescSize} ${THEME.textDesc} mt-0.5`}>
            {task.description}
          </p>
          <p className={`${SIZES.taskRewardSize} ${THEME.textReward} mt-0.5`}>
            ✦ {task.reward}
          </p>
        </div>
      </div>
    </div>
  )
})

TaskItem.displayName = 'TaskItem'
