// app/api/auth/captcha/verify.ts

import { randomBytes } from 'crypto'
import { delKv, getKv, setKv } from '~/lib/redis'
import {
  KUN_CAPTCHA_VERIFY_TOKEN_BYTES,
  KUN_CAPTCHA_VERIFY_TOKEN_TTL_SECONDS,
  kunCaptchaVerifyTokenRegex
} from '~/constants/captcha'

const generateCaptchaVerifyToken = () => {
  return randomBytes(KUN_CAPTCHA_VERIFY_TOKEN_BYTES).toString('hex')
}

export const verifyCaptcha = async (sessionId: string, answer: number) => {
  const session = await getKv(`captcha:generate:${sessionId}`)
  await delKv(`captcha:generate:${sessionId}`)

  if (!session) {
    return '未找到您的验证请求, 请重新验证'
  }

  const { answer: correctAnswer } = JSON.parse(session) as { answer: number }

  if (answer !== correctAnswer) {
    return '回答错误, 请重试'
  }

  const randomCode = generateCaptchaVerifyToken()
  await setKv(
    `captcha:verify:${randomCode}`,
    'captcha',
    KUN_CAPTCHA_VERIFY_TOKEN_TTL_SECONDS
  )

  return { code: randomCode }
}

// ========== 保持原样，登录 API 用 ==========
export const checkKunCaptchaExist = async (sessionId: string) => {
  const captchaToken = sessionId.trim()
  if (!kunCaptchaVerifyTokenRegex.test(captchaToken)) {
    return
  }

  const captcha = await getKv(`captcha:verify:${captchaToken}`)
  if (captcha) {
    await delKv(`captcha:verify:${captchaToken}`)
    return captcha
  }
}
