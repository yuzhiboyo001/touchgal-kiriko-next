// app/api/conversation/last-turn/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyHeaderCookie(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = parseInt(searchParams.get('userId') || '0')
    const character = searchParams.get('character')

    if (!character) {
      return NextResponse.json(
        { success: false, error: '缺少 character 参数' },
        { status: 400 }
      )
    }

    if (userId !== payload.uid) {
      return NextResponse.json(
        { success: false, error: '无权限' },
        { status: 403 }
      )
    }

    const lastLog = await prisma.conversation_log.findFirst({
      where: {
        user_id: userId,
        character: character
      },
      orderBy: {
        turn_number: 'desc'
      },
      select: {
        turn_number: true
      }
    })

    return NextResponse.json({
      success: true,
      turn_number: lastLog?.turn_number || 0
    })
  } catch (error) {
    console.error('获取最后轮次失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
