import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceCreateSchema } from '~/validations/patch'
import { createMessage } from '~/app/api/utils/message'
import { markdownToHtml } from '~/app/api/utils/render/markdownToHtml'
import { recalcPatchType } from './_helper'
import { invalidateResourceListCache } from '~/app/api/resource/cache'
import { invalidateUserSession } from '~/app/api/user/session/cache'
import type { ResourceHealthStatus } from '~/constants/resource'
import type { PatchResource } from '~/types/api/patch'

export const createPatchResource = async (
  input: z.infer<typeof patchResourceCreateSchema>,
  uid: number,
  userRole: number
) => {
  const { patchId, type, language, platform, links, ...resourceData } = input

  if (resourceData.section === 'galgame' && userRole < 2) {
    return '仅创作者及以上可发布 Galgame 资源'
  }

  const currentPatch = await prisma.patch.findUnique({
    where: { id: patchId },
    select: {
      unique_id: true,
      name: true
    }
  })

  const resourceCount = await prisma.patch_resource.count({
    where: { user_id: uid }
  })
  const needApproval = resourceCount === 0 && userRole < 3

  // 因为现在只有网盘链接，直接组装即可
  const preparedLinks = links.map((link, index) => ({
    storage: link.storage,
    size: link.size,
    code: link.code,
    password: link.password,
    hash: link.hash,
    s3_key: '', // 彻底废弃
    content: link.content,
    sort_order: index,
    download: 0
  }))

  const resource = await prisma.$transaction(async (prisma) => {
    const newResource = await prisma.patch_resource.create({
      data: {
        patch_id: patchId,
        user_id: uid,
        type,
        language,
        platform,
        status: needApproval ? 2 : 0,
        is_official: userRole >= 3,
        ...resourceData,
        links: {
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
        links: {
          orderBy: { sort_order: 'asc' }
        }
      }
    })

    await prisma.user.update({
      where: { id: uid },
      data: { moemoepoint: { increment: 3 } }
    })

    if (currentPatch) {
      await prisma.patch.update({
        where: { id: patchId },
        data: { resource_update_time: new Date() }
      })
      await recalcPatchType(patchId, prisma)
    }

    const resource: PatchResource = {
      id: newResource.id,
      name: newResource.name,
      section: newResource.section,
      uniqueId: currentPatch?.unique_id ?? '',
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
      canEdit: true,
      canDelete: true,
      user: {
        id: newResource.user.id,
        name: newResource.user.name,
        avatar: newResource.user.avatar,
        patchCount: newResource.user._count.patch_resource,
        role: newResource.user.role
      }
    }

    return resource
  })
  await invalidateUserSession(uid)

  if (resource.status === 0 && resource.section === 'patch') {
    await invalidateResourceListCache()
  }

  if (needApproval) {
    await createMessage({
      type: 'system',
      content: `您的首个资源「${currentPatch?.name ?? ''}」已提交审核，通过后将自动公开显示。`,
      recipient_id: uid,
      link: currentPatch?.unique_id
        ? `/${currentPatch.unique_id}?tab=resources&resourceSection=${resource.section}&resourceId=${resource.id}`
        : '/'
    })
  }

  return resource
}
