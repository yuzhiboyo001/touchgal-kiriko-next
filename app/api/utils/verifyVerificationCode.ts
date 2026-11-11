import { consumeKvIfEqual } from '~/lib/redis'
import { checkRateLimit } from '~/lib/rateLimit'

export const verifyVerificationCode = async (
  email: string,
  userProvidedCode: string
): Promise<boolean> => {
  const rate = await checkRateLimit({
    key: `verify-email-code:${email}`,
    limit: 10,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return false
  }

  try {
    // 校验成功后原子删除，避免同一验证码在 10 分钟内重复使用。
    return await consumeKvIfEqual(email, userProvidedCode)
  } catch (error) {
    console.error('验证码校验失败:', error)
    return false
  }
}
