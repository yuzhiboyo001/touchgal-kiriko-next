'use client'

import { Chip } from '@heroui/react'
import {
  USER_ROLE_MAP,
  USER_STATUS_COLOR_MAP,
  USER_STATUS_MAP
} from '~/constants/user'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { ManageUserEdit } from './ManageUserEdit'
import { ManageUserDelete } from './ManageUserDelete'
import type { AdminUser } from '~/types/api/admin'

interface Props {
  user: AdminUser
  columnKey: string
  onUpdated: (user: AdminUser) => void
  onDeleted: (uid: number) => void
}

export const RenderCell = ({
  user,
  columnKey,
  onUpdated,
  onDeleted
}: Props) => {
  switch (columnKey) {
    case 'user':
      return (
        <KunUser
          user={user}
          userProps={{
            name: user.name,
            description: `补丁数 - ${user._count.patch} | 资源数 - ${user._count.patch_resource} | 萌萌点 - ${user.moemoepoint}`,
            avatarProps: {
              src: user.avatar
            }
          }}
        />
      )
    case 'role':
      return (
        <Chip color="primary" variant="flat" className="gal-sticker-pink">
          {USER_ROLE_MAP[user.role]}
        </Chip>
      )
    case 'status':
      return (
        <Chip color={USER_STATUS_COLOR_MAP[user.status]} variant="flat">
          {USER_STATUS_MAP[user.status]}
        </Chip>
      )
    case 'actions':
      return user.role >= 3 ? (
        <span className="text-xs text-default-400">仅超管可操作</span>
      ) : (
        <div className="flex items-center gap-2">
          <ManageUserEdit initialUser={user} onUpdated={onUpdated} />
          <ManageUserDelete user={user} onDeleted={onDeleted} />
        </div>
      )
    default:
      return null
  }
}
