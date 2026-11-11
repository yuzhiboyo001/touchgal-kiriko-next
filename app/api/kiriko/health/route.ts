import { NextResponse } from 'next/server'
import { fetchWithTimeout } from '~/lib/fetchWithTimeout'

const FASTAPI_INTERNAL_URL =
  process.env.FASTAPI_INTERNAL_URL || 'http://127.0.0.1:8000'
const PYTHON_API_SECRET = process.env.PYTHON_API_SECRET || ''

export async function GET() {
  if (!PYTHON_API_SECRET) {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 })
  }

  try {
    const response = await fetchWithTimeout(
      `${FASTAPI_INTERNAL_URL}/health`,
      {
        headers: { 'X-Internal-Token': PYTHON_API_SECRET }
      },
      3_000
    )
    return NextResponse.json(await response.json(), { status: response.status })
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 502 })
  }
}
