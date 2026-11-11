'use client'

import { Button, Card, CardBody, Chip, Switch } from '@heroui/react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { kunFetchPut } from '~/utils/kunFetch'
import { broadcastStoreChange } from '~/store/crossTab'
import { useFeatureAccessStore } from '~/store/featureAccessStore'
import type { FeatureAccess, FeatureKey } from '~/lib/featureAccess'

interface Props {
  access: FeatureAccess
}

const ROLE_ROWS = [
  { role: 1 as const, label: '角色 1 · 用户' },
  { role: 2 as const, label: '角色 2 · 创作者' },
  { role: 3 as const, label: '角色 3 · 管理员' },
  { role: 4 as const, label: '角色 4 · 超级管理员' }
]

const FEATURES: { key: FeatureKey; title: string; description: string }[] = [
  {
    key: 'publishResource',
    title: '资源发布',
    description: '控制“添加资源 / 编辑资源 / 删除资源”三个按钮及相关写操作。'
  },
  {
    key: 'dlsiteImport',
    title: 'DLsite 爬虫',
    description: '控制创建/编辑游戏中的“获取 DLSite 数据”按钮和爬虫接口。'
  }
]

export const FeatureAccessSetting = ({ access }: Props) => {
  const [form, setForm] = useState<FeatureAccess>(access)
  const [saving, setSaving] = useState(false)

  const toggle = (feature: FeatureKey, role: 1 | 2 | 3, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [role]: value,
        // 超管永远开启，避免误操作后无法恢复
        4: true
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await kunFetchPut<KunResponse<{}>>(
      '/admin/setting/feature-access',
      form
    )
    if (typeof res === 'string') {
      toast.error(res)
    } else {
      useFeatureAccessStore.getState().reset()
      broadcastStoreChange('feature-access')
      toast.success('功能权限已更新')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">功能权限开关</h3>
            <p className="text-small text-default-500">
              默认全部关闭，只允许超级管理员使用。Redis 不可用时也保持关闭。
            </p>
          </div>

          {FEATURES.map((feature) => (
            <div
              key={feature.key}
              className="rounded-xl border border-default-200/60 p-4"
            >
              <div className="mb-3">
                <h4 className="font-semibold">{feature.title}</h4>
                <p className="text-small text-default-500">
                  {feature.description}
                </p>
              </div>

              <div className="space-y-2">
                {ROLE_ROWS.map(({ role, label }) => (
                  <div
                    key={role}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <span>{label}</span>
                      {role === 4 && (
                        <Chip size="sm" variant="flat" color="primary">
                          固定开启
                        </Chip>
                      )}
                    </div>
                    <Switch
                      isSelected={role === 4 ? true : form[feature.key][role]}
                      isDisabled={role === 4}
                      onValueChange={(value) => {
                        if (role !== 4) toggle(feature.key, role, value)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-default-500">修改后立即生效，无需重启服务</p>
        <Button
          color="primary"
          variant="shadow"
          onPress={handleSave}
          isLoading={saving}
          isDisabled={saving}
        >
          保存功能权限
        </Button>
      </div>
    </div>
  )
}
