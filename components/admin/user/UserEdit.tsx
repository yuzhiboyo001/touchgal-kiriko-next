'use client'

import { useEffect, useState } from 'react'
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
import { USER_ROLE_MAP, USER_STATUS_MAP } from '~/constants/user'
import { kunFetchPost, kunFetchPut } from '~/utils/kunFetch'
import { errorReporter, kunErrorHandler } from '~/utils/kunErrorHandler'
import type { AdminUser } from '~/types/api/admin'

interface Props {
  initialUser: AdminUser
}

const roleOptions = Object.entries(USER_ROLE_MAP).map(([value, label]) => ({
  value: Number(value),
  label
}))

const statusOptions = Object.entries(USER_STATUS_MAP).map(([value, label]) => ({
  value: Number(value),
  label
}))

const toDateInputValue = (value: string | Date | null) => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

export const UserEdit = ({ initialUser }: Props) => {
  const [user, setUser] = useState<AdminUser>(initialUser)
  const [formUser, setFormUser] = useState<AdminUser>(initialUser)
  const [password, setPassword] = useState('')
  const [grantMoemoepoint, setGrantMoemoepoint] = useState('')
  const [grantKirikoCoins, setGrantKirikoCoins] = useState('')
  const [donorUntil, setDonorUntil] = useState('')
  const [disabling2FA, setDisabling2FA] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(initialUser)
      setFormUser(initialUser)
    }, 0)

    return () => clearTimeout(timer)
  }, [initialUser])

  const handleChange = (
    key: keyof AdminUser,
    value: string | number | null
  ) => {
    setFormUser((prev) => ({ ...prev, [key]: value }))
  }

  const handleOpen = () => {
    setFormUser(user)
    setPassword('')
    setGrantMoemoepoint('')
    setGrantKirikoCoins('')
    setDonorUntil(toDateInputValue(user.donorUntil))
    onOpen()
  }

  const handleClose = () => {
    setFormUser(user)
    setPassword('')
    setGrantMoemoepoint('')
    setGrantKirikoCoins('')
    setDonorUntil('')
    onClose()
  }

  const [updating, setUpdating] = useState(false)
  const handleUpdateUserInfo = async () => {
    const requestData = {
      uid: formUser.id,
      name: formUser.name,
      email: formUser.email,
      role: formUser.role,
      status: formUser.status,
      dailyImageCount: formUser.dailyImageCount,
      bio: formUser.bio,
      grantMoemoepoint: Number(grantMoemoepoint) || 0,
      grantKirikoCoins: Number(grantKirikoCoins) || 0,
      nameplate: formUser.nameplate || null,
      donorUntil:
        formUser.nameplate === 'supporter' && donorUntil
          ? new Date(`${donorUntil}T23:59:59+08:00`).toISOString()
          : null,
      ...(password ? { password } : {})
    }

    setUpdating(true)
    try {
      const res = await kunFetchPut<
        KunResponse<{ moemoepoint: number; kirikoCoins: number }>
      >('/admin/user', requestData)
      kunErrorHandler(res, (value) => {
        const nextUser = {
          ...formUser,
          moemoepoint: value.moemoepoint,
          kirikoCoins: value.kirikoCoins
        }
        setUser(nextUser)
        setFormUser(nextUser)
        setPassword('')
        setGrantMoemoepoint('')
        setGrantKirikoCoins('')
        toast.success('更新用户信息成功')
        onClose()
      })
    } catch (error) {
      errorReporter(error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDisable2FA = async () => {
    setDisabling2FA(true)
    try {
      const res = await kunFetchPost<KunResponse<{}>>(
        '/admin/user/2fa/disable',
        {
          uid: formUser.id
        }
      )
      kunErrorHandler(res, () => {
        setUser((prev) => ({ ...prev, enable2FA: false }))
        setFormUser((prev) => ({ ...prev, enable2FA: false }))
        toast.success('关闭用户两步验证成功')
      })
    } catch (error) {
      errorReporter(error)
    } finally {
      setDisabling2FA(false)
    }
  }

  return (
    <>
      <Button isIconOnly size="sm" variant="light" onPress={handleOpen}>
        <Edit2 size={16} />
      </Button>

      <Modal size="2xl" isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <ModalHeader>编辑用户: {formUser.name}</ModalHeader>
          <ModalBody>
            <p>修改账号信息会导致该用户重新登录；仅发放积分/金币不会</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="用户 ID" value={String(formUser.id)} isReadOnly />
              <Input
                label="用户名"
                value={formUser.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <Input
                label="邮箱"
                type="email"
                value={formUser.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              <Select
                label="角色"
                selectedKeys={[String(formUser.role)]}
                onChange={(e) => handleChange('role', Number(e.target.value))}
              >
                {roleOptions.map((role) => (
                  <SelectItem key={role.value}>{role.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="状态"
                selectedKeys={[String(formUser.status)]}
                onChange={(e) => handleChange('status', Number(e.target.value))}
                disabledKeys={['1']}
              >
                {statusOptions.map((status) => (
                  <SelectItem key={status.value}>{status.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="每日图片限额"
                type="number"
                value={String(formUser.dailyImageCount)}
                onChange={(e) =>
                  handleChange('dailyImageCount', Number(e.target.value))
                }
              />
              <div className="col-span-2 space-y-3 rounded-large border border-default-200 p-4">
                <div>
                  <p className="text-sm font-medium">身份铭牌</p>
                  <p className="mt-1 text-xs text-default-500">
                    仅超管可发放。Kiriko 支持者仅限 30
                    元月度支持，过期后自动隐藏。
                  </p>
                </div>
                <Select
                  label="当前铭牌"
                  selectedKeys={[formUser.nameplate || 'none']}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0]
                    if (typeof value === 'string') {
                      handleChange('nameplate', value === 'none' ? null : value)
                    }
                  }}
                >
                  <SelectItem key="none">无</SelectItem>
                  <SelectItem key="supporter">Kiriko 支持者</SelectItem>
                </Select>
                {formUser.nameplate === 'supporter' && (
                  <Input
                    label="支持有效期至"
                    type="date"
                    value={donorUntil}
                    onChange={(e) => setDonorUntil(e.target.value)}
                    description="按月度支持时间设置；过期后铭牌隐藏"
                  />
                )}
              </div>
              <div className="col-span-2 space-y-3 rounded-large border border-default-200 p-4">
                <div>
                  <p className="text-sm font-medium">发放积分 / 金币</p>
                  <p className="mt-1 text-xs text-default-500">
                    输入数量后直接增加，留空或 0 表示不发放
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="发放萌萌点"
                    type="number"
                    min={0}
                    value={grantMoemoepoint}
                    description={`当前 ${formUser.moemoepoint}`}
                    onChange={(e) => setGrantMoemoepoint(e.target.value)}
                  />
                  <Input
                    label="发放看板娘金币"
                    type="number"
                    min={0}
                    value={grantKirikoCoins}
                    description={`当前 ${formUser.kirikoCoins}`}
                    onChange={(e) => setGrantKirikoCoins(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Input
                  label="新密码"
                  type="password"
                  autoComplete="new-password"
                  description="留空则不修改该用户密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Textarea
                  label="签名"
                  value={formUser.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="warning"
              variant="flat"
              className="mr-auto"
              isDisabled={updating || disabling2FA || !formUser.enable2FA}
              isLoading={disabling2FA}
              onPress={handleDisable2FA}
            >
              关闭两步验证
            </Button>
            <Button color="danger" variant="light" onPress={handleClose}>
              取消
            </Button>
            <Button
              color="primary"
              className="gal-sticker gal-sticker-pink"
              isDisabled={updating || disabling2FA}
              isLoading={updating}
              onPress={handleUpdateUserInfo}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
