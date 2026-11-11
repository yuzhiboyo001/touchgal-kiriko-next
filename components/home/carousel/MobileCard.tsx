'use client'

import { Link } from '@heroui/react'
import type { HomeCarouselMetadata } from './mdx'

interface Props {
  posts: readonly HomeCarouselMetadata[]
  currentSlide: number
}

export const KunMobileCard = ({ posts, currentSlide }: Props) => {
  const post = posts[currentSlide]

  if (!post) return null

  return (
    <div className="relative h-full w-full select-none sm:hidden">
      {/* 文字内容区：pb-10 留出底部指示器的空间 */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 pb-10 space-y-1.5">
        <Link
          color="foreground"
          className="text-lg font-bold text-white hover:text-primary-400 line-clamp-2 drop-shadow-md leading-tight"
          href={post.link}
        >
          <h1>{post.title}</h1>
        </Link>

        <p className="text-xs text-white/85 line-clamp-2 drop-shadow-md leading-relaxed">
          {post.description}
        </p>
      </div>
    </div>
  )
}
