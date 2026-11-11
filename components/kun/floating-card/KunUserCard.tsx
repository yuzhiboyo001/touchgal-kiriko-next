'use client'

import { useEffect, useState } from 'react'
import { User } from '@heroui/react'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunUserStatCard } from './KunUserStatCard'
import { KunUserCardSkeleton } from './KunUserCardSkeleton'
import { UserFollow } from '~/components/user/follow/Follow'
import { UserBlock } from '~/components/user/block/UserBlock'
import { UserRoleBadge } from '~/components/kun/UserRoleBadge'
import type { FloatingCardUser } from '~/types/api/user'

interface UserCardProps {
  uid: number
}

export const KunUserCard = ({ uid }: UserCardProps) => {
  const [user, setUser] = useState<FloatingCardUser | null>(null)
  const [loadError, setLoadError] = useState(false)
  // ✅ 父组件本地状态：拉黑后立即隐藏关注
  const [locallyBlocked, setLocallyBlocked] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      setLoadError(false)

      try {
        const data = await kunFetchGet<FloatingCardUser | string>(
          '/user/profile/floating',
          { uid }
        )

        if (cancelled) return

        if (typeof data === 'string' || !data?._count) {
          setUser(null)
          setLoadError(true)
          return
        }

        setUser(data)
        setLocallyBlocked(data.isBlocked)
      } catch {
        if (!cancelled) {
          setUser(null)
          setLoadError(true)
        }
      }
    }

    void fetchData()
    return () => {
      cancelled = true
    }
  }, [uid])

  if (loadError) {
    return (
      <div className="w-[300px] p-4 text-sm text-default-500">
        暂时无法加载用户信息
      </div>
    )
  }

  if (!user) {
    return <KunUserCardSkeleton />
  }

  const showFollow = !locallyBlocked && !user.isBlockedBy

  return (
    <div className="p-2 w-[320px]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <User
            name={
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{user.name}</span>
                <UserRoleBadge role={user.role} />
              </span>
            }
            description={user.bio || '编辑个性签名'}
            avatarProps={{
              src: user.avatar,
              isBordered: true,
              color: 'secondary',
              className: 'w-12 h-12 shrink-0'
            }}
            classNames={{
              base: 'gap-2',
              name: 'truncate',
              description: 'truncate'
            }}
            className="mb-2"
          />
        </div>

        <div className="flex gap-1 items-center shrink-0">
          {showFollow && (
            <UserFollow
              uid={user.id}
              name={user.name}
              follow={user.isFollow}
              fullWidth={false}
              compact
            />
          )}
          {!user.isBlockedBy && (
            <UserBlock
              uid={user.id}
              name={user.name}
              targetRole={user.role}
              isBlocked={locallyBlocked}
              onBlockChange={setLocallyBlocked}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <KunUserStatCard value={user._count.follower} label="关注者" />
        <KunUserStatCard value={user._count.patch} label="Galgame 数" />
        <KunUserStatCard value={user._count.patch_resource} label="资源数" />
      </div>
    </div>
  )
}

export default KunUserCard
