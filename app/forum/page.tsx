// app/forum/page.tsx
import { Suspense } from 'react'
import { generateNullMetadata } from '~/utils/noIndex'
import { KunBreadcrumbTitle } from '~/components/kun/BreadcrumbTitle'
import { MessageSquare } from 'lucide-react'
import { QQGroupCard } from '~/components/forum/QQGroupCard'
import type { Metadata } from 'next'

// ✅ 禁止搜索引擎收录
export const metadata: Metadata = {
  ...generateNullMetadata('论坛')
}

export default function Kun() {
  return (
    <div className="w-full">
      {/* ✅ 统一的面包屑导航 */}
      <KunBreadcrumbTitle routeKey="/forum" title="论坛" />

      <Suspense>
        {/* 论坛的占位内容 */}
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-3 py-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 dark:bg-pink-900/20">
            <MessageSquare className="h-8 w-8 text-pink-400" />
          </div>

          <h2 className="mb-2 text-2xl font-bold tracking-wider text-default-700">
            正在施工中ing...
          </h2>

          <p className="max-w-md text-center text-sm leading-relaxed text-default-500">
            论坛目前暂未开放，敬请期待后续的更新哦！
          </p>

          <QQGroupCard />
        </div>
      </Suspense>
    </div>
  )
}
