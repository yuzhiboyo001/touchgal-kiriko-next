'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button, User } from '@heroui/react'
import { Ban, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { kunFetchGet, kunFetchDelete } from '~/utils/kunFetch'
import { UserRoleBadge } from '~/components/kun/UserRoleBadge'
import type { BlockedUser } from '~/types/api/user'

export const BlockList = () => {
  const [list, setList] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await kunFetchGet<BlockedUser[]>('/user/block/list')
      setList(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchList()
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const handleUnblock = async (uid: number, name: string) => {
    setRemovingId(uid)
    try {
      const res = await kunFetchDelete<KunResponse<{}>>('/user/block', { uid })
      if (typeof res === 'string') {
        toast.error(res)
      } else {
        setList((prev) => prev.filter((u) => u.id !== uid))
        toast.success(`已解除拉黑 ${name}`)
      }
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Card className="w-full overflow-hidden border border-default-200 bg-content1/85 text-sm shadow-small transition-shadow hover:shadow-medium">
      <CardHeader className="flex-col items-start gap-1 px-5 pb-0 pt-5">
        <h2 className="text-xl font-semibold text-foreground">黑名单</h2>
        <p className="max-w-2xl leading-6 text-default-500">
          拉黑后，双方将无法互相评论、回复、私聊和关注。
        </p>
      </CardHeader>

      <CardBody className="space-y-3 overflow-visible px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-default-400" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
              <Ban className="w-6 h-6 text-pink-400" />
            </div>
            <p className="text-default-500 text-sm">还没有拉黑任何人</p>
          </div>
        ) : (
          list.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-default-50/50 transition-colors"
            >
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
                  className: 'w-10 h-10 shrink-0'
                }}
              />
              <Button
                size="sm"
                variant="light"
                color="danger"
                isLoading={removingId === user.id}
                onPress={() => handleUnblock(user.id, user.name)}
              >
                解除拉黑
              </Button>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  )
}
