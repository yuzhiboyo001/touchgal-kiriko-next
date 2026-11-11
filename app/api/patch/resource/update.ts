import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceUpdateSchema } from '~/validations/patch'
import { markdownToHtml } from '~/app/api/utils/render/markdownToHtml'
import { recalcPatchType } from './_helper'
import { invalidateResourceListCache } from '~/app/api/resource/cache'
import type { PatchResource } from '~/types/api/patch'
import { canDeleteResource, canEditResource } from '~/lib/permissions'
import type { ResourceHealthStatus } from '~/constants/resource'

export const updatePatchResource = async (
  input: z.infer<typeof patchResourceUpdateSchema>,
  uid: number,
  userRole: number
) => {
  const { resourceId, patchId, links, ...resourceData } = input
  const resource = await prisma.patch_resource.findUnique({
    where: { id: resourceId },
    include: {
      links: {
        orderBy: { sort_order: 'asc' }
      }
    }
  })
  if (!resource) {
    return '未找到该资源'
  }

  if (!canEditResource({ uid, role: userRole }, resource.user_id)) {
    return '您没有权限更改该资源'
  }

  const currentPatch = await prisma.patch.findUnique({
    where: { id: patchId },
    select: { name: true }
  })
  if (!currentPatch) {
    return '未找到该资源对应的 Galgame 信息, 请确认 Galgame 存在'
  }

  const existingLinksById = new Map(
    resource.links.map((link) => [link.id, link])
  )

  // 直接组装要更新的链接
  const preparedLinks = links.map((link, index) => {
    const existingLink =
      typeof link.id === 'number' ? existingLinksById.get(link.id) : null

    return {
      storage: link.storage,
      size: link.size,
      code: link.code,
      password: link.password,
      hash: link.hash,
      s3_key: '', // 彻底废弃
      content: link.content,
      sort_order: index,
      download: existingLink?.download ?? 0
    }
  })

  const updatedResource = await prisma.$transaction(async (prisma) => {
    const newResource = await prisma.patch_resource.update({
      where: { id: resourceId },
      data: {
        ...resourceData,
        links: {
          deleteMany: {},
          create: preparedLinks
        }
      },
      include: {
        user: {
          include: {
            _count: {
              select: { patch_resource: true }
            }
          }
        },
        patch: {
          select: {
            unique_id: true
          }
        },
        links: {
          orderBy: { sort_order: 'asc' }
        }
      }
    })

    await prisma.patch.update({
      where: { id: patchId },
      data: { resource_update_time: new Date() }
    })
    await recalcPatchType(patchId, prisma)

    const resourceResponse: PatchResource = {
      id: newResource.id,
      name: newResource.name,
      section: newResource.section,
      uniqueId: newResource.patch.unique_id,
      isOfficial: newResource.is_official,
      type: newResource.type,
      language: newResource.language,
      note: newResource.note,
      noteHtml: newResource.note ? await markdownToHtml(newResource.note) : '',
      platform: newResource.platform,
      links: newResource.links.map((link) => ({
        id: link.id,
        storage: link.storage,
        size: link.size,
        code: link.code,
        password: link.password,
        hash: link.hash,
        content: link.content,
        sortOrder: link.sort_order,
        download: link.download,
        healthStatus: link.health_status as ResourceHealthStatus,
        lastCheckedAt: link.last_checked_at?.toISOString() ?? null,
        lastOkAt: link.last_ok_at?.toISOString() ?? null,
        checkErrno: link.check_errno,
        checkMessage: link.check_message,
        remoteMd5: link.remote_md5,
        remoteSize: link.remote_size,
        failCount: link.fail_count
      })),
      likeCount: 0,
      isLike: false,
      status: newResource.status,
      userId: newResource.user_id,
      patchId: newResource.patch_id,
      created: String(newResource.created),
      canEdit: canEditResource({ uid, role: userRole }, newResource.user_id),
      canDelete: canDeleteResource(
        { uid, role: userRole },
        newResource.user_id
      ),
      user: {
        id: newResource.user.id,
        name: newResource.user.name,
        avatar: newResource.user.avatar,
        patchCount: newResource.user._count.patch_resource,
        role: newResource.user.role
      }
    }

    return resourceResponse
  })

  const wasListed = resource.status === 0 && resource.section === 'patch'
  const isListed =
    updatedResource.status === 0 && updatedResource.section === 'patch'
  if (wasListed || isListed) {
    await invalidateResourceListCache()
  }

  return updatedResource
}
