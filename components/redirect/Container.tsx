'use client'

import { Suspense } from 'react'
import { Alert } from '@heroui/react'
import { KunRedirectCard } from './KunRedirectCard'

export const KunRedirectContainer = () => {
  return (
    <div className="container mx-auto my-8">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-medium">外部链接跳转</h1>
          <p className="text-default-500">在您继续前往之前, 请确认下方的链接</p>
        </div>

        <Suspense>
          <KunRedirectCard />
        </Suspense>

        <div className="max-w-2xl w-full">
          <Alert
            color="primary"
            variant="flat"
            title={<span className="text-lg">温馨提示</span>}
            description={
              <span className="text-base leading-8">
                本站致力于提供 Galgame
                的信息与链接导航服务，不直接分发文件。若您在下载时遇到问题，欢迎在评论区向资源发布者反馈。同时，由于外部环境复杂，请各位在访问外部链接时注意网络安全，谨防虚假信息与网络诈骗。
              </span>
            }
          />
        </div>
      </div>
    </div>
  )
}
