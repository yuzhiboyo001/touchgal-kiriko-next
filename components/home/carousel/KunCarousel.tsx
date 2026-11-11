'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { KunDesktopCard } from './DesktopCard'
import { KunMobileCard } from './MobileCard'
import { RandomGalgameButton } from './RandomGalgameButton'
import type { HomeCarouselMetadata } from './mdx'
import type { UserState } from '~/store/userStore'

interface KunCarouselProps {
  posts: readonly HomeCarouselMetadata[]
  initialSession?: UserState | null
}

export const KunCarousel = ({ posts, initialSession }: KunCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState(0)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const post = posts[currentSlide]

  // 页面可见性监听
  useEffect(() => {
    const handleVisibility = () => {
      const visible =
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      setIsPageVisible(visible)
      if (visible) {
        setCurrentSlide((prev) =>
          posts.length > 0
            ? ((prev % posts.length) + posts.length) % posts.length
            : 0
        )
        setDirection(0)
      }
    }
    handleVisibility()
    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [posts.length])

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  const pauseAutoplay = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    setIsPaused(true)
  }

  const scheduleAutoplayResume = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => setIsPaused(false), 5000)
  }

  // 自动轮播：手机触摸后暂停，离开 5 秒后再恢复
  useEffect(() => {
    if (isHovered || isPaused || !isPageVisible || posts.length === 0) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentSlide((prev) =>
        posts.length > 0 ? (prev + 1) % posts.length : 0
      )
    }, 7000)
    return () => clearInterval(timer)
  }, [isHovered, isPaused, isPageVisible, posts.length])

  // 动画变体：柔和淡入，时间拉长
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0.6
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 1
    })
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) =>
    Math.abs(offset) * velocity

  const paginate = (newDirection: number) => {
    if (posts.length === 0) return
    setDirection(newDirection)
    setCurrentSlide(
      (prev) => (prev + newDirection + posts.length) % posts.length
    )
  }

  if (posts.length === 0) {
    return (
      <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-2xl bg-default-50/60 flex items-center justify-center border border-default-200">
        <div className="text-default-500">暂无可展示的置顶文章</div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col">
      {/* 轮播图本体 */}
      <div
        className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/10 group touch-pan-y bg-black/5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={pauseAutoplay}
        onTouchEnd={scheduleAutoplayResume}
      >
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial={direction === 0 ? false : 'enter'}
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'tween', duration: 0.45, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.25 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            dragMomentum={false}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x)
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1)
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1)
              }
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing bg-background"
          >
            {post && (
              <Image
                key={post.banner}
                alt={post.title}
                src={post.banner}
                fill
                sizes="(min-width: 1280px) 616px, (min-width: 640px) 50vw, 100vw"
                priority={currentSlide === 0}
                unoptimized
                className="object-cover brightness-90 sm:brightness-75"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent sm:hidden" />
            <div className="absolute inset-0 hidden bg-linear-to-t from-black/30 via-black/10 to-transparent sm:block" />
            <KunDesktopCard posts={posts} currentSlide={currentSlide} />
            <KunMobileCard posts={posts} currentSlide={currentSlide} />
          </motion.div>
        </AnimatePresence>

        {/* 手机端：左下角小圆点，右下角悬浮随机按钮 */}
        <div className="absolute z-30 bottom-3 inset-x-0 px-4 sm:hidden flex items-center justify-between pointer-events-none">
          <div className="flex gap-1 drop-shadow-md pointer-events-auto">
            {posts.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white w-4'
                    : 'bg-white/50 w-1.5 hover:bg-white/80'
                }`}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1)
                  setCurrentSlide(index)
                }}
                aria-label={`跳转到第 ${index + 1} 张幻灯片`}
              />
            ))}
          </div>

          <div className="pointer-events-auto">
            <RandomGalgameButton
              isIconOnly
              size="sm"
              className="bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 shadow-lg rounded-full"
            />
          </div>
        </div>

        {/* PC端指示器 */}
        <div className="absolute z-20 hidden sm:flex gap-1 -translate-x-1/2 top-72 left-1/2">
          {posts.map((_, index) => (
            <button
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-primary w-4'
                  : 'bg-foreground/20 w-1.5 hover:bg-foreground/40'
              }`}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1)
                setCurrentSlide(index)
              }}
              aria-label={`跳转到第 ${index + 1} 张幻灯片`}
            />
          ))}
        </div>

        {/* PC端左右切换按钮 */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20 hidden sm:block"
          onClick={() => paginate(-1)}
          aria-label="上一张幻灯片"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20 hidden sm:block"
          onClick={() => paginate(1)}
          aria-label="下一张幻灯片"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
