'use client'

import DOMPurify from 'isomorphic-dompurify'
import { useEffect, useState } from 'react'
import { Button, User } from '@heroui/react'
import { Download } from 'lucide-react'
import { KunTimeAgo } from '~/components/kun/TimeAgo'
import { KunResourceDownloadCard } from './KunDownloadCard'
import { UserRoleBadge } from '~/components/kun/UserRoleBadge'
import Link from 'next/link'
import type { KunPatchResourceResponse } from '~/types/api/kun/moyu-moe'

interface Props {
  resource: KunPatchResourceResponse
}

export const KunResourceDownload = ({ resource }: Props) => {
  const [showLinks, setShowLinks] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    let cancelled = false
    const getResourceNoteHtml = async () => {
      const { markdownToHtml } = await import('./markdownToHtml')
      const html = await markdownToHtml(resource.note)
      if (cancelled) {
        return
      }
      setNote(DOMPurify.sanitize(html))
    }
    getResourceNoteHtml()
    return () => {
      cancelled = true
    }
  }, [resource.note])

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <h3 className="font-medium">
          {resource.name ? resource.name : '资源备注'}
        </h3>
        {resource.update_time && (
          <p className="text-sm text-default-500">
            该资源最后更新于 <KunTimeAgo date={resource.update_time} />
          </p>
        )}
      </div>

      {resource.note && (
        <div
          className="kun-prose max-w-none mt-2"
          dangerouslySetInnerHTML={{ __html: note }}
        />
      )}

      <div className="flex justify-between items-center pt-2">
        <Link
          target="_blank"
          href={`/user/${resource.user.id}`}
          // 注意：原代码写死了 https://www.moyu.moe，我改成了相对路径，请确认你的用户主页路由是否为 /user/[id]
        >
          <User
            name={
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{resource.user.name}</span>
                <UserRoleBadge role={resource.user.role} />
              </span>
            }
            description={`发布于 ${resource.user.name}`}
            avatarProps={{
              showFallback: true,
              src: resource.user.avatar,
              name: resource.user.name.charAt(0).toUpperCase()
            }}
          />
        </Link>

        <div className="flex gap-2">
          <Button
            color="primary"
            variant="flat"
            startContent={<Download className="size-4" />}
            onPress={() => setShowLinks((prev) => !prev)}
          >
            {showLinks ? '收起链接' : '获取资源'}
          </Button>
        </div>
      </div>

      {showLinks && (
        <div className="pt-2">
          <KunResourceDownloadCard resource={resource} />
        </div>
      )}
    </div>
  )
}
