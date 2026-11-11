import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { checkBaiduShare } from '~/lib/baiduShare'

const checkSchema = z.object({
  linkId: z.coerce.number().min(1).max(9999999)
})

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, checkSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 4) {
    return NextResponse.json('仅超级管理员可检查链接')
  }

  const link = await prisma.patch_resource_link.findUnique({
    where: { id: input.linkId },
    select: {
      id: true,
      content: true,
      code: true,
      password: true,
      resource: { select: { is_official: true } }
    }
  })

  if (!link) {
    return NextResponse.json('未找到该链接')
  }
  if (!link.resource.is_official) {
    return NextResponse.json('仅官方资源参与链接健康检查')
  }

  const result = await checkBaiduShare({
    content: link.content,
    code: link.code,
    password: link.password
  })
  const checkedAt = new Date()

  const updated = await prisma.patch_resource_link.update({
    where: { id: link.id },
    data: {
      health_status: result.status,
      last_checked_at: checkedAt,
      ...(result.status === 'active' ? { last_ok_at: checkedAt } : {}),
      check_errno: result.errno,
      check_message: result.message.slice(0, 1007),
      remote_md5: result.remoteMd5.slice(0, 64),
      remote_size: result.remoteSize.slice(0, 64),
      fail_count: result.status === 'active' ? 0 : { increment: 1 }
    },
    select: {
      id: true,
      health_status: true,
      last_checked_at: true,
      check_errno: true,
      check_message: true
    }
  })

  return NextResponse.json({
    id: updated.id,
    healthStatus: updated.health_status,
    lastCheckedAt: updated.last_checked_at?.toISOString() ?? null,
    checkErrno: updated.check_errno,
    checkMessage: updated.check_message
  })
}
