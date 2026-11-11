'use client'

import { useState } from 'react'
import { Button } from '@heroui/button'
import { kunFetchPost } from '~/utils/kunFetch'
import { Check, Plus } from 'lucide-react'
import { useRouter } from '@bprogress/next'
import { useUserStore } from '~/store/userStore'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import toast from 'react-hot-toast'

interface Props {
  uid: number
  name: string
  follow: boolean
  fullWidth?: boolean
  compact?: boolean
}

export const UserFollow = ({
  uid,
  name,
  follow,
  fullWidth = true,
  compact = false
}: Props) => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const [isFollow, setIsFollow] = useState(follow)
  const [following, setFollowing] = useState(false)

  const handleFollow = async () => {
    setFollowing(true)

    if (isFollow) {
      const res = await kunFetchPost<KunResponse<{}>>('/user/follow/unfollow', {
        uid
      })
      kunErrorHandler(res, () => {
        setIsFollow(false)
        toast.success(`已取消关注 ${name}`)
      })
    } else {
      const res = await kunFetchPost<KunResponse<{}>>('/user/follow/follow', {
        uid
      })
      kunErrorHandler(res, () => {
        setIsFollow(true)
        toast.success(`已关注 ${name}`)
      })
    }

    router.refresh()
    setFollowing(false)
  }

  return (
    <Button
      startContent={
        isFollow ? (
          <Check className={compact ? 'size-3.5' : 'size-4'} />
        ) : (
          <Plus className={compact ? 'size-3.5' : 'size-4'} />
        )
      }
      color={isFollow ? 'success' : 'primary'}
      className={`gal-sticker gal-sticker-pink ${
        compact ? 'text-xs px-2 min-w-0 h-8' : ''
      }`}
      size={compact ? 'sm' : undefined}
      variant="flat"
      fullWidth={fullWidth}
      onPress={handleFollow}
      isDisabled={following || user.uid === uid || !user.uid}
      isLoading={following}
    >
      {isFollow ? '已关注' : '关注'}
    </Button>
  )
}
