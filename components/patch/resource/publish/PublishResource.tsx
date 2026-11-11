'use client'

import { z } from 'zod'
import { useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@heroui/button'
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@heroui/react'
import toast from 'react-hot-toast'
import { kunFetchPost } from '~/utils/kunFetch'
import { patchResourceCreateSchema } from '~/validations/patch'
import { ResourceLinksInput } from './ResourceLinksInput'
import { ResourceDetailsForm } from './ResourceDetailsForm'
import { ResourceSectionSelect } from './ResourceSectionSelect'
import { Upload, Gamepad2, Puzzle } from 'lucide-react'
import {
  RESOURCE_SECTION_MAP,
  SUPPORTED_RESOURCE_SECTION
} from '~/constants/resource'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { useSessionStore } from '~/store/sessionStore'
import type { PatchResource } from '~/types/api/patch'

export type ResourceFormData = z.infer<typeof patchResourceCreateSchema>

interface CreateResourceProps {
  patchId: number
  onClose: () => void
  onSuccess?: (res: PatchResource) => void
}

export const PublishResource = ({
  patchId,
  onClose,
  onSuccess
}: CreateResourceProps) => {
  // 现在只有一种存储方式，直接返回固定值
  const createDefaultLink = () => ({
    storage: 'user',
    hash: '',
    content: '',
    size: '',
    code: '',
    password: ''
  })

  const [creating, setCreating] = useState(false)
  const creatingRef = useRef(false)
  const canPublishOfficialResource = useSessionStore(
    (state) => state.capabilities?.canPublishOfficialResource ?? false
  )
  const needsSectionPreselection = !canPublishOfficialResource
  const [sectionConfirmed, setSectionConfirmed] = useState(
    !needsSectionPreselection
  )

  const {
    control,
    reset,
    setValue,
    formState: { errors },
    watch
  } = useForm<ResourceFormData>({
    resolver: zodResolver(patchResourceCreateSchema) as any,
    defaultValues: {
      patchId,
      name: '',
      section: canPublishOfficialResource ? 'galgame' : 'patch',
      type: [],
      language: [],
      platform: [],
      note: '',
      links: [createDefaultLink()]
    }
  })

  const handleRewriteResource = async () => {
    if (creatingRef.current) {
      return
    }

    creatingRef.current = true
    setCreating(true)
    try {
      const res = await kunFetchPost<KunResponse<PatchResource>>(
        '/patch/resource',
        watch()
      )
      kunErrorHandler(res, (value) => {
        reset()
        if (value.status === 2) {
          toast.success('资源已提交审核，通过后将自动显示')
          onClose()
        } else {
          onSuccess?.(value)
          toast.success('发布成功')
        }
      })
    } finally {
      creatingRef.current = false
      setCreating(false)
    }
  }

  const sectionIcons: Record<string, ReactNode> = {
    galgame: <Gamepad2 className="size-8" />,
    patch: <Puzzle className="size-8" />
  }

  return (
    <ModalContent>
      <ModalHeader className="flex-col space-y-2">
        <h3 className="text-lg">发布资源</h3>
      </ModalHeader>

      <ModalBody>
        {needsSectionPreselection && !sectionConfirmed ? (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <h3 className="text-xl font-semibold">请先选择资源的类别</h3>
            <div className="flex gap-4">
              {SUPPORTED_RESOURCE_SECTION.map((s) => (
                <Button
                  key={s}
                  size="lg"
                  variant="bordered"
                  className="flex h-24 w-40 flex-col gap-2"
                  onPress={() => {
                    setValue('section', s)
                    setValue('links', [createDefaultLink()])
                    setSectionConfirmed(true)
                  }}
                >
                  {sectionIcons[s]}
                  {RESOURCE_SECTION_MAP[s]}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <form className="space-y-6">
            {!needsSectionPreselection && (
              <ResourceSectionSelect
                errors={errors}
                section={watch().section}
                setSection={(content) => {
                  setValue('section', content)
                  setValue('links', [createDefaultLink()])
                }}
              />
            )}

            <ResourceLinksInput
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              section={watch().section}
            />

            <ResourceDetailsForm control={control} errors={errors} />
          </form>
        )}
      </ModalBody>

      <ModalFooter className="flex-col items-end">
        <div className="space-x-2">
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          {(sectionConfirmed || !needsSectionPreselection) && (
            <Button
              color="primary"
              className="gal-sticker gal-sticker-pink"
              disabled={creating}
              isLoading={creating}
              endContent={<Upload className="size-4" />}
              onPress={handleRewriteResource}
            >
              提交资源
            </Button>
          )}
        </div>

        {creating && (
          <p className="text-xs text-default-500">
            正在提交资源，请不要关闭此窗口，提交完成后会有提示。
          </p>
        )}
      </ModalFooter>
    </ModalContent>
  )
}
