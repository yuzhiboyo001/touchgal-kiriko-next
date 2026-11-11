import type { NextRequest } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { getNSFWHeader } from './getNSFWHeader'

export const requireNsfwAccess = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return {
      ok: false as const,
      status: 401,
      message: '请登录后查看'
    }
  }

  const nsfwHeader = await getNSFWHeader(req, payload)
  if (nsfwHeader.content_limit === 'sfw') {
    return {
      ok: false as const,
      status: 403,
      message: '请在右上角菜单开启 NSFW 内容显示后查看'
    }
  }

  return { ok: true as const, payload, nsfwHeader }
}
