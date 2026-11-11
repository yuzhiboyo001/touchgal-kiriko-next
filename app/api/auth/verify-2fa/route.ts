import { z } from 'zod'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { generateKunToken } from '~/app/api/utils/jwt'
import { kunCookieOptions } from '~/app/api/utils/cookieOptions'
import { prisma } from '~/prisma/index'
import { getRedirectConfig } from '~/app/api/admin/setting/redirect/getRedirectConfig'
import { updateUserLastLoginTime } from '~/app/api/user/status/service'
import { Totp } from 'time2fa'
import { parseCookies } from '~/utils/cookies'
import { verify2FA } from '~/app/api/utils/verify2FA'
import { verifyLogin2FASchema } from '~/validations/auth'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'
import { checkRateLimit } from '~/lib/rateLimit'
import { getDailyCheckInValue } from '~/utils/time'
import { getGlobalCapabilities } from '~/lib/permissions'
import type { UserState } from '~/store/userStore'

const verifyLogin2FA = async (
  input: z.infer<typeof verifyLogin2FASchema>,
  uid: number,
  context: { ip: string; userAgent: string }
) => {
  const { token, isBackupCode } = input

  const user = await prisma.user.findUnique({
    where: { id: uid }
  })

  if (!user || !user.enable_2fa) {
    return '用户未启用 2FA'
  }

  let isValid = false

  if (isBackupCode) {
    const affected = await prisma.$executeRaw`
      UPDATE "user"
      SET two_factor_backup = array_remove(two_factor_backup, ${token})
      WHERE id = ${uid}
        AND enable_2fa = true
        AND ${token} = ANY(two_factor_backup)
    `
    isValid = affected === 1
  } else {
    isValid = Totp.validate({
      passcode: token,
      secret: user.two_factor_secret
    })
  }

  if (!isValid) {
    return '验证码无效'
  }

  const cookie = await cookies()
  cookie.delete('kun-galgame-patch-moe-2fa-token')

  const accessToken = await generateKunToken(
    user.id,
    user.name,
    user.role,
    '30d',
    context
  )
  cookie.set(
    'kun-galgame-patch-moe-token',
    accessToken,
    kunCookieOptions(30 * 24 * 60 * 60)
  )
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
    capabilities: getGlobalCapabilities(user.role)
  }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, verifyLogin2FASchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const tempToken = parseCookies(req.headers.get('cookie') ?? '')[
    'kun-galgame-patch-moe-2fa-token'
  ]
  if (!tempToken) {
    return NextResponse.json('未找到临时令牌')
  }
  const payload = verify2FA(tempToken)
  if (!payload) {
    return NextResponse.json('2FA 临时令牌已过期, 时效为 10 分钟')
  }

  const ip = getRemoteIp(req.headers)
  const rate = await checkRateLimit({
    key: `verify-2fa:${ip || 'unknown'}`,
    limit: 10,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('操作太频繁，请稍后再试')
  }

  const response = await verifyLogin2FA(input, payload.id, {
    ip,
    userAgent: req.headers.get('user-agent') ?? ''
  })
  return NextResponse.json(response)
}
