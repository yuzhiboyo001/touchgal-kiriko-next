// app/api/affection/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'
import { getLevelProgress } from '~/components/kun/KirikoStandee/affection/constants'

export async function GET(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json(
      { success: false, message: '未登录' },
      { status: 401 }
    )
  }

  try {
    const profile = await prisma.kiriko_profile.findUnique({
      where: { user_id: payload.uid },
      select: {
        character: true,
        affection: true,
        affection_level: true,
        coins: true,
        first_chat_at: true,
        last_chat_at: true,
        purchase_history: true
      }
    })

    if (!profile) {
      return NextResponse.json(
        { success: false, message: '未选择看板娘' },
        { status: 400 }
      )
    }

    // 认识天数直接按 first_chat_at 计算；数据库已删除 total_days 冗余列，
    // API 仍返回 total_days 字段供前端展示。
    const firstChatAt = profile.first_chat_at
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - firstChatAt.getTime())
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const progress = getLevelProgress(
      profile.affection,
      profile.affection_level
    )

    // ✅ 从新表获取成就数量
    const achievementCount = await prisma.kiriko_achievement.count({
      where: { user_id: payload.uid }
    })

    return NextResponse.json({
      success: true,
      data: {
        character: profile.character,
        affection: profile.affection,
        affection_level: profile.affection_level,
        coins: profile.coins,
        total_days: totalDays,
        first_chat_at: profile.first_chat_at,
        last_chat_at: profile.last_chat_at,
        purchase_history: (profile.purchase_history as any)?.purchases || [],
        achievements: achievementCount, // ✅ 返回数量（不是数组）
        progress: progress
      }
    })
  } catch (error) {
    console.error('❌ 获取好感度数据失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
