// app/login/page.tsx
import { redirect } from 'next/navigation'
import { LoginForm } from '~/components/login/Login'
import { kunMetadata } from './metadata'
import { LoginContainer } from '~/components/login/Container'
import { getServerUserSession } from '~/app/api/user/session/service'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  // 只有会话真正有效时才回首页。仅凭 Cookie 存在就重定向会把
  // 已被管理员改角色、或已过期的用户困在 / 与 /login 之间。
  const session = await getServerUserSession().catch(() => null)
  if (session) {
    redirect('/')
  }

  return (
    <LoginContainer title="登录">
      <LoginForm />
    </LoginContainer>
  )
}
