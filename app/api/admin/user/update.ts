import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminUpdateUserSchema } from '~/validations/admin'
import { deleteKunToken } from '~/app/api/utils/jwt'
import { invalidateUserSession } from '~/app/api/user/session/cache'
import { hashPassword } from '~/app/api/utils/algorithm'

export const updateUser = async (
  input: z.infer<typeof adminUpdateUserSchema>,
  adminUid: number
) => {
  const {
    uid,
    dailyImageCount,
    password,
    grantMoemoepoint,
    grantKirikoCoins,
    nameplate,
    donorUntil,
    ...rest
  } = input

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      daily_image_count: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      status: true
    }
  })
  if (!user) {
    return '未找到该用户'
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminUid }
  })
  if (!admin) {
    return '未找到该管理员'
  }
  if (rest.role >= 3 && admin.role < 4) {
    return '设置用户为管理员仅限超级管理员可用'
  }
  if (rest.name !== user.name) {
    const existingUserByName = await prisma.user.findUnique({
      where: { name: rest.name },
      select: { id: true }
    })
    if (existingUserByName) {
      return '该用户名已被其他用户使用'
    }
  }
  if (rest.email !== user.email) {
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: rest.email },
      select: { id: true }
    })
    if (existingUserByEmail) {
      return '该邮箱已被其他用户使用'
    }
  }

  if (grantKirikoCoins > 0) {
    const profile = await prisma.kiriko_profile.findUnique({
      where: { user_id: uid },
      select: { user_id: true }
    })
    if (!profile) {
      return '该用户尚未选择看板娘，无法发放看板娘金币'
    }
  }

  const hashedPassword = password ? await hashPassword(password) : undefined
  const logInput = {
    ...input,
    ...(password ? { password: '[REDACTED]' } : {})
  }

  const result = await prisma.$transaction(async (prisma) => {
    const updatedUser = await prisma.user.update({
      where: { id: uid },
      data: {
        daily_image_count: dailyImageCount,
        ...rest,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        ...(grantMoemoepoint > 0
          ? { moemoepoint: { increment: grantMoemoepoint } }
          : {}),
        ...(nameplate !== undefined ? { nameplate: nameplate || null } : {}),
        ...(donorUntil !== undefined ? { donor_until: donorUntil } : {})
      },
      select: {
        moemoepoint: true,
        kiriko_profile: {
          select: { coins: true }
        }
      }
    })

    if (grantKirikoCoins > 0) {
      await prisma.kiriko_profile.update({
        where: { user_id: uid },
        data: {
          coins: { increment: grantKirikoCoins }
        }
      })
    }

    await prisma.admin_log.create({
      data: {
        type: 'update',
        user_id: adminUid,
        content: `管理员 ${admin.name} 更改了一个用户的信息\n\n更改内容:\n${JSON.stringify(logInput)}\n\n原用户信息:\n${JSON.stringify(user)}`
      }
    })

    return {
      moemoepoint: updatedUser.moemoepoint,
      kirikoCoins:
        (updatedUser.kiriko_profile?.coins ?? 0) +
        (grantKirikoCoins > 0 ? grantKirikoCoins : 0)
    }
  })

  const requiresRelogin =
    Boolean(password) ||
    rest.role !== user.role ||
    rest.status !== user.status ||
    rest.name !== user.name ||
    rest.email !== user.email

  if (requiresRelogin) {
    await deleteKunToken(uid)
  }

  // 金币/萌萌点变更不踢下线，但必须让下一次 session 读取到新余额
  await invalidateUserSession(uid)

  return result
}
