// app/api/auth/oauth/authorize/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyKunTokenWithUser } from '~/app/api/utils/jwt'

export const GET = async (req: Request) => {
  if (process.env.ENABLE_LEGACY_OAUTH !== 'true') {
    return new NextResponse(null, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const redirectUri = searchParams.get('redirect_uri')
  const state = searchParams.get('state')

  if (!redirectUri) {
    return NextResponse.json({ error: 'Missing redirect_uri' }, { status: 400 })
  }

  const token = (await cookies()).get('kun-galgame-patch-moe-token')?.value

  if (!token) {
    const loginUrl = new URL('http://localhost:3000/login')
    loginUrl.searchParams.set('next', req.url)
    return NextResponse.redirect(loginUrl.toString())
  }

  const verified = await verifyKunTokenWithUser(token)
  if (!verified) {
    const loginUrl = new URL('http://localhost:3000/login')
    loginUrl.searchParams.set('next', req.url)
    return NextResponse.redirect(loginUrl.toString())
  }

  const code = Buffer.from(
    JSON.stringify({
      uid: verified.user.id,
      exp: Date.now() + 300000 // 5分钟有效
    })
  ).toString('base64')

  const callbackUrl = new URL(redirectUri)
  callbackUrl.searchParams.set('code', code)
  if (state) {
    callbackUrl.searchParams.set('state', state)
  }

  return NextResponse.redirect(callbackUrl.toString())
}
