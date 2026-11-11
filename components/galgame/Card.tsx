'use client'

import { useState } from 'react'
import { Card, CardBody } from '@heroui/card'
import { Image } from '@heroui/image'
import Link from 'next/link'
import { Eye, Star, StarOff } from 'lucide-react'
import { formatNumber } from '~/utils/formatNumber'
import { cn } from '~/utils/cn'

const CARD_ATTRIBUTE_STYLE_MAP: Record<string, string> = {
  PC: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
  PE: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200',
  中文: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
}

// 卡片外层：呼吸放大 + 粉红微光阴影
const CARD_CLASS_NAME =
  'group flex h-full w-full flex-col overflow-hidden rounded-[20px] sm:rounded-[22px] border-none bg-background shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(236,72,153,0.15)] motion-reduce:transition-none dark:bg-content1 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_12px_40px_rgba(236,72,153,0.1)]'

const IMAGE_LOADED_CLASS_NAME =
  'size-full object-cover duration-500 opacity-100 transition-opacity'
const IMAGE_LOADING_CLASS_NAME =
  'size-full object-cover duration-500 opacity-0 transition-opacity'

// 恢复动态获取标签
const getCardAttributeLabels = (patch: GalgameCard) => {
  const labels: string[] = []
  if (patch.type.includes('pc')) labels.push('PC')
  if (patch.type.includes('mobile')) labels.push('PE')
  if (patch.type.includes('chinese')) labels.push('中文')
  return labels
}

const hasRating = (rating?: number): rating is number =>
  typeof rating === 'number' && rating > 0

const getRatingText = (rating: number) => {
  return Number.isInteger(rating) ? rating.toString() : rating.toFixed(1)
}

interface Props {
  patch: GalgameCard
  openOnNewTab?: boolean
}

export const GalgameCard = ({ patch, openOnNewTab = true }: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const attributeLabels = getCardAttributeLabels(patch)

  // 恢复真实的评分与浏览数据
  const averageRating = patch.averageRating
  const ratingText = hasRating(averageRating)
    ? getRatingText(averageRating)
    : null

  return (
    <Link
      href={`/${patch.uniqueId}`}
      target={openOnNewTab ? '_blank' : '_self'}
      rel={openOnNewTab ? 'noopener noreferrer' : undefined}
      aria-label={`查看 ${patch.name}`}
      className="block h-full rounded-[20px] sm:rounded-[22px]"
    >
      <Card className={CARD_CLASS_NAME}>
        {/* 图片区域：手机端 16/10，PC端 4/2.6（你调的比例） */}
        <div className="relative w-full overflow-hidden bg-default-100 shrink-0">
          <div
            className={cn(
              'absolute inset-0 animate-pulse bg-default-200 aspect-16/10 sm:aspect-[4/2.6]',
              imageLoaded ? 'opacity-0' : 'opacity-100',
              'transition-opacity duration-300'
            )}
          />
          <Image
            radius="none"
            alt={patch.name}
            className={cn(
              imageLoaded ? IMAGE_LOADED_CLASS_NAME : IMAGE_LOADING_CLASS_NAME,
              'aspect-16/10 sm:aspect-[4/2.6]',
              'transition-transform duration-500 ease-out group-hover:scale-105'
            )}
            removeWrapper={true}
            src={
              patch.banner
                ? patch.banner.replace(/\.avif$/, '-mini.avif')
                : '/kiriko.avif'
            }
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        <CardBody className="flex flex-1 flex-col p-2 sm:p-3.5">
          {/* 标题区：占据剩余空间并居中 */}
          <div className="flex flex-1 items-center mb-2">
            <h2 className="text-[13px] sm:text-base font-extrabold leading-snug text-foreground transition-colors line-clamp-2 group-hover:text-primary-500 w-full">
              {patch.name}
            </h2>
          </div>

          {/* 底部数据+标签区：固定两列，PC / 手机保持同一基线 */}
          <div className="mt-auto grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            {/* 左侧：数据 */}
            <div className="flex items-center gap-2 text-[11px] text-default-500 sm:text-sm">
              <div className="flex items-center gap-1">
                {ratingText ? (
                  <Star className="size-3 sm:size-4 fill-warning-400 text-warning-400" />
                ) : (
                  <StarOff className="size-3 sm:size-4 text-default-400" />
                )}
                {ratingText && (
                  <span className="font-bold text-foreground">
                    {ratingText}
                  </span>
                )}
              </div>

              <div className="h-3 w-px bg-default-200" />

              <div className="flex items-center gap-1">
                <Eye className="size-3 sm:size-4" />
                <span>{formatNumber(patch.view)}</span>
              </div>
            </div>

            {/* 右侧：标签 */}
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
              {attributeLabels.map((label) => (
                <span
                  key={label}
                  className={cn(
                    'inline-flex h-4 sm:h-5 px-1 items-center justify-center rounded text-[9px] sm:text-[11px] font-bold leading-none',
                    CARD_ATTRIBUTE_STYLE_MAP[label] ??
                      'bg-default-100 text-default-600 dark:bg-default-100/10 dark:text-default-300'
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
