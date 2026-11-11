// proxy.ts (Next.js 16)

import { NextResponse } from 'next/server'
import { kunAuthMiddleware } from '~/middleware/auth'
import { verifyKunCsrf } from '~/middleware/_csrf'
import type { NextRequest } from 'next/server'

// ============================================================
// ⚠️跳过 CSRF 验证的路由名单
// 新增路由时，在这里加名字，然后复制到下面的正则里
// ============================================================
// 当前名单: upload, purchase, conversation, log, affection, tasks
// 新增格式: 名字 + /? （例如: 'new-route/?')
// 然后复制到下面的正则中
// ============================================================

export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/comment/:path*',
    '/edit/:path*',
    // 在排除名单里加上 auth/oauth/token
    '/api/((?!upload/|purchase/?|conversation/?|log/?|affection/?|tasks/?|auth/oauth/token/?).*)'
  ]
}

export const proxy = async (request: NextRequest) => {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const csrfError = verifyKunCsrf(request)
    if (csrfError) {
      return NextResponse.json(csrfError, { status: 403 })
    }
    return NextResponse.next()
  }

  return kunAuthMiddleware(request)
}
