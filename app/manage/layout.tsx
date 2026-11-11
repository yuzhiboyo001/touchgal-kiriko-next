import { redirect } from 'next/navigation'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { generateNullMetadata } from '~/utils/noIndex'
import type { Metadata } from 'next'

export const metadata: Metadata = generateNullMetadata('用户管理')

export default async function ManageLayout({
  children
}: {
  children: React.ReactNode
}) {
  const payload = await verifyHeaderCookie()
  if (!payload || payload.role < 3) {
    redirect('/')
  }

  return (
    <div className="container mx-auto my-4 px-4">
      <div className="w-full min-w-0">{children}</div>
    </div>
  )
}
