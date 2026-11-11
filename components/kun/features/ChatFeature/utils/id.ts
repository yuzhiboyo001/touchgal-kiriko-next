// features/ChatFeature/utils/id.ts

/**
 * 生成稳定唯一 ID
 * 优先用原生 randomUUID，降级到时间戳 + 随机串
 */
export const genMessageId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
