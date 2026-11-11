'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@heroui/react'
import { Trash2 } from 'lucide-react'
import { kunFetchDelete } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import type { AdminUser } from '~/types/api/admin'

interface Props {
  user: AdminUser
  onDeleted: (uid: number) => void
}

export const ManageUserDelete = ({ user, onDeleted }: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleOpen = () => {
    setConfirmName('')
    onOpen()
  }

  const handleClose = () => {
    setConfirmName('')
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await kunFetchDelete<KunResponse<{}>>('/manage/user', {
        uid: user.id,
        confirmName
      })
      kunErrorHandler(res, () => {
        toast.success('用户已永久删除')
        onDeleted(user.id)
        onClose()
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        isIconOnly
        size="sm"
        color="danger"
        variant="light"
        aria-label={`删除用户 ${user.name}`}
        onPress={handleOpen}
      >
        <Trash2 size={16} />
      </Button>

      <Modal size="2xl" isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <ModalHeader>删除用户：{user.name}</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <h2 className="text-2xl text-danger">严重警告</h2>
              <p>
                你正在永久删除用户 <strong>{user.name}</strong>（ID：{user.id}
                ）。
              </p>
              <p className="text-danger">
                此操作不可恢复。该用户的资源、评论、收藏、评分、聊天记录和 R2
                文件都会一起删除。
              </p>
              <div className="rounded-lg bg-default-100 p-3 text-sm">
                <p>该用户当前有：</p>
                <p>补丁数：{user._count.patch}</p>
                <p>资源数：{user._count.patch_resource}</p>
              </div>
              <p>请输入用户名确认：</p>
              <Input
                label="用户名"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleClose}>
              取消
            </Button>
            <Button
              color="danger"
              isDisabled={deleting || confirmName !== user.name}
              isLoading={deleting}
              onPress={handleDelete}
            >
              永久删除用户
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
