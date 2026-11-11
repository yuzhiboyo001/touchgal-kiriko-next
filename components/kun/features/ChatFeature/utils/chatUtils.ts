// features/ChatFeature/utils/chatUtils.ts

import { formatDate, getBeijingNow } from '~/utils/time'
export { formatDate, getBeijingNow } from '~/utils/time'

// 专门用于消息的时间格式化
export const formatMessageTime = (fullTime?: string) => {
  if (fullTime) {
    // 如果已经有完整时间，只取时分
    return fullTime.split(' ')[1] || fullTime
  }
  // 否则用当前北京时间
  return formatDate(getBeijingNow(), { isPrecise: true }).split(' - ')[1]
}

// 获取消息显示时间（用于 title 属性）
export const getMessageFullTime = (fullTime?: string) => {
  if (fullTime) return fullTime
  return formatDate(getBeijingNow(), { isPrecise: true, isShowYear: true })
}
