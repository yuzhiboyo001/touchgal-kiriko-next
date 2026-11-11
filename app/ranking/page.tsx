// app/ranking/page.tsx

import { Suspense } from 'react'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import { generateNullMetadata } from '~/utils/noIndex'
import { RankingContainer } from '~/components/ranking/Container'
import { KunBreadcrumbTitle } from '~/components/kun/BreadcrumbTitle'
import type { Metadata } from 'next'

export const revalidate = 120

export const metadata: Metadata = {
  ...generateNullMetadata('排行榜')
}

export default async function Kun() {
  // 1. 获取登录状态 / NSFW 设置
  const [payload, nsfwHeader] = await Promise.all([
    verifyHeaderCookie(),
    getNSFWHeader()
  ])
  const isLoggedIn = !!payload?.uid
  const nsfwAllowed = nsfwHeader.content_limit !== 'sfw'

  return (
    <Suspense>
      {/* 2. 面包屑和标题无论如何都渲染，爬虫能读到 */}
      <KunBreadcrumbTitle routeKey="/ranking" title="排行榜" />

      {/* 3. 未登录或未开启 NSFW 时只显示提醒 */}
      <RankingContainer isLoggedIn={isLoggedIn} nsfwAllowed={nsfwAllowed} />
    </Suspense>
  )
}
