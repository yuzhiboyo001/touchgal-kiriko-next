// app/api/log/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, data, timestamp } = body

    // ✅ 终端输出，带时间戳
    const time = timestamp
      ? new Date(timestamp).toLocaleTimeString()
      : new Date().toLocaleTimeString()

    if (data !== undefined && data !== null) {
      console.log(`[${time}] 🔵 [Client] ${message}`, data)
    } else {
      console.log(`[${time}] 🔵 [Client] ${message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [Log API] 处理失败:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
