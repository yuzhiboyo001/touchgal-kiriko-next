import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { checkRateLimit } from '~/lib/rateLimit'
import { kirikoInternalFetch } from '~/lib/kiriko/internal'
import { getKirikoAiTier } from '~/lib/kiriko/aiTier'
import { verifyBrainMemoryExtraction } from '~/lib/memory/verify'
import type { BrainMemoryExtraction } from '~/types/api/memory'
import {
  KIRIKO_BRAIN_RATE_LIMIT_PER_MINUTE,
  KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES,
  KIRIKO_MAX_BRAIN_MEMORIES
} from '~/config/kiriko'

const CHARACTERS = new Set(['rin', 'sayo', 'shunv'])
const MAX_DIALOGUE_MESSAGES = KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES
const MAX_MEMORIES = KIRIKO_MAX_BRAIN_MEMORIES

export async function POST(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录', { status: 401 })
  }

  const rate = await checkRateLimit({
    key: `kiriko-brain:${payload.uid}`,
    limit: KIRIKO_BRAIN_RATE_LIMIT_PER_MINUTE,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('操作太频繁，请稍后再试', { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json('请求格式错误', { status: 400 })
  }

  const character = body.character
  if (typeof character !== 'string' || !CHARACTERS.has(character)) {
    return NextResponse.json('请求参数错误', { status: 400 })
  }

  const recentDialogue = Array.isArray(body.recent_dialogue)
    ? body.recent_dialogue.slice(-MAX_DIALOGUE_MESSAGES)
    : []
  const existingMemories = Array.isArray(body.existing_memories)
    ? body.existing_memories.slice(-MAX_MEMORIES)
    : []

  try {
    const aiTier = await getKirikoAiTier(payload.uid, payload.role)

    const statusResponse = await kirikoInternalFetch(
      `/ai/status?tier=${encodeURIComponent(aiTier)}`,
      {}
    )
    if (statusResponse.ok) {
      const status = (await statusResponse.json()) as { locked?: boolean }
      if (status.locked) {
        return NextResponse.json(
          {
            success: false,
            code: 'AI_BUDGET_EXHAUSTED',
            error: 'AI 服务额度已耗尽'
          },
          { status: 402 }
        )
      }
    }

    const response = await kirikoInternalFetch('/brain/memory', {
      character,
      user_id: String(payload.uid),
      user_name: payload.name,
      ai_tier: aiTier,
      recent_dialogue: recentDialogue,
      existing_memories: existingMemories,
      total_memories: Number(body.total_memories) || 0,
      max_memories: MAX_MEMORIES,
      user_location:
        typeof body.user_location === 'string'
          ? body.user_location.slice(0, 50)
          : '未指定'
    })
    const data = await response.json()
    if (data?.success && data.memories && typeof data.memories === 'object') {
      data.memories = verifyBrainMemoryExtraction(
        data.memories as BrainMemoryExtraction,
        recentDialogue
      )
    }
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Kiriko brain proxy 失败:', error)
    return NextResponse.json('记忆服务暂时不可用', { status: 502 })
  }
}
