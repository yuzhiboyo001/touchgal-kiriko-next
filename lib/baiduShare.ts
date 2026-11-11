import type { ResourceHealthStatus } from '~/constants/resource'

const BAIDU_HOSTS = new Set(['pan.baidu.com', 'yun.baidu.com'])
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const REQUEST_TIMEOUT_MS = 15_000

export interface BaiduShareCheckResult {
  status: ResourceHealthStatus
  errno: number | null
  message: string
  remoteMd5: string
  remoteSize: string
  title: string
}

const unknownResult = (message: string): BaiduShareCheckResult => ({
  status: 'unknown',
  errno: null,
  message,
  remoteMd5: '',
  remoteSize: '',
  title: ''
})

const parseShare = (content: string) => {
  try {
    const url = new URL(content.trim())
    if (!BAIDU_HOSTS.has(url.hostname)) {
      return null
    }

    let surl = ''
    if (url.pathname.startsWith('/s/')) {
      surl = decodeURIComponent(url.pathname.slice(3)).replace(/^\/+/, '')
    } else if (url.pathname === '/share/init') {
      surl = url.searchParams.get('surl') ?? ''
    }

    if (!surl) return null

    return {
      url,
      surl,
      // Baidu's share/list uses shorturl without the leading "1".
      shorturl: surl.length > 1 ? surl.slice(1) : surl,
      pwd: url.searchParams.get('pwd') ?? ''
    }
  } catch {
    return null
  }
}

const readSetCookies = (headers: Headers): string[] => {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie

  if (typeof getSetCookie === 'function') {
    return getSetCookie.call(headers)
  }

  const single = headers.get('set-cookie')
  return single ? [single] : []
}

const collectCookieJar = (headers: Headers, jar: Map<string, string>) => {
  for (const cookie of readSetCookies(headers)) {
    const first = cookie.split(';', 1)[0]
    const separator = first.indexOf('=')
    if (separator <= 0) continue

    const name = first.slice(0, separator).trim()
    const value = first.slice(separator + 1).trim()
    if (name && value) jar.set(name, value)
  }
}

const cookieHeader = (jar: Map<string, string>) =>
  [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')

const parseErrno = (value: unknown) => {
  const errno = Number(value)
  return Number.isFinite(errno) ? errno : null
}

const getHealthStatus = (errno: number | null): ResourceHealthStatus => {
  if (errno === 0) return 'active'
  if (errno === -21) return 'dead'
  if (errno === -8) return 'expired'
  if (errno === -12) return 'password_required'
  if (errno === -9) return 'password_error'
  if (errno === 9019) return 'rate_limited'
  return 'unknown'
}

/**
 * 百度分享链接检测。
 *
 * 不解析分享页 HTML，只调用分享列表 JSON API。
 * 遇到 9019 / 网络错误返回 unknown，不应当直接标记为失效。
 */
export const checkBaiduShare = async (input: {
  content: string
  code?: string
  password?: string
}): Promise<BaiduShareCheckResult> => {
  const share = parseShare(input.content)
  if (!share) {
    return unknownResult('不是有效的百度网盘分享链接')
  }

  const jar = new Map<string, string>()
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)

  try {
    const home = await fetch('https://pan.baidu.com/', {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml'
      },
      signal: timeout
    })
    collectCookieJar(home.headers, jar)

    const code = (input.code || share.pwd || '').trim()
    if (code) {
      const verifyUrl = new URL('https://pan.baidu.com/share/verify')
      verifyUrl.searchParams.set('surl', share.shorturl)
      verifyUrl.searchParams.set('pwd', code)

      const verify = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'user-agent': USER_AGENT,
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/x-www-form-urlencoded',
          referer: share.url.toString(),
          cookie: cookieHeader(jar)
        },
        body: new URLSearchParams({
          pwd: code,
          vcode: '',
          vcode_str: ''
        }).toString(),
        signal: timeout
      })
      collectCookieJar(verify.headers, jar)

      const verifyData = (await verify.json().catch(() => ({}))) as {
        errno?: number
        errmsg?: string
        err_msg?: string
        randsk?: string
      }

      if (Number(verifyData.errno) !== 0) {
        const errno = parseErrno(verifyData.errno)
        return {
          status: getHealthStatus(errno),
          errno,
          message: verifyData.errmsg || verifyData.err_msg || '提取码验证失败',
          remoteMd5: '',
          remoteSize: '',
          title: ''
        }
      }

      if (verifyData.randsk) {
        jar.set('BDCLND', verifyData.randsk)
      }
    }

    const listUrl = new URL('https://pan.baidu.com/share/list')
    listUrl.search = new URLSearchParams({
      web: '1',
      app_id: '250528',
      desc: '1',
      showempty: '0',
      page: '1',
      num: '20',
      order: 'time',
      shorturl: share.shorturl,
      root: '1',
      view_mode: '1',
      channel: 'chunlei',
      clienttype: '0'
    }).toString()

    const response = await fetch(listUrl, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/json, text/plain, */*',
        referer: share.url.toString(),
        cookie: cookieHeader(jar)
      },
      signal: timeout
    })

    const data = (await response.json().catch(() => ({}))) as {
      errno?: number
      errmsg?: string
      err_msg?: string
      show_msg?: string
      title?: string
      list?: Array<{ md5?: string; size?: string | number }>
    }

    const errno = parseErrno(data.errno)
    const status = getHealthStatus(errno)
    const firstFile = data.list?.find((item) => item.md5 || item.size)

    return {
      status,
      errno,
      message: data.show_msg || data.errmsg || data.err_msg || '',
      remoteMd5: firstFile?.md5 ?? '',
      remoteSize: firstFile?.size ? String(firstFile.size) : '',
      title: data.title ?? ''
    }
  } catch (error) {
    return unknownResult(
      error instanceof Error ? error.message : '百度链接检查请求失败'
    )
  }
}
