import { Container } from '~/components/tag/Container'
import { kunMetadata } from './metadata'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { Suspense } from 'react'
import { getAuthenticatedBlockedTagIds } from '~/utils/actions/getBlockedTagIds'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import { NsfwGate } from '~/components/kun/NsfwGate'
import { getGlobalCapabilities } from '~/lib/permissions'
import type { Metadata } from 'next'

export const revalidate = 120

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const [auth, nsfwHeader] = await Promise.all([
    getAuthenticatedBlockedTagIds(),
    getNSFWHeader()
  ])
  if (!auth) {
    return <NsfwGate isLoggedIn={false} centered />
  }

  if (nsfwHeader.content_limit === 'sfw') {
    return <NsfwGate isLoggedIn centered />
  }

  const response = await kunGetActions(
    {
      page: 1,
      limit: 100
    },
    auth.blockedTagIds,
    nsfwHeader.content_limit === 'nsfw' ? 'nsfw' : 'all'
  )
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <Suspense>
      <Container
        initialTags={response.tags}
        initialTotal={response.total}
        uid={auth.payload.uid}
        canManageTags={getGlobalCapabilities(auth.payload.role).canManageTags}
      />
    </Suspense>
  )
}
