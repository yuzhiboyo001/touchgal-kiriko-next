import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import {
  getFeatureAccess,
  setFeatureAccess,
  type FeatureAccess
} from '~/lib/featureAccess'

const flagsSchema = z.object({
  '1': z.boolean().optional(),
  '2': z.boolean().optional(),
  '3': z.boolean().optional(),
  '4': z.boolean().optional()
})

const accessSchema = z.object({
  publishResource: flagsSchema,
  dlsiteImport: flagsSchema
})

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 4) {
    return NextResponse.json('本页面仅超级管理员可访问')
  }

  return NextResponse.json(await getFeatureAccess())
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, accessSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 4) {
    return NextResponse.json('本页面仅超级管理员可访问')
  }

  await setFeatureAccess(input as FeatureAccess)
  return NextResponse.json({})
}
