// components/effects/daily-task/config.ts

import type { Task } from './types'

export const DAILY_TASKS: Task[] = [
  {
    id: 'd1',
    title: '今日のログイン',
    description: '打开「日課」面板',
    completed: false,
    reward: '好感度 +5 · 金币 +100',
    category: 'daily',
    affection: 5,
    coins: 100
  },
  {
    id: 'd2',
    title: 'おしゃべり',
    description: '和看板娘聊 3 句话',
    completed: false,
    reward: '好感度 +8 · 金币 +200',
    category: 'daily',
    affection: 8,
    coins: 200
  },
  {
    id: 'd3',
    title: 'お気に入り登録',
    description: '收藏一款游戏',
    completed: false,
    reward: '好感度 +10 · 金币 +100',
    category: 'daily',
    affection: 10,
    coins: 100
  },
  {
    id: 'd4',
    title: 'ゲームを探す',
    description: '搜索一款 Galgame',
    completed: false,
    reward: '好感度 +3 · 金币 +50',
    category: 'daily',
    affection: 3,
    coins: 50
  },
  {
    id: 'd5',
    title: '茶話会に参加',
    description: '在游戏评论区发布一条评论',
    completed: false,
    reward: '好感度 +6 · 金币 +200',
    category: 'daily',
    affection: 6,
    coins: 200
  }
]

export const WEEKLY_TASKS: Task[] = [
  {
    id: 'w1',
    title: '游戏評価の大师',
    description: '在游戏详情页发布一篇游戏评价',
    completed: false,
    reward: '好感度 +20 · 金币 +1000',
    category: 'weekly',
    affection: 20,
    coins: 1000
  },
  {
    id: 'w3',
    title: 'スペシャル会話',
    description: '和看板娘连续聊 10 句话',
    completed: false,
    reward: '好感度 +18 · 金币 +1000',
    category: 'weekly',
    affection: 18,
    coins: 1000
  },
  {
    id: 'w4',
    title: 'ショッピング',
    description: '在商店购物一次',
    completed: false,
    reward: '好感度 +25 · 金币 +500',
    category: 'weekly',
    affection: 25,
    coins: 500
  }
]

export const CHALLENGE_TASKS: Task[] = [
  {
    id: 'c2',
    title: 'スペシャル購入',
    description: '在商店购买一件特殊物品',
    completed: false,
    reward: '好感度 +100 · 金币 +1600',
    category: 'challenge',
    affection: 100,
    coins: 1600
  }
]

export const THEME = {
  panel: 'bg-background border border-default-200/30 shadow-xl rounded-2xl',
  panelHeader: 'border-b border-default-200/20 bg-background',
  panelBody: 'bg-background',
  tabActive: 'bg-primary-500/30 text-foreground',
  tabInactive: 'text-default-400 hover:text-foreground',
  taskUncompleted:
    'bg-default-100 hover:bg-default-200 border border-default-200/20',
  taskCompleted: 'bg-default-100 border border-success-400/30',
  textTitle: 'text-foreground',
  textTitleDone: 'text-default-400 line-through',
  textDesc: 'text-default-500',
  textReward: 'text-primary-500/80',
  checkboxBorder: 'border-default-400',
  checkboxDone: 'border-success-400 bg-success-400',
  iconColor: 'text-primary-500',
  triggerBtn:
    'bg-background border border-default-200/30 text-foreground hover:bg-default-100',
  emptyText: 'text-default-400'
}

export const SIZES = {
  panelWidth: 'w-72',
  panelMaxHeight: 'max-h-[75vh]',
  panelPadding: 'p-4',
  panelGap: 'space-y-2.5',
  headerPadding: 'px-5 py-4',
  headerGap: 'gap-2.5',
  iconSize: 'w-5 h-5',
  titleSize: 'text-base',
  progressSize: 'text-sm',
  tabGap: 'gap-1.5',
  tabPadding: 'py-1.5',
  tabSize: 'text-xs',
  taskPadding: 'p-3',
  taskGap: 'gap-3',
  checkboxSize: 'w-5 h-5',
  checkIconSize: 'w-3 h-3',
  taskTitleSize: 'text-sm',
  taskDescSize: 'text-xs',
  taskRewardSize: 'text-[11px]',
  triggerPadding: 'px-5 py-2.5',
  triggerGap: 'gap-3',
  triggerSize: 'text-base',
  triggerIconSize: 'w-4 h-4',
  triggerProgressSize: 'text-xs',
  emptySize: 'text-sm',
  emptyPadding: 'py-8'
}
