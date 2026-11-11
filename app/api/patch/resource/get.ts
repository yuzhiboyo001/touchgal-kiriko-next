import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/app/api/utils/render/markdownToHtml'
import type { PatchResource } from '~/types/api/patch'
import { canDeleteResource, canEditResource } from '~/lib/permissions'
import { getBlockedUserIds } from '~/lib/blacklist'
import type { ResourceHealthStatus } from '~/constants/resource'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const getPatchResource = async (
  input: z.infer<typeof patchIdSchema>,
  uid: number,
  role: number
) => {
  const { patchId } = input
  const viewer = { uid, role }
  const blockedUserIds = await getBlockedUserIds(uid)

  const data = await prisma.patch_resource.findMany({
    where: {
      patch_id: patchId,
      status: 0,
      ...(blockedUserIds.length > 0
        ? { user_id: { notIn: blockedUserIds } }
        : {})
    },
    select: {
      id: true,
      name: true,
      section: true,
      is_official: true,
      type: true,
      language: true,
      platform: true,
      status: true,
      user_id: true,
      patch_id: true,
      note: true,
      created: true,
      patch: { select: { unique_id: true } },
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          _count: {
            select: { patch_resource: true }
          }
        }
      },
      links: {
        orderBy: { sort_order: 'asc' }
      },
      _count: {
        select: { like_by: true }
      },
      like_by: {
        where: {
          user_id: uid
        },
        select: { id: true }
      }
    }
  })

  const resources: PatchResource[] = await Promise.all(
    data.map(async (resource) => ({
      id: resource.id,
      name: resource.name,
      section: resource.section,
      uniqueId: resource.patch.unique_id,
      isOfficial: resource.is_official,
      type: resource.type,
      language: resource.language,
      note: resource.note,
      noteHtml: resource.note ? await markdownToHtml(resource.note) : '',
      platform: resource.platform,
      links: resource.links.map((link) => ({
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
      likeCount: resource._count.like_by,
      isLike: resource.like_by.length > 0,
      status: resource.status,
      userId: resource.user_id,
      patchId: resource.patch_id,
      created: String(resource.created),
      canEdit: canEditResource(viewer, resource.user_id),
      canDelete: canDeleteResource(viewer, resource.user_id),
      user: {
        id: resource.user.id,
        name: resource.user.name,
        avatar: resource.user.avatar,
        patchCount: resource.user._count.patch_resource,
        role: resource.user.role
      }
    }))
  )

  return resources
}
