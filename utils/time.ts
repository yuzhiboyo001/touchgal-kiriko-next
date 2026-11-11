// utils/time.ts
import { differenceInSeconds, differenceInHours } from 'date-fns'

// ============================================================
// 🕐 时区统一：北京时间（中国标准时间 UTC+8）
// IANA 时区 ID 为 Asia/Shanghai（代表中国标准时间）
// ============================================================

const BEIJING_TIME_ZONE = 'Asia/Shanghai'

const padDatePart = (value: number) => String(value).padStart(2, '0')

// 缓存 Intl 实例，避免每次 new 的开销
const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: BEIJING_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: BEIJING_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

/** 从 Intl parts 里取字段 */
const getPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
  parts.find((p) => p.type === type)?.value ?? '00'

/**
 * 任意时刻 → 北京时间的 'YYYY-MM-DD HH:mm:ss'
 * 纯字符串输出，不产生假 Date
 */
export const formatBeijingDateTime = (date: Date = new Date()): string => {
  const parts = dateTimeFormatter.formatToParts(date)
  return `${getPart(parts, 'year')}-${getPart(parts, 'month')}-${getPart(
    parts,
    'day'
  )} ${getPart(parts, 'hour')}:${getPart(parts, 'minute')}:${getPart(
    parts,
    'second'
  )}`
}

/**
 * 任意时刻 → 北京时间的 'HH:mm'
 */
export const formatBeijingTime = (date: Date = new Date()): string => {
  const parts = timeFormatter.formatToParts(date)
  return `${getPart(parts, 'hour')}:${getPart(parts, 'minute')}`
}

/**
 * 任意时刻 → 北京时间的日期 'YYYY-MM-DD'
 */
export const formatBeijingDate = (date: Date = new Date()): string => {
  const parts = dateTimeFormatter.formatToParts(date)
  return `${getPart(parts, 'year')}-${getPart(parts, 'month')}-${getPart(
    parts,
    'day'
  )}`
}
/**
 * 判断两个时刻是否属于「北京同一天」
 * 用法：isSameBeijingDay(getBeijingToday(), user.chat_last_used_date)
 */
export const isSameBeijingDay = (a: Date, b: Date): boolean => {
  return formatBeijingDate(a) === formatBeijingDate(b)
}

/** 当前用户今天是否已经签到（0/1）。 */
export const getDailyCheckInValue = (
  lastCheckInDate: Date | string | null | undefined
): number => {
  if (!lastCheckInDate) return 0
  return isSameBeijingDay(getBeijingToday(), new Date(lastCheckInDate)) ? 1 : 0
}
// ============================================================
// 🕐 相对时间（保留原实现）
// ============================================================

export const formatTimeDifference = (pastTime: number | Date | string) => {
  const now = new Date()
  const past = new Date(pastTime)
  const diffInSeconds = differenceInSeconds(now, past)

  if (diffInSeconds < 10) return '数秒前'
  if (diffInSeconds < 60) return `${diffInSeconds} 秒前`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} 天前`
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} 个月前`
  return `${Math.floor(diffInSeconds / 31536000)} 年前`
}

export const hourDiff = (upvoteTime: number | Date | string, hours: number) => {
  if (upvoteTime === 0 || upvoteTime === undefined) return false
  return differenceInHours(new Date(), new Date(upvoteTime)) <= hours
}

// ============================================================
// 🕐 当前时刻（真实 Date，不再 +8h 偏移）
// ============================================================

/** 当前真实时刻。格式化时用 formatBeijing* 指定时区。 */
export const getBeijingNow = (): Date => new Date()

/** 当前北京时间的年份 */
export const getCurrentSiteYear = (): number =>
  Number(formatBeijingDate(new Date()).slice(0, 4))

// ============================================================
// 🕐 日期边界（真实 UTC 时刻，语义正确，可直接存库）
// ============================================================

/**
 * 北京时间"今天 00:00"对应的真实 UTC 时刻。
 * 例：北京时间 2026-10-23 00:00 = UTC 2026-10-22 16:00
 */
export const getBeijingToday = (): Date => {
  const now = new Date()
  const dateStr = formatBeijingDate(now) // 'YYYY-MM-DD'（北京日期）
  // 构造该北京日期 00:00 对应的 UTC 时刻：北京 00:00 = UTC 前一天 16:00
  return new Date(`${dateStr}T00:00:00+08:00`)
}

/**
 * 北京时间"本周一 00:00"对应的真实 UTC 时刻。
 * 基于 getBeijingToday 的北京日期，算周一。
 */
export const getBeijingWeekStart = (): Date => {
  const today = getBeijingToday()
  // 用北京时间读周几：today 是真实 UTC 时刻，转成北京日期字符串再读
  const dateStr = formatBeijingDate(today) // 北京日期
  const d = new Date(`${dateStr}T00:00:00+08:00`)
  const dayOfWeek = d.getUTCDay() // 0=周日
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return new Date(d.getTime() - diffToMonday * 86400000)
}

/**
 * 北京时间"本月 1 日 00:00"对应的真实 UTC 时刻。
 */
export const getBeijingMonthStart = (): Date => {
  const today = getBeijingToday()
  const dateStr = formatBeijingDate(today)
  const [y, m] = dateStr.split('-')
  return new Date(`${y}-${m}-01T00:00:00+08:00`)
}

// ============================================================
// 🕐 聊天相关时间戳（排序 + 显示）
// ============================================================

/**
 * 生成完整时间戳（排序用，精确到秒）
 * @returns time: 'HH:mm'（显示）
 *          fullTime: 'YYYY-MM-DD HH:mm:ss'（排序）
 *          createdAt: ISO 字符串（排序兜底）
 */
export const getBeijingTimestamp = (): {
  time: string
  fullTime: string
  createdAt: string
} => {
  const now = new Date()
  return {
    time: formatBeijingTime(now),
    fullTime: formatBeijingDateTime(now),
    createdAt: now.toISOString()
  }
}

/**
 * 从 content 前缀解析时间，兼容 [YYYY-MM-DD HH:mm] 和 [YYYY-MM-DD HH:mm:ss]
 * 无前缀则用当前北京时间兜底
 */
export const parseTimeFromContent = (
  content: string
): { time: string; fullTime: string; cleanContent: string } => {
  const timeMatch = content.match(
    /^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)\]\s*/
  )
  if (timeMatch) {
    let fullTime = timeMatch[1]
    if (fullTime.length === 16) fullTime += ':00' // 旧数据补秒
    const time = fullTime.slice(11, 16)
    const cleanContent = content.replace(/^\[[\d\-:\s]+\]\s*/, '')
    return { time, fullTime, cleanContent }
  }
  const { time, fullTime } = getBeijingTimestamp()
  return { time, fullTime, cleanContent: content }
}

/** 服务端存库时间戳（北京时间，精确到秒） */
export const getServerTimestamp = (): string =>
  formatBeijingDateTime(new Date())

// ============================================================
// 🕐 通用格式化（保留原签名，内部改用 Intl，结果不变）
// ============================================================

/**
 * 兼容原 formatDate 签名。
 * isShowYear: 带年；isPrecise: 带时分。
 * 输出示例：
 *   默认         → '10-23'
 *   isShowYear   → '2026-10-23'
 *   isPrecise    → '10-23 - 16:28'
 *   both         → '2026-10-23 - 16:28'
 */
export const formatDate = (
  time: Date | string | number,
  config?: { isShowYear?: boolean; isPrecise?: boolean }
): string => {
  const date = new Date(time)
  const parts = dateTimeFormatter.formatToParts(date)
  const year = getPart(parts, 'year')
  const month = getPart(parts, 'month')
  const day = getPart(parts, 'day')
  const dateText = config?.isShowYear
    ? `${year}-${month}-${day}`
    : `${month}-${day}`
  if (!config?.isPrecise) return dateText
  return `${dateText} - ${getPart(parts, 'hour')}:${getPart(parts, 'minute')}`
}
