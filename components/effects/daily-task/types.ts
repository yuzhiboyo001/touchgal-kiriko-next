// components/effects/daily-task/types.ts
// 定义任务接口
export interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  completed_at?: string | null
  reward: string
  category: 'daily' | 'weekly' | 'challenge'
  affection?: number // ✅ 新增：好感度数值
  coins?: number // ✅ 新增：金币数值
}

export interface DailyTaskProps {
  defaultPosition?: { x: number; y: number }
}
