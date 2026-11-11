export interface KunNavItem {
  name: string
  ja: string
  href: string
}

export const kunNavItem: KunNavItem[] = [
  {
    name: '游戏资源',
    ja: 'ゲーム',
    href: '/galgame'
  },
  {
    name: '游戏标签',
    ja: 'タグ',
    href: '/tag'
  },
  {
    name: '游戏会社',
    ja: 'ゲーム会社',
    href: '/company'
  },
  {
    name: '说明文档',
    ja: '説明書',
    href: '/doc'
  }
]

export const kunMobileNavItem: KunNavItem[] = [
  ...kunNavItem,
  {
    name: '下载资源列表',
    ja: '資源一覧',
    href: '/resource'
  },
  {
    name: '联系我们',
    ja: 'お問い合わせ',
    href: '/doc/notice/feedback'
  }
]
