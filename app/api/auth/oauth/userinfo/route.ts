// app/api/auth/oauth/userinfo/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'

export const GET = async (req: Request) => {
  if (process.env.ENABLE_LEGACY_OAUTH !== 'true') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())

    const user = await prisma.user.findUnique({
      where: { id: decoded.uid },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true // 加上这个，TS 就能认出 user.avatar 了
      }
    })

    if (!user) throw new Error('User not found')

    return NextResponse.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email || `user${user.id}@galgame.local`,
      picture: user.avatar // 论坛认的字段名是 picture
    })
  } catch (e) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }
}
