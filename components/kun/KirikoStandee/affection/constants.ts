// components/kun/KirikoStandee/affection/constants.ts

export const AFFECTION_LEVELS = [
  { level: 1, min: 0, label: '陌生人' },
  { level: 2, min: 200, label: '知り合い' },
  { level: 3, min: 600, label: '仲良し' },
  { level: 4, min: 1200, label: '親友' },
  { level: 5, min: 2500, label: '好朋友' },
  { level: 6, min: 5000, label: '亲密' },
  { level: 7, min: 10000, label: '心の友' },
  { level: 8, min: 25000, label: '絆' },
  { level: 9, min: 60000, label: '運命の人' },
  { level: 10, min: 150000, label: '永遠' }
] as const

// 工具函数：根据好感度计算等级
export const getLevel = (value: number): number => {
  let level = 1
  for (const lv of AFFECTION_LEVELS) {
    if (value >= lv.min) level = lv.level
  }
  return level
}

// 工具函数：根据等级获取标签
export const getLevelLabel = (level: number): string => {
  return AFFECTION_LEVELS.find((l) => l.level === level)?.label || `Lv.${level}`
}

// 工具函数：获取等级进度
export const getLevelProgress = (affection: number, level: number): number => {
  const currentLevelMin =
    AFFECTION_LEVELS.find((l) => l.level === level)?.min || 0
  const nextLevel = AFFECTION_LEVELS.find((l) => l.level === level + 1)
  const nextLevelMin = nextLevel?.min || currentLevelMin
  const progress = nextLevel
    ? (affection - currentLevelMin) / (nextLevelMin - currentLevelMin)
    : 1
  return Math.min(Math.max(progress, 0), 1)
}

// 获取最大等级
export const MAX_LEVEL = AFFECTION_LEVELS.length

// 解锁看板娘聊天所需的好感度等级
export const CHAT_UNLOCK_LEVEL = 3
export const CHAT_UNLOCK_AFFECTION =
  AFFECTION_LEVELS.find((level) => level.level === CHAT_UNLOCK_LEVEL)?.min ||
  600
