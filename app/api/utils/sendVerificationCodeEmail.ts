// app/api/utils/sendVerificationCodeEmail.ts

import { getRemoteIp } from './getRemoteIp'
import { getKv, setKv } from '~/lib/redis'
import { generateRandomString } from '~/utils/random'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { createKunVerificationEmailTemplate } from '~/constants/email/verify-templates'
import { sendMail } from '~/lib/mail'

export const sendVerificationCodeEmail = async (
  headers: Headers,
  email: string,
  type: 'register' | 'forgot' | 'reset'
) => {
  const ip = getRemoteIp(headers)

  // 限流（保持原逻辑）
  const limitEmail = await getKv(`limit:email:${email}`)
  const limitIP = await getKv(`limit:ip:${ip}`)
  if (limitEmail || limitIP) {
    return '您发送邮件的频率太快了, 请 60 秒后重试'
  }

  const code = generateRandomString(7)

  await setKv(email, code, 10 * 60)
  await setKv(`limit:email:${email}`, code, 60)
  await setKv(`limit:ip:${ip}`, code, 60)

  try {
    await sendMail({
      to: email,
      subject: `${kunMoyuMoe.titleShort} - 验证码`,
      html: createKunVerificationEmailTemplate(type, code),
      text: `您的验证码是：${code}，10 分钟内有效`
    })
    return
  } catch (error) {
    console.error('SMTP 发送失败:', error)
    return '邮件发送失败，请稍后重试'
  }
}
