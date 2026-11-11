import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { deleteKunToken } from '~/app/api/utils/jwt'
import { invalidateResourceListCache } from '~/app/api/resource/cache'
import { deletePrefixFromS3 } from '~/lib/s3'

const userIdSchema = z.object({
  uid: z.coerce.number({ message: '用户 ID 必须为数字' }).min(1).max(9999999)
})

export const deleteUser = async (
  input: z.infer<typeof userIdSchema>,
  uid: number
) => {
  const user = await prisma.user.findUnique({
    where: { id: input.uid },
    select: { id: true, name: true, email: true, role: true, status: true }
  })
  if (!user) {
    return '未找到用户'
  }
  if (input.uid === uid) {
    return '请勿删除自己'
  }
  if (user.role >= 4) {
    return '不能删除超级管理员'
  }

  const admin = await prisma.user.findUnique({
    where: { id: uid },
    select: { id: true, name: true }
  })
  if (!admin) {
    return '未找到管理员'
  }

  // 删除了查询 s3 资源的逻辑

  const publicResourceCount = await prisma.patch_resource.count({
    where: {
      user_id: input.uid,
      section: 'patch',
      status: 0
    }
  })

  const result = await prisma.$transaction(
    async (prisma) => {
      // following_id 的外键是 ON DELETE RESTRICT；不先清理会导致
      // 有粉丝的用户无法删除
      await prisma.user_follow_relation.deleteMany({
        where: { following_id: input.uid }
      })

      await prisma.user.delete({
        where: { id: input.uid }
      })

      await prisma.admin_log.create({
        data: {
          type: 'delete',
          user_id: uid,
          content: `管理员 ${admin.name} 删除了一个用户\n\n${JSON.stringify(user)}`
        }
      })

      return {}
    },
    { timeout: 60000 }
  )

  await deleteKunToken(input.uid)
  if (publicResourceCount > 0) {
    await invalidateResourceListCache()
  }

  // 数据库删除成功后再异步清理 R2，失败不阻塞账号删除
  void Promise.allSettled([
    deletePrefixFromS3(`user/avatar/user_${input.uid}/`),
    deletePrefixFromS3(`user/image/${input.uid}/`)
  ]).then((items) => {
    for (const item of items) {
      if (item.status === 'rejected') {
        console.error('删除用户 R2 资源失败:', item.reason)
      }
    }
  })

  return result
}
