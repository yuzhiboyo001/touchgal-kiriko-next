// app/api/conversation/unsummarized/route.ts
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

    // ✅ 获取未总结的对话（按轮次分组，每轮取用户消息和助手消息）
    const turns = await prisma.conversation_log.findMany({
      where: {
        user_id: userId,
        character: character,
        is_summarized: false
      },
      orderBy: {
        turn_number: 'asc'
      },
      select: {
        turn_number: true,
        role: true,
        content: true
      }
    })

    return NextResponse.json({ success: true, data: turns })
  } catch (error) {
    console.error('获取未总结对话失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
