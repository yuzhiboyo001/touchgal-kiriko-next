// constants/home.ts
import { Tags, MessageSquare, FileText, Trophy } from 'lucide-react'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

interface HomeNavItem {
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >
  label: string // 中文（副）
  ja: string // 日文（主）
  href: string
  color: 'primary' | 'secondary' | 'success'
  isExternal: boolean
}

export const homeNavigationItems: HomeNavItem[] = [
  {
    icon: Tags,
    label: '标签',
    ja: 'タグ',
    href: '/tag',
    color: 'primary',
    isExternal: false
  },
  {
    icon: Trophy,
    label: '排行榜',
    ja: 'ランキング',
    href: '/ranking',
    color: 'secondary',
    isExternal: false
  },
  {
    icon: MessageSquare,
    label: '论坛',
    ja: 'フォーラム',
    href: '/forum', // 指向中转接口
    color: 'success',
    isExternal: false
  }
]
