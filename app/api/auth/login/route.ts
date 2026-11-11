import { z } from 'zod'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken' // 👈 新增导入
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  needsPasswordRehash,
  verifyPassword
} from '~/app/api/utils/algorithm'
import {
  generateKunStatelessToken,
  generateKunToken
} from '~/app/api/utils/jwt'
import { kunCookieOptions } from '~/app/api/utils/cookieOptions'
import { loginSchema } from '~/validations/auth'
import { prisma } from '~/prisma/index'
import { checkKunCaptchaExist } from '~/app/api/utils/verifyKunCaptcha'
import { getRedirectConfig } from '~/app/api/admin/setting/redirect/getRedirectConfig'
import { checkRateLimit } from '~/lib/rateLimit'
import { updateUserLastLoginTime } from '~/app/api/user/status/service'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'
import { getDailyCheckInValue } from '~/utils/time'
import { getGlobalCapabilities } from '~/lib/permissions'
import type { UserState } from '~/store/userStore'
import type { AuthUserState } from '~/types/api/session'

const upgradePasswordHash = async (
  userId: number,
  password: string,
  previousPasswordHash: string
) => {
  try {
    await prisma.user.updateMany({
      where: { id: userId, password: previousPasswordHash },
      data: { password: await hashPassword(password) }
    })
  } catch {
    return
  }
}

const login = async (
  input: z.infer<typeof loginSchema>,
  context: { ip: string; userAgent: string }
): Promise<AuthUserState | ({ require2FA: boolean } & KunUser) | string> => {
  const { name, password, captcha } = input
  const res = await checkKunCaptchaExist(captcha)
  if (!res) {
    return '人机验证无效, 请完成人机验证'
  }

  const normalizedName = name.toLowerCase()
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: normalizedName, mode: 'insensitive' } },
        { name: { equals: normalizedName, mode: 'insensitive' } }
      ]
    }
  })

  // 必须校验密码；用户不存在时也跑一次 dummy hash，避免时序枚举
  const isPasswordValid = await verifyPassword(
    password,
    user?.password ?? DUMMY_PASSWORD_HASH
  )
  if (!user || !isPasswordValid) {
    return '用户名或密码错误'
  }
  if (user.status === 2) {
    return '该用户已被封禁, 如果您觉得有任何问题, 请联系我们'
  }

  if (needsPasswordRehash(user.password)) {
    await upgradePasswordHash(user.id, password, user.password)
  }

  if (user.enable_2fa) {
    const tempToken = generateKunStatelessToken(
      { id: user.id, require2FA: true },
      10 * 60
    )
    const cookie = await cookies()
    cookie.set(
      'kun-galgame-patch-moe-2fa-token',
      tempToken,
      kunCookieOptions(10 * 60)
    )
    return {
      require2FA: true,
      id: user.id,
      name: user.name,
      avatar: user.avatar
    }
  }

  const token = await generateKunToken(
    user.id,
    user.name,
    user.role,
    '30d',
    context
  )
  const cookie = await cookies()

  // 1. 写入主站原本的 Cookie
  cookie.set(
    'kun-galgame-patch-moe-token',
    token,
    kunCookieOptions(30 * 24 * 60 * 60)
  )

  // 🚀 2. 写入 Flarum 论坛识别的 SSO JWT Cookie
  // 论坛已砍掉时可以不配置 FLARUM_JWT_SECRET；配置了才写 Cookie
  const flarumSecret = process.env.FLARUM_JWT_SECRET
  if (flarumSecret) {
    const flarumToken = jwt.sign(
      {
        id: user.id,
        username: user.name,
        // 确保 user.email 存在，否则用虚拟邮箱兜底
        email: user.email || `user${user.id}@galgame.local`
      },
      flarumSecret,
      { algorithm: 'HS256', expiresIn: '30d' }
    )

    cookie.set('flarum', flarumToken, {
      path: '/',
      httpOnly: false, // 必须为 false，以便论坛读取
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    })
  }

  await updateUserLastLoginTime(user.id)

  const redirectConfig = await getRedirectConfig()
  const responseData: UserState = {
    uid: user.id,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    moemoepoint: user.moemoepoint,
    coins: 0,
    role: user.role,
    dailyCheckIn: getDailyCheckInValue(user.last_check_in_date),
    dailyImageLimit: user.daily_image_count,
    dailyUploadLimit: user.daily_upload_size,
    enableEmailNotice: user.enable_email_notice,
    allowPrivateMessage: user.allow_private_message,
    blockedTagIds: user.blocked_tag_ids,
    ...redirectConfig
  }

  return {
    ...responseData,
    capabilities: getGlobalCapabilities(user.role),
    require2FA: false
  }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, loginSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const ip = getRemoteIp(req.headers)
  const rate = await checkRateLimit({
    key: `login:${ip || 'unknown'}`,
    limit: 10,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('操作太频繁，请稍后再试')
  }

  const response = await login(input, {
    ip,
    userAgent: req.headers.get('user-agent') ?? ''
  })
  return NextResponse.json(response)
}
