import cron from 'node-cron'
import { prisma } from '~/prisma'
import { checkBaiduShare } from '~/lib/baiduShare'
import { withTaskLock } from './withTaskLock'

const CHECK_LOCK_KEY = 'cron:official-resource-links:lock'
const CHECK_LOCK_TTL_SECONDS = 1800
const BATCH_SIZE = 10
const ACTIVE_INTERVAL_MS = 6 * 60 * 60 * 1000
const FAILED_INTERVAL_MS = 60 * 60 * 1000
const REQUEST_DELAY_MS = 2000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const checkOfficialResourceLinks = async () => {
  const now = new Date()
  const activeBefore = new Date(now.getTime() - ACTIVE_INTERVAL_MS)
  const failedBefore = new Date(now.getTime() - FAILED_INTERVAL_MS)

  const links = await prisma.patch_resource_link.findMany({
    where: {
      resource: {
        is_official: true,
        status: 0
      },
      content: { contains: 'pan.baidu.com' },
      OR: [
        {
          health_status: {
            in: [
              'dead',
              'expired',
              'password_required',
              'password_error',
              'rate_limited',
              'unknown'
            ]
          },
          OR: [
            { last_checked_at: null },
            { last_checked_at: { lt: failedBefore } }
          ]
        },
        {
          health_status: 'active',
          OR: [
            { last_checked_at: null },
            { last_checked_at: { lt: activeBefore } }
          ]
        }
      ]
    },
    orderBy: [{ last_checked_at: 'asc' }, { id: 'asc' }],
    take: BATCH_SIZE,
    select: {
      id: true,
      content: true,
      code: true,
      password: true
    }
  })

  if (links.length === 0) {
    return
  }

  for (const link of links) {
    const result = await checkBaiduShare({
      content: link.content,
      code: link.code,
      password: link.password
    })

    const checkedAt = new Date()
    const isActive = result.status === 'active'

    await prisma.patch_resource_link.update({
      where: { id: link.id },
      data: {
        health_status: result.status,
        last_checked_at: checkedAt,
        ...(isActive ? { last_ok_at: checkedAt } : {}),
        check_errno: result.errno,
        check_message: result.message.slice(0, 1007),
        remote_md5: result.remoteMd5.slice(0, 64),
        remote_size: result.remoteSize.slice(0, 64),
        fail_count: isActive ? 0 : { increment: 1 }
      }
    })

    console.log(
      `[official-resource-check] link=${link.id} status=${result.status} errno=${result.errno ?? 'null'}`
    )

    await sleep(REQUEST_DELAY_MS)
  }
}

export const checkOfficialResourceLinksTask = cron.createTask(
  '0 * * * *',
  async () => {
    await withTaskLock(
      {
        key: CHECK_LOCK_KEY,
        ttlSeconds: CHECK_LOCK_TTL_SECONDS,
        taskName: 'checkOfficialResourceLinksTask'
      },
      checkOfficialResourceLinks
    ).catch((error) => {
      console.error('Error checking official resource links:', error)
    })
  }
)
