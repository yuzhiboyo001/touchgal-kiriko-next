import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { sendVerificationCodeEmail } from '~/app/api/utils/sendVerificationCodeEmail'
import { sendRegisterEmailVerificationCodeSchema } from '~/validations/auth'
import { checkKunCaptchaExist } from '~/app/api/utils/verifyKunCaptcha'
import { prisma } from '~/prisma/index'
import { getKv } from '~/lib/redis'
import { checkRateLimit } from '~/lib/rateLimit'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'
import { KUN_PATCH_DISABLE_REGISTER_KEY } from '~/config/redis'

const sendRegisterCode = async (
  input: z.infer<typeof sendRegisterEmailVerificationCodeSchema>,
  headers: Headers
) => {
  const res = await checkKunCaptchaExist(input.captcha)
  if (!res) {
    return '人机验证无效, 请完成人机验证'
  }

  const isDisableRegister = await getKv(KUN_PATCH_DISABLE_REGISTER_KEY)
  if (isDisableRegister) {
    return '由于网站近日遭受大量攻击，当前时间段暂时不可注册，请明天下午再来，一定要来哦'
  }

  const normalizedName = input.name.toLowerCase()
  const sameUsernameUser = await prisma.user.findFirst({
    where: { name: { equals: normalizedName, mode: 'insensitive' } }
  })
  if (sameUsernameUser) {
    return '您的用户名已经有人注册了, 请修改'
  }

  const sameEmailUser = await prisma.user.findUnique({
    where: { email: input.email }
  })
  if (sameEmailUser) {
    return '您的邮箱已经有人注册了, 请修改'
  }

  const result = await sendVerificationCodeEmail(
    headers,
    input.email,
    'register'
  )
  if (result) {
    return result
  }
  return {}
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(
    req,
    sendRegisterEmailVerificationCodeSchema
  )
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const ip = getRemoteIp(req.headers)
  const rate = await checkRateLimit({
    key: `send-register-code:${ip || 'unknown'}`,
    limit: 5,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('操作太频繁，请稍后再试')
  }

  const response = await sendRegisterCode(input, req.headers)
  return NextResponse.json(response)
}
