// app/api/brain-memory/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { MemoryService } from '~/server/memoryService'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { KIRIKO_MAX_BRAIN_MEMORY_LENGTH } from '~/config/kiriko'

const CHARACTERS = new Set(['rin', 'sayo', 'shunv'])

const getCharacter = (value: unknown) =>
  typeof value === 'string' && CHARACTERS.has(value) ? value : ''

export async function GET(request: NextRequest) {
  const payload = await verifyHeaderCookie(request)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: '未登录' },
      { status: 401 }
    )
  }

  const character = getCharacter(request.nextUrl.searchParams.get('character'))
  if (!character) {
    return NextResponse.json(
      { success: false, error: '缺少必要参数' },
      { status: 400 }
    )
  }

  // 只允许读取当前登录用户自己的记忆，忽略客户端传入的 userId
  const result = await MemoryService.loadBrainMemories(payload.uid, character)
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const payload = await verifyHeaderCookie(request)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: '未登录' },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { success: false, error: '请求格式错误' },
      { status: 400 }
    )
  }

  const {
    action,
    character: rawCharacter,
    content,
    memories: structuredMemories
  } = body
  const character = getCharacter(rawCharacter)
  if (!character) {
    return NextResponse.json(
      { success: false, error: '缺少必要参数' },
      { status: 400 }
    )
  }

  switch (action) {
    case 'add': {
      if (typeof content !== 'string' || !content.trim()) {
        return NextResponse.json(
          { success: false, error: '内容不能为空' },
          { status: 400 }
        )
      }
      if (content.length > KIRIKO_MAX_BRAIN_MEMORY_LENGTH) {
        return NextResponse.json(
          {
            success: false,
            error: `单条记忆不能超过 ${KIRIKO_MAX_BRAIN_MEMORY_LENGTH} 字`
          },
          { status: 400 }
        )
      }

      const result = await MemoryService.addBrainMemory(
        payload.uid,
        character,
        content.trim()
      )
      return NextResponse.json(result)
    }

    case 'sync': {
      if (!structuredMemories || typeof structuredMemories !== 'object') {
        return NextResponse.json(
          { success: false, error: '记忆数据格式错误' },
          { status: 400 }
        )
      }
      const result = await MemoryService.syncBrainMemories(
        payload.uid,
        character,
        structuredMemories
      )
      return NextResponse.json(result)
    }

    case 'clear': {
      const result = await MemoryService.clearBrainMemories(
        payload.uid,
        character
      )
      return NextResponse.json(result)
    }

    default:
      return NextResponse.json(
        { success: false, error: '未知操作' },
        { status: 400 }
      )
  }
}
