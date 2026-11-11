// features/AchievementFeature/config.ts

import type { LucideIcon } from 'lucide-react'
import {
  MessageCircle,
  Heart,
  Book,
  MessageSquare,
  Gem,
  Sparkles
} from 'lucide-react'

export interface Achievement {
  id: string
  name: string // 中文名（主）
  nameJp: string // 日文名（副）
  description: string
  icon: LucideIcon
  // ✅ 成就图片（解锁/未解锁共用）
  image: string
  // 渐变（用于解锁后的光晕）
  gradient: string
  glow: string
  // 是否隐藏
  hidden?: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'secret_first_chat',
    name: '是你吗？',
    nameJp: 'あなたですか？',
    description: '第一次和看板娘对话',
    icon: MessageCircle,
    image: '/achievements/first_chat.webp',
    gradient: 'from-pink-400 to-rose-500',
    glow: 'shadow-pink-500/30'
  },
  {
    id: 'aff_6',
    name: '故事才刚刚开始',
    nameJp: '物語は始まったばかり',
    description: '好感度达到 6 级',
    icon: Heart,
    image: '/achievements/affection_6.webp',
    gradient: 'from-rose-400 to-pink-500',
    glow: 'shadow-rose-500/30'
  },
  {
    id: 'explore_100',
    name: '我即是神',
    nameJp: '図鑑マスター',
    description: '收藏 100 款游戏',
    icon: Book,
    image: '/achievements/explore_100.webp',
    gradient: 'from-blue-400 to-cyan-500',
    glow: 'shadow-blue-500/30'
  },
  {
    id: 'comment_100',
    name: '攻略之神',
    nameJp: '茶話会の桂木桂马',
    description: '发布 100 条评论',
    icon: MessageSquare,
    image: '/achievements/comment_100.webp',
    gradient: 'from-purple-400 to-violet-500',
    glow: 'shadow-purple-500/30'
  },
  {
    id: 'shop_ring',
    name: '妳の誓约',
    nameJp: '私の誓い',
    description: '购买戒指',
    icon: Gem,
    image: '/achievements/shop_ring.webp',
    gradient: 'from-amber-400 to-yellow-500',
    glow: 'shadow-amber-500/30'
  },
  {
    id: 'secret_eternal',
    name: '超越时间の永恒',
    nameJp: '永遠の誓い',
    description: '连续365天，每天和看板娘对话',
    icon: Sparkles,
    image: '/achievements/eternal.webp',
    gradient: 'from-indigo-400 to-purple-500',
    glow: 'shadow-indigo-500/30',
    hidden: true
  }
]
