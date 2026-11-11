import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { uploadPatchBanner } from './_upload'
import { patchCreateSchema } from '~/validations/edit'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { postToIndexNow } from './_postToIndexNow'
import { processSubmittedExternalData } from './processExternalData'
import { invalidateUserSession } from '~/app/api/user/session/cache'

type CreateGalgameInput = Omit<
  z.infer<typeof patchCreateSchema>,
  'alias' | 'tag' | 'banner' | 'bannerOriginal'
> & {
  alias: string[]
  tag: string[]
  banner: ArrayBuffer
  bannerOriginal?: ArrayBuffer
}

export const createGalgame = async (input: CreateGalgameInput, uid: number) => {
  const {
    name,
    vndbId,
    vndbRelationId,
    bangumiId,
    dlsiteCode,
    dlsiteCircleName,
    dlsiteCircleLink,
    vndbTags,
    vndbDevelopers,
    bangumiTags,
    bangumiDevelopers,
    alias,
    banner,
    bannerOriginal,
    tag,
    introduction,
    released,
    contentLimit,
    contentWarning
  } = input

  const galgameUniqueId = crypto.randomBytes(4).toString('hex')

  const normalizedVndbId = vndbId?.trim() ? vndbId.trim().toLowerCase() : ''
  const normalizedVndbRelationId = vndbRelationId?.trim()
    ? vndbRelationId.trim().toLowerCase()
    : ''
  const normalizedDlsiteCode = dlsiteCode?.trim()
    ? dlsiteCode.trim().toUpperCase()
    : ''
  const [vndbPatch, dlsitePatch] = await Promise.all([
    normalizedVndbId && normalizedVndbRelationId
      ? prisma.patch.findFirst({
          where: {
            vndb_id: normalizedVndbId,
            vndb_relation_id: normalizedVndbRelationId
          },
          select: { unique_id: true }
        })
      : null,
    normalizedDlsiteCode
      ? prisma.patch.findFirst({
          where: { dlsite_code: normalizedDlsiteCode },
          select: { unique_id: true }
        })
      : null
  ])

  if (vndbPatch) {
    return `Galgame VNDB ID 与 Relation ID 的组合与游戏 ID 为 ${vndbPatch.unique_id} 的游戏重复`
  }
  if (dlsitePatch) {
    return `Galgame DLSite Code 与游戏 ID 为 ${dlsitePatch.unique_id} 的游戏重复`
  }

  const res = await prisma.$transaction(
    async (prisma) => {
      const patch = await prisma.patch.create({
        data: {
          name,
          unique_id: galgameUniqueId,
          vndb_id: normalizedVndbId ? normalizedVndbId : null,
          vndb_relation_id: normalizedVndbRelationId
            ? normalizedVndbRelationId
            : null,
          bangumi_id: bangumiId ? Number(bangumiId) : null,
          dlsite_code: normalizedDlsiteCode ? normalizedDlsiteCode : null,
          introduction,
          user_id: uid,
          banner: '',
          released,
          content_limit: contentLimit,
          content_warning: contentWarning
        }
      })

      const newId = patch.id

      const uploadResult = await uploadPatchBanner(
        banner,
        newId,
        bannerOriginal
      )
      if (typeof uploadResult === 'string') {
        return uploadResult
      }
      const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/patch/${newId}/banner/banner.avif`

      await prisma.patch.update({
        where: { id: newId },
        data: { banner: imageLink }
      })

      await prisma.patch_rating_stat.create({
        data: { patch_id: newId }
      })

      if (alias.length) {
        const aliasData = alias.map((name) => ({
          name,
          patch_id: newId
        }))
        await prisma.patch_alias.createMany({
          data: aliasData,
          skipDuplicates: true
        })
      }

      await prisma.user.update({
        where: { id: uid },
        data: {
          daily_image_count: { increment: 1 },
          moemoepoint: { increment: 3 }
        }
      })

      return { patchId: newId }
    },
    { timeout: 60000 }
  )

  if (typeof res === 'string') {
    return res
  }
  await invalidateUserSession(uid)

  await processSubmittedExternalData(
    res.patchId,
    {
      vndbTags,
      vndbDevelopers,
      bangumiTags,
      bangumiDevelopers,
      dlsiteCircleName: dlsiteCircleName ?? '',
      dlsiteCircleLink: dlsiteCircleLink ?? ''
    },
    tag,
    uid
  )

  if (contentLimit === 'sfw') {
    const newPatchUrl = `${kunMoyuMoe.domain.main}/${galgameUniqueId}`
    void postToIndexNow(newPatchUrl).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to post new patch to IndexNow', error)
    })
  }

  return { uniqueId: galgameUniqueId }
}
