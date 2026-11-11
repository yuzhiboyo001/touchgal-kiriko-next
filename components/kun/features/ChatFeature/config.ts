// features/ChatFeature/config.ts

import { KIRIKO_CHAT_DAILY_LIMIT } from '~/config/kiriko'

export const CHARACTER_CONFIG = {
  rin: { name: '神崎 凛', avatar: '/kiriko_avatar/rin_avatar.webp' },
  sayo: { name: '星野 小夜', avatar: '/kiriko_avatar/sayo_avatar.webp' },
  shunv: { name: '月城 静香', avatar: '/kiriko_avatar/shunv_avatar.webp' }
} as const

export const PRESET_LOCATIONS = [
  '便利店',
  '家里',
  '学校',
  '车站',
  '公园',
  '餐厅',
  '咖啡厅'
] as const

export const MAX_DAILY_CHATS = KIRIKO_CHAT_DAILY_LIMIT
