'use client'

import { useState } from 'react'
import { Button, Input } from '@heroui/react'
import Link from 'next/link'
import localforage from 'localforage'
import toast from 'react-hot-toast'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { dataURItoBlob } from '~/utils/dataURItoBlob'
import { FetchPreview } from '~/components/edit/components/FetchPreview'
import { useKunMilkdownStore } from '~/store/milkdownStore'
import { useFeatureAccess } from '~/components/kun/hooks/useFeatureAccess'
import type { PatchFormDataShape } from '~/components/edit/types'
import { normalizeStringArray } from '~/utils/normalizeStringArray'

interface DlsiteResponse {
  rj_code: string
  title_default: string
  title_jp?: string
  title_en?: string
  title_cn?: string
  cover_url?: string
  cover_data_url?: string
  release_date?: string
  tags?: string
  circle_name?: string
  circle_link?: string
  description_md?: string
  images?: { token: string; url: string }[]
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
  descriptionMd: string
}

const parseTags = (raw?: string) =>
  normalizeStringArray(raw?.split(/[,，]/) ?? [])

interface Props<T extends PatchFormDataShape> {
  errors?: string
  data: T
  setData: (data: T) => void
  excludeId?: number
}

export const DLSiteInput = <T extends PatchFormDataShape>({
  errors,
  data,
  setData,
  excludeId
}: Props<T>) => {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [duplicateUniqueId, setDuplicateUniqueId] = useState<string | null>(
    null
  )
  const { canUseDlsiteImport } = useFeatureAccess()
  const refreshMilkdownContent = useKunMilkdownStore(
    (s) => s.refreshMilkdownContent
  )

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

    const duplicateResult = await kunFetchGet<
      KunResponse<{ uniqueId: string }>
    >('/edit/duplicate', {
      dlsiteCode: normalized,
      ...(excludeId ? { excludeId: String(excludeId) } : {})
    })

    if (typeof duplicateResult !== 'string' && duplicateResult?.uniqueId) {
      setDuplicateUniqueId(duplicateResult.uniqueId)
      toast.error('发现重复游戏条目, 请勿重复提交')
      return
    }
    setDuplicateUniqueId(null)

    try {
      toast('正在从 DLSite 获取数据...')
      const result = await kunFetchPost<KunResponse<DlsiteResponse>>(
        '/edit/dlsite',
        { code: normalized, uploadImages: true }
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
      const descriptionMd = result.description_md?.trim() ?? ''

      setPreview({
        titleDefault: result.title_default,
        titleJp: result.title_jp?.trim() ?? '',
        titleEn: result.title_en?.trim() ?? '',
        titleCn: result.title_cn?.trim() ?? '',
        tags: parsedTags,
        circleName: result.circle_name?.trim() ?? '',
        releaseDate: result.release_date ?? '',
        descriptionMd
      })

      const alias = normalizeStringArray([
        ...data.alias,
        result.title_jp,
        result.title_en
      ]).filter((a) => a !== data.name)
      const tags = normalizeStringArray([...data.tag, ...parsedTags])

      // 无条件覆盖 introduction（有简介就覆盖，没有则保留）
      setData({
        ...data,
        dlsiteCode: normalized,
        dlsiteCircleName: result.circle_name?.trim() ?? '',
        dlsiteCircleLink: result.circle_link?.trim() ?? '',
        alias,
        tag: tags,
        released: result.release_date || data.released,
        introduction: descriptionMd || data.introduction
      })

      // 有简介时驱动 Milkdown / Codemirror 刷新
      if (descriptionMd) {
        refreshMilkdownContent()
      }

      // Python 只返回封面地址；这里把图片交给上传页的裁剪器，
      // 不在这里上传 R2，最终仍由正常发布流程处理。
      if (result.cover_data_url) {
        try {
          const coverBlob = dataURItoBlob(result.cover_data_url)
          await localforage.setItem('kun-patch-banner', coverBlob)
          await localforage.setItem('kun-patch-banner-original', coverBlob)
          window.dispatchEvent(new Event('kun-banner-imported'))
        } catch (coverError) {
          console.warn('DLSite 封面写入裁剪器失败', coverError)
        }
      }

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
          setDuplicateUniqueId(null)
          setData({ ...data, dlsiteCode: e.target.value })
        }}
        isInvalid={!!errors}
        errorMessage={errors}
      />
      <div className="flex items-center gap-2 text-sm">
        {data.dlsiteCode && canUseDlsiteImport && (
          <Button color="primary" size="sm" onPress={handleFetch}>
            获取 DLSite 数据
          </Button>
        )}
        {duplicateUniqueId && (
          <Button
            className="gal-sticker gal-sticker-pink"
            as={Link}
            color="primary"
            target="_blank"
            href={`/${duplicateUniqueId}`}
            variant="flat"
            size="sm"
          >
            跳转到重复游戏
          </Button>
        )}
      </div>

      {preview && (
        <>
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
        </>
      )}
    </div>
  )
}
