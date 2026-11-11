// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { z } from 'zod'
import { getBeijingToday, getBeijingWeekStart } from '~/utils/time'
import {
  DAILY_TASKS,
  WEEKLY_TASKS,
  CHALLENGE_TASKS
} from '~/components/effects/daily-task/config'
import { addAffectionToProfile } from '~/server/kirikoAffection'
import { runAchievementChecks } from '~/components/kun/KirikoStandee/achievements'
import { verifyTaskCompletion } from '~/server/taskVerification'

const taskSchema = z.object({
  taskId: z.string()
})

const ALL_TASKS = [...DAILY_TASKS, ...WEEKLY_TASKS, ...CHALLENGE_TASKS]
const TASK_MAP = new Map(ALL_TASKS.map((task) => [task.id, task]))

// ============================================================
// GET: 获取任务状态（包含是否已领取）
// ============================================================
export async function GET(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json(
      { success: false, message: '未登录' },
      { status: 401 }
    )
  }

  try {
    const today = getBeijingToday()
    const weekStart = getBeijingWeekStart()

    const records = await prisma.kiriko_user_task.findMany({
      where: {
        user_id: payload.uid,
        OR: [
          { task_type: 'daily', date: { gte: today } },
          {
            task_type: 'weekly',
            OR: [
              { week_start: { gte: weekStart } },
              { week_start: null, date: { gte: today } }
            ]
          },
          { task_type: 'challenge' }
        ]
      }
    })

    const taskStatus: Record<
      string,
      { completed: boolean; completed_at: string | null; claimed: boolean }
    > = {}

    for (const record of records) {
      taskStatus[record.task_id] = {
        completed: Boolean(record.completed_at),
        completed_at: record.completed_at?.toISOString() || null,
        claimed: record.claimed // ✅ 返回 claimed 标记
      }
    }

    return NextResponse.json({
      success: true,
      data: taskStatus,
      meta: {
        today: today.toISOString(),
        week_start: weekStart.toISOString()
      }
    })
  } catch (error) {
    console.error('获取任务状态失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST: 完成任务（只打标记，不发奖励）
// ============================================================
export async function POST(req: NextRequest) {
  const input = await kunParsePostBody(req, taskSchema)
  if (typeof input === 'string') {
    return NextResponse.json(
      { success: false, message: input },
      { status: 400 }
    )
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json(
      { success: false, message: '未登录' },
      { status: 401 }
    )
  }

  try {
    const { taskId } = input
    const task = TASK_MAP.get(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, code: 404, message: '任务不存在' },
        { status: 404 }
      )
    }

    const taskType = task.category as 'daily' | 'weekly' | 'challenge'
    const today = getBeijingToday()
    const weekStart = getBeijingWeekStart()

    const oldRecord = await prisma.kiriko_user_task.findUnique({
      where: { user_id_task_id: { user_id: payload.uid, task_id: taskId } },
      select: {
        completed_at: true,
        claimed: true,
        date: true,
        week_start: true
      }
    })

    const isNewPeriod =
      taskType === 'daily'
        ? !oldRecord || oldRecord.date < today
        : taskType === 'weekly'
          ? !oldRecord ||
            !oldRecord.week_start ||
            oldRecord.week_start < weekStart
          : false

    const wasCompleted = !isNewPeriod && Boolean(oldRecord?.completed_at)

    // 已完成的挑战不重复处理
    if (taskType === 'challenge' && wasCompleted) {
      return NextResponse.json({
        success: true,
        code: 200,
        data: {
          taskId,
          completed: true,
          completed_at: oldRecord?.completed_at?.toISOString() || null,
          newlyCompleted: false
        }
      })
    }

    // 关键：不信任客户端 completed，由服务端检查真实行为
    const verified = await verifyTaskCompletion(payload.uid, taskId)
    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          code: 409,
          message: '任务条件尚未完成',
          data: { taskId, completed: false, newlyCompleted: false }
        },
        { status: 409 }
      )
    }

    const record = await prisma.kiriko_user_task.upsert({
      where: { user_id_task_id: { user_id: payload.uid, task_id: taskId } },
      update: {
        completed_at: isNewPeriod
          ? new Date()
          : (oldRecord?.completed_at ?? new Date()),
        claimed: isNewPeriod ? false : (oldRecord?.claimed ?? false),
        date: today,
        week_start: taskType === 'weekly' ? weekStart : null
      },
      create: {
        user_id: payload.uid,
        task_id: taskId,
        task_type: taskType,
        completed_at: new Date(),
        claimed: false,
        date: today,
        week_start: taskType === 'weekly' ? weekStart : null
      }
    })

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        taskId: record.task_id,
        completed: Boolean(record.completed_at),
        completed_at: record.completed_at?.toISOString() || null,
        newlyCompleted: !wasCompleted
      }
    })
  } catch (error) {
    console.error('切换任务状态失败:', error)
    return NextResponse.json(
      { success: false, code: 500, message: '服务器错误' },
      { status: 500 }
    )
  }
}
// ============================================================
// PUT: 领取任务奖励
// ============================================================
export async function PUT(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json(
      { success: false, code: 401, message: '未登录' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const { taskId } = body
    if (!taskId) {
      return NextResponse.json(
        { success: false, code: 400, message: '缺少参数' },
        { status: 400 }
      )
    }

    // 1. 找到任务配置
    const task = TASK_MAP.get(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, code: 404, message: '任务不存在' },
        { status: 404 }
      )
    }

    // 2. 原子占位，防止并发重复领奖
    const affection = task.affection || 0
    const coins = task.coins || 0

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.kiriko_user_task.findUnique({
        where: { user_id_task_id: { user_id: payload.uid, task_id: taskId } }
      })

      if (!record || !record.completed_at) {
        return { ok: false as const, reason: 'incomplete' }
      }
      if (record.claimed) {
        return { ok: false as const, reason: 'claimed' }
      }

      const reserved = await tx.kiriko_user_task.updateMany({
        where: {
          user_id: payload.uid,
          task_id: taskId,
          completed_at: { not: null },
          claimed: false
        },
        data: { claimed: true }
      })
      if (reserved.count === 0) {
        return { ok: false as const, reason: 'claimed' }
      }

      const affectionResult =
        affection > 0
          ? await addAffectionToProfile(payload.uid, affection, tx)
          : null

      if (coins > 0) {
        await tx.kiriko_profile.update({
          where: { user_id: payload.uid },
          data: { coins: { increment: coins } }
        })
      }

      const profile = await tx.kiriko_profile.findUnique({
        where: { user_id: payload.uid },
        select: { coins: true, affection: true }
      })

      return { ok: true as const, affectionResult, profile }
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          code: 409,
          message:
            result.reason === 'claimed'
              ? '奖励已领取，请勿重复领取'
              : '任务尚未完成'
        },
        { status: 409 }
      )
    }

    if (result.affectionResult) {
      try {
        await runAchievementChecks(payload.uid, {
          newLevel: result.affectionResult.newLevel
        })
      } catch (error) {
        console.error('任务奖励成就检查失败:', error)
      }
    }

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        gainedAffection: affection,
        gainedCoins: coins,
        totalAffection: result.profile?.affection || 0,
        totalCoins: result.profile?.coins || 0
      }
    })
  } catch (error) {
    console.error('领取奖励失败:', error)
    return NextResponse.json(
      { success: false, code: 500, message: '服务器错误' },
      { status: 500 }
    )
  }
}
