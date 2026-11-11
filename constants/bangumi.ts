export const BANGUMI_API_BASE = 'https://api.bgm.tv'

export const BANGUMI_USER_AGENT = 'sagiri/1.0 (https://sagiri.ink)'

export const BANGUMI_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': BANGUMI_USER_AGENT
}

export const getBangumiHeaders = (): Record<string, string> => {
  const token = process.env.KUN_BANGUMI_TOKEN?.trim()
  return token
    ? { ...BANGUMI_HEADERS, Authorization: `Bearer ${token}` }
    : BANGUMI_HEADERS
}
