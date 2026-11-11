'use client'

import { Button } from '@heroui/button'
import { BadgeCheck, Pencil, Shield, Users } from 'lucide-react'
import { useRouter } from '@bprogress/next'
import { useSessionStore } from '~/store/sessionStore'
import type { UserInfo } from '~/types/api/user'

interface Props {
  user: UserInfo
}

export const SelfButton = ({ user }: Props) => {
  const router = useRouter()
  const canAccessAdmin = useSessionStore(
    (state) => state.capabilities?.canAccessAdmin ?? false
  )
  const canApplyCreator = useSessionStore(
    (state) => state.capabilities?.canApplyCreator ?? false
  )
  const isSelf = user.id === user.requestUserUid
  const isShowAdminButton = isSelf && canAccessAdmin
  const isShowManageUsersButton = isSelf && user.role === 3

  return (
    <div className="flex-col w-full space-y-3">
      <div className="flex space-x-3">
        <Button
          className="gal-sticker gal-sticker-pink"
          startContent={<Pencil className="size-4" />}
          color="primary"
          variant="flat"
          fullWidth
          onPress={() => router.push('/settings/user')}
        >
          编辑信息
        </Button>

        {isShowAdminButton && (
          <Button
            startContent={<Shield className="size-4" />}
            color="primary"
            variant="solid"
            fullWidth
            onPress={() => router.push('/admin')}
          >
            管理面板
          </Button>
        )}
      </div>

      {isShowManageUsersButton && (
        <Button
          startContent={<Users className="size-4" />}
          color="primary"
          variant="flat"
          fullWidth
          onPress={() => router.push('/manage/users')}
        >
          用户管理
        </Button>
      )}

      {canApplyCreator && (
        <Button
          startContent={<BadgeCheck className="size-4" />}
          color="primary"
          fullWidth
          onPress={() => router.push('/apply')}
        >
          申请成为创作者
        </Button>
      )}
    </div>
  )
}
