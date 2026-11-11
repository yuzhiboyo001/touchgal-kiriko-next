import { fetchWithTimeout } from '~/lib/fetchWithTimeout'

const FASTAPI_INTERNAL_URL =
  process.env.FASTAPI_INTERNAL_URL || 'http://127.0.0.1:8000'
const PYTHON_API_SECRET = process.env.PYTHON_API_SECRET || ''

export const kirikoInternalFetch = async (
  path: string,
  body: unknown,
  timeoutMs = 45_000
) => {
  if (!PYTHON_API_SECRET) {
    throw new Error('PYTHON_API_SECRET 未配置')
  }

  return fetchWithTimeout(
    `${FASTAPI_INTERNAL_URL}${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': PYTHON_API_SECRET
      },
      body: JSON.stringify(body)
    },
    timeoutMs
  )
}
