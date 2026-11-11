import { prisma } from '~/prisma/index'

export type KirikoAiTier = 'free' | 'ops'

/**
 * AI 网关分层：
 * - 管理员、超管、有效期内支持者使用 ops key
 * - 普通用户使用 free key
 *
 * 只允许服务端根据 cookie 中的 uid 计算，不能相信客户端传值。
 */
export const getKirikoAiTier = async (
  uid: number,
  role: number
): Promise<KirikoAiTier> => {
  if (role >= 3) {
    return 'ops'
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { donor_until: true }
  })

  if (user?.donor_until && user.donor_until.getTime() > Date.now()) {
    return 'ops'
  }

  return 'free'
}
