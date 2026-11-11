// components/kun/KirikoStandee/config.ts

import type { StandeeConfig } from './types'

export const CHARACTER_CONFIGS: Record<string, StandeeConfig> = {
  rin: {
    id: 'rin',
    name: '神崎 凛',
    imagePath: '/Taskbar/jk/01.webp',
    shopImagePath: '/Taskbar/jk/02.webp',
    nameColor: 'text-purple-300',
    borderColor: 'border-purple-500/20',
    bgColor: 'bg-purple-500/3',
    accentColor: 'purple-400',
    iconBg: 'bg-purple-500/20',
    iconHover: 'hover:bg-purple-500/30',

    // ✅ 手机端纯色实底(暗紫) / PC端原版(毛玻璃深紫)
    shopBg: 'bg-[#1a1525] md:bg-purple-950/90',
    shopBorder: 'border-purple-500/30 md:border-purple-400/30',
    shopAccent:
      'bg-purple-500 text-white md:bg-purple-600/50 md:hover:bg-purple-600/70',
    shopText: 'text-purple-300 md:text-purple-100'
  },
  sayo: {
    id: 'sayo',
    name: '星野 小夜',
    imagePath: '/Taskbar/loli/01.webp',
    shopImagePath: '/Taskbar/loli/02.webp',
    nameColor: 'text-pink-300',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/5',
    accentColor: 'pink-400',
    iconBg: 'bg-pink-500/20',
    iconHover: 'hover:bg-pink-500/30',

    // ✅ 手机端纯色实底(暗玫红) / PC端原版(毛玻璃深粉)
    shopBg: 'bg-[#201116] md:bg-pink-950/90',
    shopBorder: 'border-pink-500/30 md:border-pink-400/40',
    shopAccent:
      'bg-pink-500 text-white md:bg-pink-600/50 md:hover:bg-pink-600/70',
    shopText: 'text-pink-400 md:text-pink-100'
  },
  shunv: {
    id: 'shunv',
    name: '月城 静香',
    imagePath: '/Taskbar/shunv/01.webp',
    shopImagePath: '/Taskbar/shunv/02.webp',
    nameColor: 'text-black/50',
    borderColor: 'border-rose-300/25',
    bgColor: 'bg-rose-950/5',
    accentColor: 'rose-300/70',
    iconBg: 'bg-rose-400/15',
    iconHover: 'hover:bg-amber-400/25',

    // ✅ 手机端纯色实底(暖灰) / PC端原版(毛玻璃深灰)
    shopBg: 'bg-[#1c1817] md:bg-gray-900/95',
    shopBorder: 'border-rose-500/30 md:border-white/30',
    shopAccent: 'bg-rose-500 text-white md:bg-white/30 md:hover:bg-white/40',
    shopText: 'text-rose-300 md:text-white'
  }
}

export const FUNC_ICONS = [
  { id: 'chat', icon: 'MessageCircle', label: '聊天', unlocked: true },
  { id: 'shop', icon: 'ShoppingBag', label: '商店', unlocked: true },
  { id: 'affection', icon: 'Heart', label: '好感度', unlocked: true },
  { id: 'achievement', icon: 'Trophy', label: '成就', unlocked: true },
  { id: 'about', icon: 'Info', label: '关于', unlocked: true }
]

export const BASE_WIDTH = 614
export const BASE_HEIGHT = 1024
export const MIN_SCALE = 0.3
export const MAX_SCALE = 2
export const DEFAULT_SCALE = 0.5
