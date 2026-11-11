/**
 * fetch 默认没有超时；外部 API 挂起时请求会一直占用 socket 和内存。
 * 统一包一层，默认 5 秒，超时抛 AbortError。
 */
export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 5_000
) => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal

  return fetch(input, { ...init, signal })
}
