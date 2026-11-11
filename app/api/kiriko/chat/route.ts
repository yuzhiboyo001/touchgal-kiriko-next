import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { checkRateLimit } from '~/lib/rateLimit'
import { kirikoInternalFetch } from '~/lib/kiriko/internal'
import { getKirikoAiTier } from '~/lib/kiriko/aiTier'
import {
  KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES,
  KIRIKO_CHAT_RATE_LIMIT_PER_MINUTE,
  KIRIKO_MAX_BRAIN_MEMORIES
} from '~/config/kiriko'
import {
  CHAT_UNLOCK_AFFECTION,
  CHAT_UNLOCK_LEVEL,
  getLevel
} from '~/components/kun/KirikoStandee/affection/constants'

const CHARACTERS = new Set(['rin', 'sayo', 'shunv'])
const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_MESSAGES = KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES
const MAX_MEMORIES = KIRIKO_MAX_BRAIN_MEMORIES

export async function POST(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录', { status: 401 })
  }

  if (payload.role < 3) {
    const profile = await prisma.kiriko_profile.findUnique({
      where: { user_id: payload.uid },
      select: { affection: true }
    })
    const affection = profile?.affection ?? 0

    if (getLevel(affection) < CHAT_UNLOCK_LEVEL) {
      return NextResponse.json(
        `好感度达到 Lv.${CHAT_UNLOCK_LEVEL}（${CHAT_UNLOCK_AFFECTION}）后解锁聊天，当前 ${affection}/${CHAT_UNLOCK_AFFECTION}`,
        { status: 403 }
      )
    }
  }

  const rate = await checkRateLimit({
    key: `kiriko-chat:${payload.uid}`,
    limit: KIRIKO_CHAT_RATE_LIMIT_PER_MINUTE,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('对话太频繁，请稍后再试', { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json('请求格式错误', { status: 400 })
  }

  const character = body.character
  const message = body.message
  if (
    typeof character !== 'string' ||
    !CHARACTERS.has(character) ||
    typeof message !== 'string' ||
    message.length < 1 ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return NextResponse.json('请求参数错误', { status: 400 })
  }

  const conversations = Array.isArray(body.conversations)
    ? body.conversations.slice(-MAX_HISTORY_MESSAGES)
    : []
  const memories = Array.isArray(body.memories)
    ? body.memories.slice(-MAX_MEMORIES)
    : []

  try {
    const aiTier = await getKirikoAiTier(payload.uid, payload.role)

    try {
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
              tier: aiTier,
              error:
                aiTier === 'free'
                  ? '本站本月的 AI 免费额度已全部耗尽'
                  : 'AI 服务额度已耗尽'
            },
            { status: 402 }
          )
        }
      }
    } catch {
      // 状态查询失败时继续走 Python，Python 自己也会检查锁
    }

    const response = await kirikoInternalFetch('/chat', {
      character,
      message,
      user_id: String(payload.uid),
      user_name: payload.name,
      conversations,
      memories,
      user_location:
        typeof body.user_location === 'string'
          ? body.user_location.slice(0, 50)
          : undefined,
      chat_mode: body.chat_mode === 'offline' ? 'offline' : 'online',
      ai_tier: aiTier
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Kiriko chat proxy 失败:', error)
    return NextResponse.json('聊天服务暂时不可用', { status: 502 })
  }
}
