/**
 * UP 野榜数据配置
 *
 * 纯静态配置，不写数据库。
 * 部署、删库、清测试数据都不会影响这里的内容。
 *
 * 封面目前放在 public/ranking/ 下，使用站内路径。
 * 以后如果迁到 R2，只需要把 cover 换成完整 URL。
 */

export interface UpRankingEntry {
  /** 唯一 id，可选；不填时接榜可以用 rank 或数组下标当 key */
  id?: number

  /** 名次，从 1 开始 */
  rank: number

  /** 游戏中文名 */
  title: string

  /** 日文原名，可选 */
  titleJp?: string

  /** 会社 / 品牌 */
  company: string

  /** 发售日期，建议 YYYY-MM-DD */
  releaseDate: string

  /**
   * 封面地址。
   * 当前使用 /ranking/{编号}.{扩展名}
   */
  cover?: string

  /** 标签 */
  tags: string[]

  /**
   * 外部作品链接，可选，不急着填。
   * 如果后面有 patchUniqueId，会优先走站内游戏介绍页。
   */
  workUrl?: string

  /**
   * 站内 Patch 的 uniqueId，等之后发出来再填。
   * 填了之后优先跳转 /{patchUniqueId}。
   */
  patchUniqueId?: string | null

  /**
   * 目前页面底部会显示评分 / 下载量，但野榜暂时不用。
   * 留空即可。
   */
  reviewCount?: string
  dlCount?: string
}

export const UP_RANKING: UpRankingEntry[] = [
  {
    id: 1,
    rank: 1,
    title: '美少女万华镜 -被诅咒的传说少女-',
    company: 'ωstar',
    releaseDate: '2011-12-29',
    cover: '/ranking/1.jpeg',
    tags: ['恋爱冒险', '纯爱', '吸血鬼'],
    patchUniqueId: '7486305a'
  },
  {
    id: 2,
    rank: 2,
    title: '永恒世界',
    company: 'Caribdis',
    releaseDate: '2022-07-11',
    cover: '/ranking/2.webp',
    tags: ['现代分支', '亚洲SLG', '3D视觉小说', '后宫', '神作', '剧情向'],
    patchUniqueId: '499246c2'
  },
  {
    id: 3,
    rank: 3,
    title: '与家出少女的生活',
    company: 'KumonosuGame',
    releaseDate: '2022-04-21',
    cover: '/ranking/3.jpg',
    tags: ['纯爱', '养成SLG', '互相救赎', 'CV'],
    patchUniqueId: 'abb6b716'
  },
  {
    id: 4,
    rank: 4,
    title: '特工17',
    company: 'HEXATAIL',
    releaseDate: '2021-08-21',
    cover: '/ranking/4.webp',
    tags: ['现代分支', '亚洲SLG', '后宫', '神作'],
    patchUniqueId: '4cae1ee2'
  },
  {
    id: 5,
    rank: 5,
    title: '伊莱莎的秘药',
    company: 'らて茶場',
    releaseDate: '2024-07-28',
    cover: '/ranking/5.webp',
    tags: ['日式SLG', '魔女', '日常', '巨乳/爆乳'],
    patchUniqueId: '8bf50b0e'
  },
  {
    id: 6,
    rank: 6,
    title: '魔女的侵袭1',
    company: 'NumericGazer',
    releaseDate: '2021-04-21',
    cover: '/ranking/6.jpg',
    tags: ['3D', '沙盒', 'SLG', 'SM', '优质建模'],
    patchUniqueId: '9ead2473'
  },
  {
    id: 7,
    rank: 7,
    title: '催眠APP～清纯大小姐的堕落调教模拟2',
    company: 'dobuworks',
    releaseDate: '2025-05-28',
    cover: '/ranking/7.webp',
    tags: ['SLG', '精神支配', '催眠'],
    patchUniqueId: 'c04515a1'
  },
  {
    id: 8,
    rank: 8,
    title: 'Role player：小粥姉妹の粘膜ポトレ ぐりぐちゃLIVE！',
    company: 'あかべぇそふとつぅ',
    releaseDate: '2021-06-25',
    cover: '/ranking/8.webp',
    tags: ['视觉小说', '拔作', '姐妹'],
    patchUniqueId: 'd76e49da'
  }
]
