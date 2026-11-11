import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminResourceApplyPaginationSchema } from '~/validations/admin'
import { markdownToHtml } from '~/app/api/utils/render/markdownToHtml'
import type { ResourceHealthStatus } from '~/constants/resource'
import type { AdminResource } from '~/types/api/admin'

export const getPatchResourceApply = async (
  input: z.infer<typeof adminResourceApplyPaginationSchema>
) => {
  const { page, limit, search } = input
  const offset = (page - 1) * limit

  // 资源首次发布申请页只对 super admin 开放。
  // 待审核资源不能因为超级管理员当前是 SFW 模式而消失，
  // 否则 NSFW 游戏的首次资源永远无法审核。
  const whereBase = {
    status: 2
  } as const

  const where = search
    ? {
        ...whereBase,
        links: {
          some: {
            OR: [
              {
                content: {
                  contains: search,
                  mode: 'insensitive' as const
                }
              },
              {
                hash: {
                  contains: search,
                  mode: 'insensitive' as const
                }
              }
            ]
          }
        }
      }
    : whereBase

  const [data, total] = await Promise.all([
    prisma.patch_resource.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name: true,
            unique_id: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        },
        links: {
          orderBy: { sort_order: 'asc' }
        }
      }
    }),
    prisma.patch_resource.count({ where })
  ])

  const resources: AdminResource[] = await Promise.all(
    data.map(async (resource) => ({
      id: resource.id,
      name: resource.name,
      section: resource.section,
      uniqueId: resource.patch.unique_id,
      isOfficial: resource.is_official,
      patchName: resource.patch.name,
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
      likeCount: 0,
      isLike: false,
      status: resource.status,
      userId: resource.user_id,
      patchId: resource.patch_id,
      created: String(resource.created),
      canEdit: true,
      canDelete: true,
      user: {
        id: resource.user.id,
        name: resource.user.name,
        avatar: resource.user.avatar,
        role: resource.user.role,
        patchCount: 0
      }
    }))
  )

  return { resources, total }
}
