// app/api/auth/captcha/generate.ts

import crypto from 'crypto'
import { setKv } from '~/lib/redis'
import { KUN_CAPTCHA_POOL } from '~/constants/captcha'

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const generateCaptcha = async (excludeId?: string) => {
  // 排除上一题
  let candidates = KUN_CAPTCHA_POOL
  if (excludeId) {
    const filtered = KUN_CAPTCHA_POOL.filter((q) => q.id !== excludeId)
    // 兜底：万一题库只有 1 道，filter 后为空
    if (filtered.length > 0) candidates = filtered
  }

  const question = candidates[Math.floor(Math.random() * candidates.length)]

  // 打乱选项
  const indexed = question.options.map((opt, i) => ({
    opt,
    isAnswer: i === question.answer
  }))
  const shuffled = shuffle(indexed)
  const newAnswer = shuffled.findIndex((o) => o.isAnswer)

  const sessionId = crypto.randomUUID()

  await setKv(
    `captcha:generate:${sessionId}`,
    JSON.stringify({ questionId: question.id, answer: newAnswer }),
    5 * 60
  )

  return {
    sessionId,
    questionId: question.id, // ← 返回前端，下次换题用
    question: question.question,
    options: shuffled.map((o) => o.opt),
    category: question.category
  }
}
