'use client'

import { Snippet } from '@heroui/snippet'
import { Chip } from '@heroui/chip'
import { Database, Link as LinkIcon, Cloud, HardDrive } from 'lucide-react'
import {
  getPanName,
  RESOURCE_HEALTH_STATUS_COLOR,
  RESOURCE_HEALTH_STATUS_MAP
} from '~/constants/resource'
import { kunFetchPut } from '~/utils/kunFetch'
import { KunExternalLink } from '~/components/kun/external-link/ExternalLink'
import type { PatchResource, PatchResourceLink } from '~/types/api/patch'

interface Props {
  resource: PatchResource
  link: PatchResourceLink
}

export const ResourceDownloadCard = ({ resource, link }: Props) => {
  const isDead =
    resource.isOfficial &&
    (link.healthStatus === 'dead' || link.healthStatus === 'expired')

  const handleClickDownload = async () => {
    if (isDead) return

    await kunFetchPut<KunResponse<{}>>('/patch/resource/download', {
      patchId: resource.patchId,
      resourceId: resource.id,
      linkId: link.id
    })
  }

  // 动态获取网盘名称（百度网盘、夸克网盘等）
  const panName = getPanName(link.content)

  // 根据网盘名字简单给个图标，不用像以前那样写死
  const getIcon = () => {
    if (
      panName.includes('百度') ||
      panName.includes('夸克') ||
      panName.includes('UC')
    ) {
      return <Cloud className="size-4" />
    }
    if (panName.includes('云') || panName.includes('盘')) {
      return <HardDrive className="size-4" />
    }
    return <LinkIcon className="size-4" />
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-2">
        <Chip color="secondary" variant="flat" startContent={getIcon()}>
          {panName}
        </Chip>
        {link.size && (
          <Chip variant="flat" startContent={<Database className="w-4 h-4" />}>
            {link.size}
          </Chip>
        )}
        {resource.isOfficial && link.healthStatus !== 'active' && (
          <Chip
            variant="flat"
            color={RESOURCE_HEALTH_STATUS_COLOR[link.healthStatus]}
          >
            {RESOURCE_HEALTH_STATUS_MAP[link.healthStatus]}
          </Chip>
        )}
      </div>

      <p className="text-sm text-default-500">
        {isDead
          ? '该下载链接已失效，官方正在补链中ing~'
          : '点击下面的链接前往网盘下载'}
      </p>

      <div className="space-y-2">
        <KunExternalLink
          className="break-all"
          onPress={handleClickDownload}
          isRequireRedirect
          underline="always"
          link={link.content}
          isDisabled={isDead}
        >
          {link.content}
        </KunExternalLink>

        <div className="flex flex-wrap gap-2">
          {link.code && (
            <Snippet
              tooltipProps={{
                content: '点击复制提取码'
              }}
              size="sm"
              symbol="提取码"
              color="primary"
              className="pl-5 py-1  gal-sticker-pink"
            >
              {link.code}
            </Snippet>
          )}

          {link.password && (
            <Snippet
              tooltipProps={{
                content: '点击复制解压码'
              }}
              size="sm"
              symbol="解压码"
              color="primary"
              className="py-0"
            >
              {link.password}
            </Snippet>
          )}
        </div>
      </div>
    </div>
  )
}
