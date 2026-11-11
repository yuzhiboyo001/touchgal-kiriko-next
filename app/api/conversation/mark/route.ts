// app/api/conversation/mark/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { z } from 'zod'

const markSchema = z.object({
  userId: z.number(),
  character: z.string(),
  turnNumbers: z.array(z.number()),
  memoryId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const input = await kunParsePostBody(request, markSchema)
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

    const { userId, character, turnNumbers, memoryId } = input

    if (userId !== payload.uid) {
      return NextResponse.json(
        { success: false, error: '无权限' },
        { status: 403 }
      )
    }

    await prisma.conversation_log.updateMany({
      where: {
        user_id: userId,
        character: character,
        turn_number: { in: turnNumbers }
      },
      data: {
        is_summarized: true,
        memory_id: memoryId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('标记对话失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
