'use client'

import { useState } from 'react'
import { Chip } from '@heroui/chip'
import { Tooltip } from '@heroui/tooltip'
import { Link } from '@heroui/link'
import { PatchTagSelector } from './PatchTagSelector'
import { useUserStore } from '~/store/userStore'
import type { Tag } from '~/types/api/tag'

interface Props {
  patchId: number
  initialTags: Tag[]
  canManage: boolean
}

export const PatchTag = ({ patchId, initialTags, canManage }: Props) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags ?? [])
  const user = useUserStore((state) => state.user)
  const visibleTags = selectedTags.filter(
    (tag) => !user.blockedTagIds.includes(tag.id)
  )

  return (
    <div className="mt-0 space-y-4">
      <h2 className="pt-8 mt-8 text-2xl border-t border-default-200">
        游戏标签
      </h2>

      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <Tooltip key={tag.id} content={`${tag.count} 个 Galgame 使用此标签`}>
            <Link href={`/tag/${tag.id}`}>
              <Chip color="secondary" variant="flat">
                {tag.name}
                {` +${tag.count}`}
              </Chip>
            </Link>
          </Tooltip>
        ))}

        {!visibleTags.length && (
          <Chip>{'这个 Galgame 暂时没有可显示的标签'}</Chip>
        )}
      </div>

      {canManage && (
        <PatchTagSelector
          patchId={patchId}
          initialTags={selectedTags}
          onTagChange={setSelectedTags}
        />
      )}
    </div>
  )
}
