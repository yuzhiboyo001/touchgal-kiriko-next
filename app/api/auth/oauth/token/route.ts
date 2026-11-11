// app/api/auth/oauth/token/route.ts
import { NextResponse } from 'next/server'

export const POST = async (req: Request) => {
  if (process.env.ENABLE_LEGACY_OAUTH !== 'true') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const body = await req.text()
  const params = new URLSearchParams(body)
  const code = params.get('code')

  if (!code) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
  }

  try {
    const decoded = JSON.parse(Buffer.from(code, 'base64').toString())
    if (Date.now() > decoded.exp) throw new Error('Code expired')

    const accessToken = Buffer.from(
      JSON.stringify({ uid: decoded.uid })
    ).toString('base64')

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 2592000 // 30天
    })
  } catch (e) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
  }
}
