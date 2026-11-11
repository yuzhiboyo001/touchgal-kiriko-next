// app/api/achievements/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { getUserAchievements } from '~/components/kun/KirikoStandee/achievements'

export async function GET(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: '未登录' },
      { status: 401 }
    )
  }

  try {
    const achievements = await getUserAchievements(payload.uid)
    return NextResponse.json({
      success: true,
      data: achievements
    })
  } catch (error) {
    console.error('获取成就失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
