'use client'

import { useState } from 'react'
import { Button } from '@heroui/button'
import { Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { kunFetchPost, kunFetchDelete } from '~/utils/kunFetch'
import { useUserStore } from '~/store/userStore'

interface Props {
  uid: number
  name: string
  targetRole: number
  isBlocked?: boolean
  onBlockChange?: (blocked: boolean) => void
}

export const UserBlock = ({
  uid,
  name,
  targetRole,
  isBlocked = false,
  onBlockChange
}: Props) => {
  const currentUser = useUserStore((state) => state.user)
  const [blocked, setBlocked] = useState(isBlocked)
  const [loading, setLoading] = useState(false)

  if (currentUser.uid === uid) {
    return null
  }

  // 普通用户/创作者不能拉黑管理员或超级管理员；
  // 已存在的历史关系仍然允许解除。
  if (!blocked && currentUser.role <= 2 && targetRole >= 3) {
    return null
  }

  const handleBlock = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await kunFetchPost<KunResponse<{}>>('/user/block', { uid })
      if (typeof res === 'string') {
        toast.error(res)
      } else {
        setBlocked(true)
        onBlockChange?.(true)
        toast.success(`已拉黑 ${name}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await kunFetchDelete<KunResponse<{}>>('/user/block', { uid })
      if (typeof res === 'string') {
        toast.error(res)
      } else {
        setBlocked(false)
        onBlockChange?.(false)
        toast.success(`已解除拉黑 ${name}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      startContent={<Ban className="size-3.5" />}
      color={blocked ? 'success' : 'danger'}
      className="gal-sticker gal-sticker-pink text-xs px-2 min-w-0 h-8"
      variant="flat"
      onPress={blocked ? handleUnblock : handleBlock}
      isDisabled={loading || !currentUser.uid}
      isLoading={loading}
    >
      {blocked ? '解除' : '拉黑'}
    </Button>
  )
}
