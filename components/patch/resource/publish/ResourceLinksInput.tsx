'use client'

import { useEffect, type Dispatch, type SetStateAction } from 'react'
import {
  Controller,
  useFieldArray,
  type Control,
  type UseFormWatch,
  type UseFormSetValue,
  type FieldErrors
} from 'react-hook-form'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Divider } from '@heroui/divider'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { parseResourceLink } from '~/utils/resourceLink'
import type { ResourceFormData } from './PublishResource' // 引入准确的表单类型

interface ResourceLinksInputProps {
  // 直接使用标准 RHF 的泛型，让 TS 自动推导出正确的类型
  control: Control<ResourceFormData>
  errors: FieldErrors<ResourceFormData>
  setValue: UseFormSetValue<ResourceFormData>
  watch: UseFormWatch<ResourceFormData>
  section: string
  setUploadingResource?: Dispatch<SetStateAction<boolean>>
}
const createEmptyLink = () => ({
  storage: 'user', // 固定为 user
  hash: '',
  content: '',
  size: '',
  code: '',
  password: ''
})

export const ResourceLinksInput = ({
  control,
  errors,
  setValue,
  watch
}: ResourceLinksInputProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'links'
  })

  useEffect(() => {
    if (!fields.length) {
      append(createEmptyLink())
    }
  }, [append, fields.length])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">资源链接</h3>
          <p className="text-sm text-default-500">
            请提供网盘下载链接，不同链接可拥有独立的大小、提取码和解压码
          </p>
        </div>

        <Button
          variant="flat"
          startContent={<Plus className="size-4" />}
          onPress={() => append(createEmptyLink())}
        >
          添加链接
        </Button>
      </div>

      {fields.map((field, index) => {
        return (
          <Card key={field.id} className="border border-default-200">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between ">
                <Chip
                  color="primary"
                  variant="flat"
                  className="gal-sticker-pink"
                >
                  链接 #{index + 1}
                </Chip>

                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  isDisabled={fields.length === 1}
                  onPress={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Controller
                  name={`links.${index}.content`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      label="网盘链接"
                      placeholder="请输入百度网盘、夸克网盘等分享链接"
                      isInvalid={!!errors.links?.[index]?.content}
                      errorMessage={errors.links?.[index]?.content?.message}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text')
                        if (!pasted.trim()) {
                          return
                        }
                        const { url, code } = parseResourceLink(pasted)
                        // 如果识别到了不同的内容（比如自带了提取码），则拦截默认粘贴
                        if (url !== pasted.trim() || code) {
                          e.preventDefault()
                          field.onChange(url)
                          if (code) {
                            setValue(`links.${index}.code`, code, {
                              shouldValidate: true
                            })
                            toast.success('已自动识别并填入提取码')
                          }
                        }
                      }}
                    />
                  )}
                />

                <Controller
                  name={`links.${index}.size`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="大小 (MB 或 GB) - 选填"
                      placeholder="例如 1.024 GB，不知道可留空"
                      isInvalid={!!errors.links?.[index]?.size}
                      errorMessage={errors.links?.[index]?.size?.message}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Controller
                  name={`links.${index}.code`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="提取码"
                      placeholder="如果资源需要提取码，请填写"
                      isInvalid={!!errors.links?.[index]?.code}
                      errorMessage={errors.links?.[index]?.code?.message}
                    />
                  )}
                />

                <Controller
                  name={`links.${index}.password`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="解压码"
                      placeholder="如果资源需要解压码，请填写"
                      isInvalid={!!errors.links?.[index]?.password}
                      errorMessage={errors.links?.[index]?.password?.message}
                    />
                  )}
                />
              </div>

              {index !== fields.length - 1 && <Divider />}
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
