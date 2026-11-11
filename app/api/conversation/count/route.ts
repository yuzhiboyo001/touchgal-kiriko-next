// app/api/conversation/count/route.ts
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

    // ✅ 检查 character 是否存在
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

    // ✅ 按 turn_number 去重统计，得到未总结的对话轮数
    const distinctTurns = await prisma.conversation_log.findMany({
      where: {
        user_id: userId,
        character: character,
        is_summarized: false
      },
      select: {
        turn_number: true
      },
      distinct: ['turn_number']
    })

    const count = distinctTurns.length

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('获取未总结对话数失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
