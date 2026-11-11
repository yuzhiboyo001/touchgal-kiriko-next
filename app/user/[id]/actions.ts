'use server'

import { cache } from 'react'
import { z } from 'zod'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getUserProfile } from '~/app/api/user/status/info/service'

const getProfileSchema = z.object({
  id: z.coerce.number().min(1).max(9999999)
})

// generateMetadata 和 layout 会各调一次，用 React cache 在同一请求内去重
const getProfileCached = cache(async (id: number) => {
  const input = safeParseSchema(getProfileSchema, { id })
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  return getUserProfile(input, payload?.uid ?? 0)
})

export const kunGetActions = async (id: number) => getProfileCached(id)
