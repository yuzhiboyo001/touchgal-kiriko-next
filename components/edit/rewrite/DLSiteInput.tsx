'use client'

import { useShallow } from 'zustand/react/shallow'
import { useState } from 'react'
import { Button, Input } from '@heroui/react'
import toast from 'react-hot-toast'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { kunFetchPost } from '~/utils/kunFetch'
import { FetchPreview } from '~/components/edit/components/FetchPreview'
import { normalizeStringArray } from '~/utils/normalizeStringArray'
import { useFeatureAccess } from '~/components/kun/hooks/useFeatureAccess'

interface DlsiteResponse {
  rj_code: string
  title_default: string
  title_jp?: string
  title_en?: string
  title_cn?: string
  cover_url?: string
  release_date?: string
  tags?: string
  circle_name?: string
  circle_link?: string
  is_announce?: boolean
}

interface PreviewData {
  titleDefault: string
  titleJp: string
  titleEn: string
  titleCn: string
  tags: string[]
  circleName: string
  releaseDate: string
}

const parseTags = (raw?: string) =>
  normalizeStringArray(raw?.split(/[,，]/) ?? [])

export const DLSiteInput = ({ errors }: { errors?: string }) => {
  const { data, setData } = useRewritePatchStore(
    useShallow((state) => ({ data: state.data, setData: state.setData }))
  )
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const { canUseDlsiteImport } = useFeatureAccess()

  const handleFetch = async () => {
    const rawCode = data.dlsiteCode.trim()
    if (!rawCode) {
      toast.error('DLSite Code 不可为空')
      return
    }

    const normalized = rawCode.toUpperCase()
    if (!/^(RJ|VJ)\d+$/.test(normalized)) {
      toast.error('DLSite Code 需要以 RJ 或 VJ 开头')
      return
    }

    try {
      toast('正在从 DLSite 获取数据...')
      const result = await kunFetchPost<KunResponse<DlsiteResponse>>(
        '/edit/dlsite',
        { code: normalized }
      )

      if (typeof result === 'string') {
        toast.error(result)
        return
      }

      if (!result?.title_default) {
        toast.error('未找到对应的 DLSite 数据')
        return
      }

      const parsedTags = parseTags(result.tags)

      setPreview({
        titleDefault: result.title_default,
        titleJp: result.title_jp?.trim() ?? '',
        titleEn: result.title_en?.trim() ?? '',
        titleCn: result.title_cn?.trim() ?? '',
        tags: parsedTags,
        circleName: result.circle_name?.trim() ?? '',
        releaseDate: result.release_date ?? ''
      })

      const alias = normalizeStringArray([
        ...data.alias,
        result.title_jp,
        result.title_en
      ]).filter((a) => a !== data.name)
      const tags = normalizeStringArray([...data.tag, ...parsedTags])

      setData({
        ...data,
        dlsiteCode: normalized,
        dlsiteCircleName: result.circle_name?.trim() ?? '',
        dlsiteCircleLink: result.circle_link?.trim() ?? '',
        alias,
        tag: tags,
        released: result.release_date || data.released
      })

      if (result.is_announce) {
        toast('这是 DLSite 预告作品，已按预告信息导入', { icon: '📢' })
      } else {
        toast.success('已获取 DLSite 数据并自动写入表单')
      }
    } catch (error) {
      setPreview(null)
      toast.error(
        error instanceof Error
          ? error.message
          : 'DLSite API 请求失败, 请稍后重试'
      )
    }
  }

  return (
    <div className="w-full space-y-2">
      <h2 className="text-xl">DLSite Code (可选)</h2>
      <Input
        variant="underlined"
        labelPlacement="outside"
        placeholder="请输入 DLSite Code, 例如 RJ01405813 或 VJ012345"
        value={data.dlsiteCode}
        onChange={(e) => {
          setPreview(null)
          setData({ ...data, dlsiteCode: e.target.value })
        }}
        isInvalid={!!errors}
        errorMessage={errors}
      />
      <div className="flex items-center text-sm">
        {data.dlsiteCode && canUseDlsiteImport && (
          <Button
            className="mr-4"
            color="primary"
            size="sm"
            onPress={handleFetch}
          >
            获取 DLSite 数据
          </Button>
        )}
      </div>
      {preview && (
        <FetchPreview
          fields={[
            { label: '默认标题', value: preview.titleDefault },
            { label: '中文标题', value: preview.titleCn },
            { label: '日文标题', value: preview.titleJp },
            { label: '英文标题', value: preview.titleEn },
            { label: '标签', value: preview.tags },
            { label: '社团', value: preview.circleName },
            { label: '发售日期', value: preview.releaseDate }
          ]}
        />
      )}
    </div>
  )
}
