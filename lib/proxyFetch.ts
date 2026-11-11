import { ProxyAgent, fetch as undiciFetch } from 'undici'
import type { RequestInit as UndiciRequestInit } from 'undici'

const proxyAgent =
  process.env.NODE_ENV === 'development' && process.env.HTTPS_PROXY
    ? new ProxyAgent(process.env.HTTPS_PROXY)
    : undefined

export const proxyFetch = (
  url: string,
  init: UndiciRequestInit = {},
  timeoutMs = 15_000
) => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = init.signal
    ? AbortSignal.any([init.signal as AbortSignal, timeoutSignal])
    : timeoutSignal

  return undiciFetch(url, {
    ...init,
    signal,
    dispatcher: proxyAgent
  })
}
