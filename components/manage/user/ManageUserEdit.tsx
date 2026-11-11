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
  Select,
  SelectItem,
  Textarea,
  useDisclosure
} from '@heroui/react'
import { Edit2 } from 'lucide-react'
import { USER_STATUS_MAP } from '~/constants/user'
import { kunFetchPut } from '~/utils/kunFetch'
import { errorReporter, kunErrorHandler } from '~/utils/kunErrorHandler'
import type { AdminUser } from '~/types/api/admin'

interface Props {
  initialUser: AdminUser
  onUpdated: (user: AdminUser) => void
}

const statusOptions = Object.entries(USER_STATUS_MAP).map(([value, label]) => ({
  value: Number(value),
  label
}))

export const ManageUserEdit = ({ initialUser, onUpdated }: Props) => {
  const user = initialUser
  const [name, setName] = useState(initialUser.name)
  const [bio, setBio] = useState(initialUser.bio)
  const [status, setStatus] = useState(initialUser.status)
  const [banReason, setBanReason] = useState('')
  const [updating, setUpdating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleOpen = () => {
    setName(user.name)
    setBio(user.bio)
    setStatus(user.status)
    setBanReason('')
    onOpen()
  }

  const handleClose = () => {
    setName(user.name)
    setBio(user.bio)
    setStatus(user.status)
    setBanReason('')
    onClose()
  }

  const handleSave = async () => {
    setUpdating(true)
    try {
      const res = await kunFetchPut<
        KunResponse<{ name: string; bio: string; status: number }>
      >('/manage/user', {
        uid: user.id,
        name,
        bio,
        status,
        ...(banReason.trim() ? { banReason: banReason.trim() } : {})
      })

      kunErrorHandler(res, (value) => {
        const updated = {
          ...user,
          name: value.name,
          bio: value.bio,
          status: value.status
        }
        onUpdated(updated)
        toast.success('用户信息已更新')
        onClose()
      })
    } catch (error) {
      errorReporter(error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <Button isIconOnly size="sm" variant="light" onPress={handleOpen}>
        <Edit2 size={16} />
      </Button>

      <Modal size="xl" isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <ModalHeader>管理用户：{user.name}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              管理员只能修改用户名、签名和账号状态；邮箱、密码、角色、每日图片限额和货币由超管管理。
            </p>

            <Input
              label="用户名"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              label="签名"
              value={bio}
              maxLength={107}
              onChange={(e) => setBio(e.target.value)}
            />
            <Select
              label="账号状态"
              selectedKeys={[String(status)]}
              onSelectionChange={(keys) => {
                const value = Number(Array.from(keys)[0])
                if (Number.isFinite(value)) {
                  setStatus(value)
                }
              }}
            >
              {statusOptions.map((option) => (
                <SelectItem key={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            {status === 2 && (
              <Textarea
                label="封禁原因"
                description="可选，会写入管理日志"
                value={banReason}
                maxLength={200}
                onChange={(e) => setBanReason(e.target.value)}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose}>
              取消
            </Button>
            <Button
              color="primary"
              className="gal-sticker gal-sticker-pink"
              isLoading={updating}
              isDisabled={updating || !name.trim()}
              onPress={handleSave}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
