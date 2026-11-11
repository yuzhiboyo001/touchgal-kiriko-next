import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { stepTwoSchema } from '~/validations/forgot'
import { prisma } from '~/prisma/index'
import { hashPassword } from '~/app/api/utils/algorithm'
import { verifyVerificationCode } from '~/app/api/utils/verifyVerificationCode'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'
import { checkRateLimit } from '~/lib/rateLimit'
import { deleteKunToken } from '~/app/api/utils/jwt'

const stepTwo = async (input: z.infer<typeof stepTwoSchema>) => {
  if (input.newPassword !== input.confirmPassword) {
    return '两次密码输入不一致'
  }

  const normalizedInput = input.name.toLowerCase()
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: normalizedInput, mode: 'insensitive' } },
        { name: { equals: normalizedInput, mode: 'insensitive' } }
      ]
    }
  })
  if (!user) {
    return '您的邮箱验证码无效'
  }

  const isCodeValid = await verifyVerificationCode(
    user.email,
    input.verificationCode
  )
  if (!isCodeValid) {
    return '您的邮箱验证码无效'
  }

  const hashedPassword = await hashPassword(input.newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })

  // 密码重置后必须吊销所有旧会话，避免被盗的 30 天 JWT 继续有效。
  try {
    await deleteKunToken(user.id)
  } catch (error) {
    console.error('重置密码后吊销会话失败:', error)
  }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, stepTwoSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const ip = getRemoteIp(req.headers)
  const rate = await checkRateLimit({
    key: `forgot-two:${ip || 'unknown'}`,
    limit: 5,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('操作太频繁，请稍后再试', { status: 429 })
  }

  const response = await stepTwo(input)
  if (typeof response === 'string') {
    return NextResponse.json(response)
  }

  return NextResponse.json({})
}
