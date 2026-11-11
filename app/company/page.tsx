import { Container } from '~/components/company/Container'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { getGlobalCapabilities } from '~/lib/permissions'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const revalidate = 120

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const [response, payload] = await Promise.all([
    kunGetActions({
      page: 1,
      limit: 100
    }),
    verifyHeaderCookie()
  ])
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <Container
      initialCompanies={response.companies}
      initialTotal={response.total}
      canManageCompanies={
        getGlobalCapabilities(payload?.role ?? 0).canManageCompanies
      }
    />
  )
}
