import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { deleteKunToken } from '~/app/api/utils/jwt'
import { invalidateUserSession } from '~/app/api/user/session/cache'
import { deleteUser } from '~/app/api/admin/user/delete'
import {
  manageDeleteUserSchema,
  manageUpdateUserSchema
} from '~/validations/manage'

export const updateManagedUser = async (
  input: z.infer<typeof manageUpdateUserSchema>,
  actorUid: number
) => {
  const { uid, name, bio, status, banReason } = input

  const target = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      status: true,
      daily_image_count: true
    }
  })
  if (!target) {
    return '未找到该用户'
  }
  if (target.id === actorUid) {
    return '不能通过用户管理修改自己'
  }
  if (target.role >= 3) {
    return '不能编辑管理员或超级管理员'
  }

  if (name !== target.name) {
    const existing = await prisma.user.findUnique({
      where: { name },
      select: { id: true }
    })
    if (existing) {
      return '该用户名已被其他用户使用'
    }
  }

  const actor = await prisma.user.findUnique({
    where: { id: actorUid },
    select: { name: true }
  })
  if (!actor) {
    return '未找到该管理员'
  }

  const statusChanged = status !== target.status
  const reasonText = banReason?.trim()

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: uid },
      data: {
        name,
        bio,
        status
      }
    })

    await tx.admin_log.create({
      data: {
        type: 'update',
        user_id: actorUid,
        content: `管理员 ${actor.name} 修改了用户 ${target.name}（ID ${target.id}）的信息\n\n修改内容:\n${JSON.stringify(
          {
            name,
            bio,
            status,
            ...(reasonText ? { banReason: reasonText } : {})
          }
        )}\n\n原用户信息:\n${JSON.stringify(target)}`
      }
    })
  })

  if (name !== target.name || statusChanged) {
    await deleteKunToken(uid)
  }
  await invalidateUserSession(uid)

  return { name, bio, status }
}

export const deleteManagedUser = async (
  input: z.infer<typeof manageDeleteUserSchema>,
  actorUid: number
) => {
  const target = await prisma.user.findUnique({
    where: { id: input.uid },
    select: { id: true, name: true, role: true }
  })
  if (!target) {
    return '未找到该用户'
  }
  if (target.id === actorUid) {
    return '不能删除自己'
  }
  if (target.role >= 3) {
    return '不能删除管理员或超级管理员'
  }
  if (target.name !== input.confirmName) {
    return '用户名不匹配，已取消删除'
  }

  return deleteUser({ uid: target.id }, actorUid)
}
