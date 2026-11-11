// app/api/conversation/log/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { MemoryService } from '../../../../server/memoryService'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { z } from 'zod'
import {
  checkFirstChat,
  checkEternal
} from '~/components/kun/KirikoStandee/achievements'

const conversationLogSchema = z.object({
  userId: z.number(),
  character: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string()
})

// ============================================================
// ✅ 更新连续聊天记录
// ============================================================

const updateChatStreak = async (userId: number): Promise<number> => {
  const { getBeijingToday } = await import('~/utils/time')
  const today = getBeijingToday()

  const profile = await prisma.kiriko_profile.findUnique({
    where: { user_id: userId },
    select: { last_chat_date: true, chat_streak: true }
  })

  if (!profile) return 0

  const lastChatDate = profile.last_chat_date
  const currentStreak = profile.chat_streak || 0

  if (!lastChatDate) {
    await prisma.kiriko_profile.update({
      where: { user_id: userId },
      data: {
        last_chat_date: today,
        chat_streak: 1
      }
    })
    return 1
  }

  const lastDate = new Date(lastChatDate)
  const lastDateUTC = new Date(
    Date.UTC(
      lastDate.getUTCFullYear(),
      lastDate.getUTCMonth(),
      lastDate.getUTCDate()
    )
  )

  const diffDays = Math.floor(
    (today.getTime() - lastDateUTC.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) {
    return currentStreak
  } else if (diffDays === 1) {
    const newStreak = currentStreak + 1
    await prisma.kiriko_profile.update({
      where: { user_id: userId },
      data: {
        last_chat_date: today,
        chat_streak: newStreak
      }
    })
    return newStreak
  } else {
    await prisma.kiriko_profile.update({
      where: { user_id: userId },
      data: {
        last_chat_date: today,
        chat_streak: 1
      }
    })
    return 1
  }
}

// ============================================================
// 📝 POST: 保存对话
// ============================================================

export async function POST(request: NextRequest) {
  console.log('🔵 [Conversation API] 请求开始')

  try {
    const input = await kunParsePostBody(request, conversationLogSchema)
    if (typeof input === 'string') {
      return NextResponse.json(
        { success: false, error: input },
        { status: 400 }
      )
    }

    const payload = await verifyHeaderCookie(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    const { userId, character, role, content } = input

    if (userId !== payload.uid) {
      return NextResponse.json(
        { success: false, error: '无权限' },
        { status: 403 }
      )
    }

    const saveResult = await MemoryService.saveConversation(
      userId,
      character,
      role,
      content
    )

    // ✅ 新解锁的成就列表
    const newAchievements: string[] = []

    if (role === 'user') {
      // ✅ 检查"第一次对话"成就
      const firstChatResult = await checkFirstChat(userId)
      if (firstChatResult.isNew) {
        newAchievements.push('secret_first_chat')
      }

      // ✅ 更新连续聊天记录
      const streak = await updateChatStreak(userId)

      // ✅ 检查"连续 1 年"成就
      const eternalResult = await checkEternal(userId, streak)
      if (eternalResult.isNew) {
        newAchievements.push('secret_eternal')
        console.log('🎉 [Achievement] 解锁: 永恒')
      }
    }

    return NextResponse.json({
      success: true,
      newAchievements,
      turnNumber: saveResult.turn_number,
      chatDailyCount: role === 'user' ? saveResult.dailyCount : undefined
    })
  } catch (error) {
    console.error('❌ 保存对话失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
