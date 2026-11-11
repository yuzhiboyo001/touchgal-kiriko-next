import { NextRequest, NextResponse } from 'next/server'
import {
  kunParseDeleteQuery,
  kunParseGetQuery,
  kunParsePutBody
} from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { adminUserPaginationSchema } from '~/validations/admin'
import {
  manageDeleteUserSchema,
  manageUpdateUserSchema
} from '~/validations/manage'
import { getUserInfo } from '~/app/api/admin/user/get'
import { deleteManagedUser, updateManagedUser } from './service'

const verifyManager = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload || payload.role < 3) {
    return null
  }
  return payload
}

export const GET = async (req: NextRequest) => {
  const payload = await verifyManager(req)
  if (!payload) {
    return NextResponse.json('仅管理员可访问', { status: 403 })
  }

  const input = kunParseGetQuery(req, adminUserPaginationSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getUserInfo(input)
  return NextResponse.json(response)
}

export const PUT = async (req: NextRequest) => {
  const payload = await verifyManager(req)
  if (!payload) {
    return NextResponse.json('仅管理员可访问', { status: 403 })
  }

  const input = await kunParsePutBody(req, manageUpdateUserSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await updateManagedUser(input, payload.uid)
  return NextResponse.json(response)
}

export const DELETE = async (req: NextRequest) => {
  const payload = await verifyManager(req)
  if (!payload) {
    return NextResponse.json('仅管理员可访问', { status: 403 })
  }

  const input = kunParseDeleteQuery(req, manageDeleteUserSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await deleteManagedUser(input, payload.uid)
  return NextResponse.json(response)
}
