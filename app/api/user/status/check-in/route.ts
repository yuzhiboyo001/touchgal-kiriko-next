import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { randomNormalInt } from '~/utils/random'
import { invalidateUserSession } from '~/app/api/user/session/cache'
import { getBeijingToday, isSameBeijingDay } from '~/utils/time'

const checkIn = async (uid: number) => {
  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { last_check_in_date: true }
  })
  if (!user) {
    return '用户未找到'
  }

  const today = getBeijingToday()
  if (
    user.last_check_in_date &&
    isSameBeijingDay(today, new Date(user.last_check_in_date))
  ) {
    return '您今天已经签到过了'
  }

  const randomMoemoepoints = randomNormalInt(2, 7)

  // 原子判断日期，避免并发请求重复签到
  const updated = await prisma.user.updateMany({
    where: {
      id: uid,
      OR: [{ last_check_in_date: null }, { last_check_in_date: { lt: today } }]
    },
    data: {
      moemoepoint: { increment: randomMoemoepoints },
      daily_check_in: { set: 1 },
      last_check_in_date: today
    }
  })

  if (updated.count === 0) {
    return '您今天已经签到过了'
  }

  await invalidateUserSession(uid)

  return { randomMoemoepoints }
}

export async function POST(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const res = await checkIn(payload.uid)
  return NextResponse.json(res)
}
