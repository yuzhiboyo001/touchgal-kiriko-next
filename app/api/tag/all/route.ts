import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { getTagSchema } from '~/validations/tag'
import { getTag } from './service'
import { getAuthenticatedBlockedTagIds } from '~/app/api/utils/getBlockedTagIds'
import { requireNsfwAccess } from '~/app/api/utils/nsfwAccess'

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getTagSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const access = await requireNsfwAccess(req)
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.message },
      { status: access.status }
    )
  }

  const blockedTagIds = await getAuthenticatedBlockedTagIds(req)
  if (!blockedTagIds) {
    return NextResponse.json('用户未登录')
  }
  const response = await getTag(
    input,
    blockedTagIds,
    access.nsfwHeader.content_limit === 'nsfw' ? 'nsfw' : 'all'
  )
  return NextResponse.json(response)
}
