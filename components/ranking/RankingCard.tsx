// components/ranking/RankingCard.tsx

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Building2, Calendar, Download, Package } from 'lucide-react'

interface RankingCardProps {
  id: number
  rank: number
  title: string
  titleCn?: string
  company: string
  releaseDate: string
  reviewCount: string
  dlCount: string
  cover: string
  tags: string[]
  workUrl?: string
  patchUniqueId?: string | null
}

export const RankingCard = ({
  id,
  rank,
  title,
  titleCn,
  company,
  releaseDate,
  reviewCount,
  dlCount,
  cover,
  tags,
  workUrl,
  patchUniqueId
}: RankingCardProps) => {
  const isTop3 = rank <= 3
  const rankColors = {
    1: 'from-amber-400 to-yellow-500 text-white',
    2: 'from-slate-300 to-slate-400 text-white',
    3: 'from-orange-400 to-amber-500 text-white'
  } as const
  const rankColor = isTop3
    ? rankColors[rank as 1 | 2 | 3]
    : 'from-pink-400/20 to-purple-400/20 text-pink-400'

  const href = patchUniqueId
    ? `/${patchUniqueId}`
    : workUrl
      ? `/redirect?url=${encodeURIComponent(workUrl)}`
      : '#'

  const isExternal = !patchUniqueId && !!workUrl

  return (
    <Link
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="
  group flex flex-col md:flex-row gap-3 md:gap-6 p-4 md:p-5 rounded-2xl
  bg-white/5 border border-pink-400/30
  shadow-[0_0_0_1px_rgba(244,114,182,0.08)]
  hover:bg-white/10
  hover:scale-[1.01] hover:-translate-y-0.5
  hover:shadow-[0_8px_30px_rgba(244,114,182,0.15)]
  transition-all duration-300 relative
  will-change-transform
"
    >
      {/* ================= 电脑端：站内标记在右上 ================= */}
      {patchUniqueId && (
        <div
          className="hidden md:flex absolute top-3 right-3 items-center gap-1 px-2.5 py-1 rounded-full
                  bg-green-400/15 text-green-400 text-xs font-medium
                  border border-green-400/30 z-10"
        >
          <Package className="w-3 h-3" />
          站内
        </div>
      )}

      {/* ================= 手机端：左右排版 ================= */}
      <div className="flex md:hidden gap-3 flex-1 min-w-0">
        {/* 左侧：排名 + 封面 */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div
            className={`
              w-10 h-10 rounded-xl bg-linear-to-br ${rankColor}
              flex items-center justify-center font-bold text-lg shadow-lg
            `}
          >
            {rank}
          </div>
          <div className="relative rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/10 w-22.5 h-30">
            {cover ? (
              <Image
                src={cover}
                alt={title}
                fill
                className="object-cover"
                sizes="90px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-default-400">
                无图
              </div>
            )}
          </div>
        </div>

        {/* 右侧：文字信息 + 全部标签 */}
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground line-clamp-2 leading-snug">
            {title}
          </h3>
          {titleCn && (
            <p className="text-xs text-default-500 line-clamp-2 mt-1">
              {titleCn}
            </p>
          )}
          <div className="flex flex-col gap-1 text-xs text-default-400 mt-2">
            {company && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{company}</span>
              </div>
            )}
            {releaseDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{releaseDate}</span>
              </div>
            )}
          </div>

          {/* ✅ 标签全放进来，去掉 slice(0, 3)，用 flex-wrap 自然换行 */}
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded-md text-[10px] bg-pink-400/10 text-pink-400 border border-pink-400/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= 手机端：底部数据横线 ================= */}
      <div className="flex md:hidden items-center justify-between border-t border-white/10 pt-2 mt-1">
        {/* 左侧：售出和评论 */}
        <div className="flex items-center gap-4">
          {dlCount && (
            <div className="flex items-center gap-1 text-pink-400">
              <Download className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{dlCount}</span>
              <span className="text-[10px] text-default-500">售出</span>
            </div>
          )}
          {reviewCount && (
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-bold">{reviewCount}</span>
              <span className="text-[10px] text-default-500">评论</span>
            </div>
          )}
        </div>

        {/* 右侧：站内标签 */}
        {patchUniqueId && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-400/15 text-green-400 text-[10px] font-medium border border-green-400/30">
            <Package className="w-3 h-3" />
            站内
          </div>
        )}
      </div>

      {/* ================= PC端：原封不动的横向大排版 ================= */}
      <div className="hidden md:flex w-full gap-6">
        <div className="shrink-0 flex items-center">
          <div
            className={`
              w-14 h-14 rounded-2xl bg-linear-to-br ${rankColor}
              flex items-center justify-center font-bold text-2xl shadow-lg
              ${isTop3 ? 'scale-110' : ''}
            `}
          >
            {rank}
          </div>
        </div>

        <div
          className="relative rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10"
          style={{ width: '240px', height: '180px' }}
        >
          {cover ? (
            <Image
              src={cover}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="240px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-default-400">
              无图
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-snug">
              {title}
            </h3>
            {titleCn && (
              <p className="text-base text-default-500 line-clamp-1 mt-1">
                {titleCn}
              </p>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-default-400 mt-3 flex-wrap">
            {company && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span className="truncate max-w-50">{company}</span>
              </div>
            )}
            {releaseDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{releaseDate}</span>
              </div>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs bg-pink-400/10 text-pink-400 border border-pink-400/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end justify-center gap-4 pr-2">
          {dlCount && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-pink-400">
                <Download className="w-5 h-5" />
                <span className="text-2xl font-bold">{dlCount}</span>
              </div>
              <span className="text-xs text-default-400 mt-0.5">售出</span>
            </div>
          )}
          {reviewCount && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-base font-semibold">{reviewCount}</span>
              </div>
              <span className="text-xs text-default-400 mt-0.5">评论</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
