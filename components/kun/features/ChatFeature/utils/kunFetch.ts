// features/ChatFeature/utils/kunFetch.ts

export const kunFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-requested-with': 'kun-fetch',
      Origin: window.location.origin,
      Referer: window.location.href,
      ...(options.headers || {})
    },
    credentials: 'include'
  })
  return response
}
