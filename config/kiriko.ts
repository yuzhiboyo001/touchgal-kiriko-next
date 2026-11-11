// 看板娘业务配置：Next 与 Python 共用 config/kiriko.json。
// 环境变量只放部署差异和密钥，不放这里的业务规则。

import raw from './kiriko.json'

export const KIRIKO_CONFIG = raw

export const KIRIKO_CHAT_DAILY_LIMIT = raw.chat.dailyLimit
export const KIRIKO_ADMIN_CHAT_DAILY_LIMIT = raw.chat.adminDailyLimit
export const KIRIKO_DONOR_CHAT_DAILY_LIMIT = raw.chat.donorDailyLimit

export const KIRIKO_CHAT_INITIAL_HISTORY = raw.chat.initialHistory
export const KIRIKO_CHAT_HISTORY_PAGE_SIZE = raw.chat.historyPageSize
export const KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES =
  raw.chat.historyContextMessages
export const KIRIKO_CHAT_RATE_LIMIT_PER_MINUTE = raw.chat.chatRateLimitPerMinute
export const KIRIKO_BRAIN_RATE_LIMIT_PER_MINUTE =
  raw.chat.brainRateLimitPerMinute

export const KIRIKO_MAX_BRAIN_MEMORIES = raw.memory.maxTotal
export const KIRIKO_MAX_BRAIN_MEMORY_LENGTH = raw.memory.maxContentLength
export const KIRIKO_MAX_CORE_MEMORIES = raw.memory.maxCore
export const KIRIKO_MAX_PROMISE_MEMORIES = raw.memory.maxPromise
export const KIRIKO_MAX_EPISODE_MEMORIES = raw.memory.maxEpisode
export const KIRIKO_BRAIN_EXTRACT_INTERVAL = raw.memory.extractIntervalTurns

/**
 * 角色 3/4 为管理员/超管，每天 50 次；
 * 有效支持者每天 30 次；其他角色每天 10 次。
 */
export const getKirikoChatDailyLimit = (
  role: number,
  donorUntil?: Date | string | null
): number => {
  if (role >= 3) return KIRIKO_ADMIN_CHAT_DAILY_LIMIT
  if (donorUntil && new Date(donorUntil).getTime() > Date.now()) {
    return KIRIKO_DONOR_CHAT_DAILY_LIMIT
  }
  return KIRIKO_CHAT_DAILY_LIMIT
}
