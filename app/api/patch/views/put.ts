import { prisma } from '~/prisma/index'
import { invalidatePatchContentCache } from '~/app/api/patch/cache'
import { claimPatchView, incrementPatchViewBufferOnce } from './buffer'

const logPatchViewError = (message: string, error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(message, error)
}

const updatePatchViewsInDatabase = async (uniqueId: string) => {
  await prisma.patch.updateMany({
    where: { unique_id: uniqueId },
    data: { view: { increment: 1 } }
  })

  // The patch page is cached separately in Redis. Without this, the database
  // can be correct while the page keeps showing the old count.
  await invalidatePatchContentCache(uniqueId)
}

export const updatePatchViews = async (uniqueId: string, ip = '') => {
  // In local development there is no separate cron process, so the Redis
  // buffer has no consumer. Production always has the dedicated cron PM2 app.
  // KUN_VIEWS_DIRECT_WRITE is an explicit escape hatch for single-process
  // deployments that intentionally run without the cron app.
  const writeDirectly =
    process.env.NODE_ENV !== 'production' ||
    process.env.KUN_VIEWS_DIRECT_WRITE === 'true'

  if (writeDirectly) {
    try {
      if (!(await claimPatchView(uniqueId, ip))) {
        return
      }
      await updatePatchViewsInDatabase(uniqueId)
    } catch (error) {
      logPatchViewError('Failed to update patch views in DB:', error)
    }
    return
  }

  try {
    const counted = await incrementPatchViewBufferOnce(uniqueId, ip)
    if (!counted) {
      return
    }
    return
  } catch (error) {
    logPatchViewError('Failed to buffer patch view increment:', error)
  }

  // Redis 不可用时宁可少一次去重，也不要直接丢浏览。
  try {
    await updatePatchViewsInDatabase(uniqueId)
  } catch (error) {
    logPatchViewError('Failed to update patch views in DB:', error)
  }
}
