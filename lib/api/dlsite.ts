import { fetchWithTimeout } from '~/lib/fetchWithTimeout'

export const DLSITE_API =
  process.env.DLSITE_API_URL || 'http://127.0.0.1:8000/api/dlsite'

export interface DlsiteApiResponse {
  rj_code: string
  title_default: string
  title_jp?: string
  title_en?: string
  title_cn?: string
  cover_url?: string
  cover_data_url?: string
  release_date?: string
  tags?: string
  circle_name?: string
  circle_link?: string
  description_md?: string
  images?: { token: string; url: string }[]
  is_announce?: boolean
}

export const fetchDlsiteData = async (
  code: string
): Promise<DlsiteApiResponse> => {
  const normalized = code.trim().toUpperCase()
  const url = `${DLSITE_API}?code=${encodeURIComponent(normalized)}`
  const secret = process.env.PYTHON_API_SECRET
  if (!secret) {
    throw new Error('PYTHON_API_SECRET_NOT_CONFIGURED')
  }
  // 简介需要下载/压缩/上传图片 + 翻译，30 秒不够
  const response = await fetchWithTimeout(
    url,
    { headers: { 'X-Internal-Token': secret } },
    120_000
  )
  if (!response.ok) {
    throw new Error('DLSITE_FETCH_FAILED')
  }
  const data = (await response.json()) as { data: DlsiteApiResponse }
  return data.data
}
