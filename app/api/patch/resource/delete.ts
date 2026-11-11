import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { recalcPatchType } from './_helper'
import { invalidateResourceListCache } from '~/app/api/resource/cache'
import { invalidateUserSession } from '~/app/api/user/session/cache'
import { canDeleteResource } from '~/lib/permissions'

const resourceIdSchema = z.object({
  resourceId: z.coerce
    .number({ message: '资源 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export const deleteResource = async (
  input: z.infer<typeof resourceIdSchema>,
  uid: number,
  userRole: number
) => {
  const patchResource = await prisma.patch_resource.findUnique({
    where: { id: input.resourceId }
  })
  if (!patchResource) {
    return '未找到对应的资源'
  }

  const resourceUserUid = patchResource.user_id
  if (!canDeleteResource({ uid, role: userRole }, patchResource.user_id)) {
    return '您没有权限删除该资源'
  }

  const response = await prisma.$transaction(async (prisma) => {
    await prisma.user.update({
      where: { id: resourceUserUid },
      data: { moemoepoint: { increment: -3 } }
    })

    await prisma.patch_resource.delete({
      where: { id: input.resourceId }
    })
    await recalcPatchType(patchResource.patch_id, prisma)
    return {}
  })
  await invalidateUserSession(resourceUserUid)

  if (patchResource.status === 0 && patchResource.section === 'patch') {
    await invalidateResourceListCache()
  }

  return response
}
