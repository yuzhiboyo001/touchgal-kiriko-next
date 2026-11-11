import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { invalidateResourceListCache } from '~/app/api/resource/cache'
import { deleteFileFromS3 } from '~/lib/s3'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const deletePatchById = async (input: z.infer<typeof patchIdSchema>) => {
  const { patchId } = input

  const patch = await prisma.patch.findUnique({
    where: { id: patchId }
  })
  if (!patch) {
    return '未找到该游戏'
  }

  const [patchResources, tagRelations] = await Promise.all([
    prisma.patch_resource.findMany({
      where: { patch_id: patchId }
    }),
    prisma.patch_tag_relation.findMany({
      where: { patch_id: patchId },
      select: { tag_id: true }
    })
  ])
  const affectedTagIds = [...new Set(tagRelations.map((rel) => rel.tag_id))]

  const response = await prisma.$transaction(async (prisma) => {
    if (patchResources.length > 0) {
      await prisma.patch_resource.deleteMany({
        where: { patch_id: patchId }
      })
    }

    await prisma.patch.delete({
      where: { id: patchId }
    })

    // patch 删除后关系已被级联删除，按真实关系重算，避免历史漂移
    for (const tagId of affectedTagIds) {
      const count = await prisma.patch_tag_relation.count({
        where: { tag_id: tagId }
      })
      await prisma.patch_tag.update({
        where: { id: tagId },
        data: { count }
      })
    }

    return {}
  })

  if (
    patchResources.some(
      (resource) => resource.status === 0 && resource.section === 'patch'
    )
  ) {
    await invalidateResourceListCache()
  }

  // 不影响删除响应；失败只记录，R2 孤儿文件后续可清理
  void Promise.allSettled(
    ['banner.avif', 'banner-mini.avif', 'banner-full.avif'].map((fileName) =>
      deleteFileFromS3(`patch/${patchId}/banner/${fileName}`)
    )
  ).then((results) => {
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('删除 patch banner 失败:', result.reason)
      }
    }
  })

  return response
}
