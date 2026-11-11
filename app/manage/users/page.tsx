import { Suspense } from 'react'
import { User } from '~/components/manage/user/Container'
import { getUserInfo } from '~/app/api/admin/user/get'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { generateNullMetadata } from '~/utils/noIndex'
import type { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = generateNullMetadata('用户管理')

export default async function Kun() {
  const response = await getUserInfo({
    page: 1,
    limit: 30,
    searchType: 'name'
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <Suspense>
      <User initialUsers={response.users} initialTotal={response.total} />
    </Suspense>
  )
}
