import { getServerUserSession } from '~/app/api/user/session/service'
import { KunTopBar } from './TopBar'
import type { SessionStatus, UserSession } from '~/types/api/session'

const SERVER_SESSION_TIMEOUT_MS = 5000

interface ServerSessionState {
  status: SessionStatus
  session: UserSession | null
}

const getServerSessionState = async (): Promise<ServerSessionState> => {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const sessionPromise = getServerUserSession()
      .then<ServerSessionState>((session) =>
        session
          ? { status: 'authenticated', session }
          : { status: 'anonymous', session: null }
      )
      .catch<ServerSessionState>(() => ({
        status: 'unavailable',
        session: null
      }))

    const timeoutPromise = new Promise<ServerSessionState>((resolve) => {
      timer = setTimeout(
        () => resolve({ status: 'unavailable', session: null }),
        SERVER_SESSION_TIMEOUT_MS
      )
    })

    const result = await Promise.race([sessionPromise, timeoutPromise])
    return result
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// 放在 Suspense 里，先吐页面壳，再补 session，避免根 layout 阻塞所有页面
export const KunTopBarSession = async () => {
  const state = await getServerSessionState()

  return (
    <KunTopBar initialSession={state.session} sessionStatus={state.status} />
  )
}
