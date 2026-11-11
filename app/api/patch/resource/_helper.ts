import { prisma } from '~/prisma/index'
import { invalidatePatchContentCache } from '~/app/api/patch/cache'

export const sanitizeResourceLinksForAuditLog = <
  L extends {
    content?: string
    password?: string
    code?: string
    hash?: string
    s3_key?: string
  }
>(
  links: L[] | undefined | null
): Omit<L, 'content' | 'password' | 'code' | 'hash' | 's3_key'>[] => {
  if (!links) {
    return []
  }
  return links.map(({ content, password, code, hash, s3_key, ...rest }) => rest)
}

export const recalcPatchType = async (
  patchId: number,
  tx: {
    patch_resource: Pick<typeof prisma.patch_resource, 'findMany'>
    patch: Pick<typeof prisma.patch, 'update'>
  } = prisma
) => {
  const resources = await tx.patch_resource.findMany({
    where: { patch_id: patchId, status: 0 },
    select: { type: true, language: true, platform: true }
  })

  const types = [...new Set(resources.flatMap((r) => r.type))]
  const languages = [...new Set(resources.flatMap((r) => r.language))]
  const platforms = [...new Set(resources.flatMap((r) => r.platform))]

  const patch = await tx.patch.update({
    where: { id: patchId },
    data: {
      type: { set: types },
      language: { set: languages },
      platform: { set: platforms }
    },
    select: { unique_id: true }
  })

  await invalidatePatchContentCache(patch.unique_id)
}
