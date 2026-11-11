// constants/captcha.ts

export const KUN_CAPTCHA_VERIFY_TOKEN_BYTES = 32
export const KUN_CAPTCHA_VERIFY_TOKEN_TTL_SECONDS = 5 * 60
export const kunCaptchaVerifyTokenRegex = /^[a-f0-9]{64}$/

export interface CaptchaQuestion {
  id: string
  category: 'general'
  question: string
  options: string[]
  answer: number
}

export const KUN_CAPTCHA_POOL: CaptchaQuestion[] = [
  {
    id: 'general-1',
    category: 'general',
    question: '以下哪部作品是 Key 社制作的？',
    options: ['CLANNAD', '原神', '崩坏：星穹铁道'],
    answer: 0
  },
  {
    id: 'general-2',
    category: 'general',
    question: '「傲娇」指的是哪种性格？',
    options: ['嘴上不饶人、心里在意', '永远温柔体贴', '沉默寡言、不表达'],
    answer: 0
  },
  {
    id: 'general-3',
    category: 'general',
    question: '以下哪个是视觉小说？',
    options: ['Fate/stay night', '塞尔达传说', '英雄联盟'],
    answer: 0
  },
  {
    id: 'general-4',
    category: 'general',
    question: '「Galgame」通常指哪类游戏？',
    options: [
      '以剧情和角色互动为主的游戏',
      '以射击对战为主的游戏',
      '以模拟经营为主的游戏'
    ],
    answer: 0
  },
  {
    id: 'general-5',
    category: 'general',
    question: '《鸟之诗》是哪部作品的主题曲？',
    options: ['AIR', 'Kanon', 'Little Busters!'],
    answer: 0
  }
]

export const kunCaptchaErrorMessageMap: Record<number, string> = {
  1: '又错啦，仔细看看题目～',
  2: '再想想？',
  3: '别急，慢慢来',
  4: '要不换一题试试？',
  5: '冷静一下，再试一次',
  6: '要不……休息一下？'
}
