// app/api/conversation/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MemoryService } from '../../../../server/memoryService'
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
    const rawLimit = parseInt(searchParams.get('limit') || '30')
    const limit = Math.min(
      Math.max(Number.isFinite(rawLimit) ? rawLimit : 30, 1),
      100
    )
    // ✅ 新增 order 参数，默认 desc（最新的在前）
    const order = searchParams.get('order') || 'desc'
    const beforeId = searchParams.get('beforeId')?.trim() || undefined

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

    // ✅ 传递 order 参数
    const history = await MemoryService.getConversationHistory(
      userId,
      character,
      limit,
      order,
      beforeId
    )
    return NextResponse.json({
      success: true,
      data: history.messages,
      hasMore: history.hasMore
    })
  } catch (error) {
    console.error('加载对话历史失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
