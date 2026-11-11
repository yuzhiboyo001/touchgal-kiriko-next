// app/api/user/quota/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'
import { getBeijingToday, isSameBeijingDay } from '~/utils/time'
import { getKirikoChatDailyLimit } from '~/config/kiriko'

export async function GET(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: '未登录' },
      { status: 401 }
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.uid },
      select: {
        chat_daily_count: true,
        chat_last_used_date: true,
        role: true,
        donor_until: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    const maxQuota = getKirikoChatDailyLimit(user.role, user.donor_until)
    const today = getBeijingToday()

    // 只读计算；真正的跨天重置在下一次 saveConversation 写事务里完成。
    const isSameDay = user.chat_last_used_date
      ? isSameBeijingDay(today, new Date(user.chat_last_used_date))
      : false
    const used = isSameDay ? user.chat_daily_count : 0

    return NextResponse.json({
      success: true,
      remaining: Math.max(0, maxQuota - used),
      limit: maxQuota
    })
  } catch (error) {
    console.error('❌ 获取配额失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
