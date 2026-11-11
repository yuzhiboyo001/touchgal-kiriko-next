'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { ArrowRight, Heart, LockKeyhole, ShoppingBag, X } from 'lucide-react'
import {
  CHAT_UNLOCK_AFFECTION,
  getLevelLabel
} from '~/components/kun/KirikoStandee/affection/constants'
import type { StandeeConfig } from '~/components/kun/KirikoStandee/types'

const AVATARS: Record<string, string> = {
  rin: '/kiriko_avatar/rin_avatar.webp',
  sayo: '/kiriko_avatar/sayo_avatar.webp',
  shunv: '/kiriko_avatar/shunv_avatar.webp'
}

interface Props {
  config: StandeeConfig
  affection: number
  level: number
  onClose: () => void
  onOpenShop: () => void
}

export const ChatLockModal = ({
  config,
  affection,
  level,
  onClose,
  onOpenShop
}: Props) => {
  const remaining = Math.max(0, CHAT_UNLOCK_AFFECTION - affection)
  const progress = Math.min(100, (affection / CHAT_UNLOCK_AFFECTION) * 100)
  const avatar = AVATARS[config.id] || AVATARS.rin

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const openDailyTask = () => {
    onClose()
    window.dispatchEvent(new CustomEvent('kun:open-daily-task'))
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/60 px-0 pb-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-lock-title"
        className="relative w-full max-w-md overflow-hidden rounded-t-[28px] border border-pink-100/80 bg-[#fff9fb] shadow-none dark:border-pink-400/15 dark:bg-[#1c1917] sm:rounded-[26px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="关闭"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-default-400 transition-colors hover:bg-pink-100/70 hover:text-pink-600 dark:hover:bg-white/5 dark:hover:text-pink-300"
        >
          <X className="size-4" />
        </button>

        <div className="relative px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-7 sm:px-7 sm:pb-7">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-pink-300/70 bg-pink-50 dark:border-pink-400/30 dark:bg-pink-950/30">
              <Image
                src={avatar}
                alt={config.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-pink-500 dark:text-pink-300">
                <LockKeyhole className="size-3" />
                CHAT LOCKED
              </p>
              <h2
                id="chat-lock-title"
                className="text-lg font-semibold text-default-900 dark:text-white"
              >
                聊天功能待解锁
              </h2>
              <p className="mt-1 text-xs text-default-500">
                那个...好像我们还不是很熟
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-pink-100/80 bg-pink-50/60 p-4 dark:border-pink-400/10 dark:bg-pink-400/5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-xs text-default-500">
                <Heart className="size-3.5 text-pink-400" />
                好感度
              </span>
              <span className="text-xs font-medium text-pink-600 dark:text-pink-300">
                Lv.{level} {getLevelLabel(level)}
              </span>
            </div>

            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-pink-100 dark:bg-pink-950/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-default-400">
                {affection} / {CHAT_UNLOCK_AFFECTION}
              </span>
              <span className="text-pink-500 dark:text-pink-300">
                还差 {remaining}
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-6 text-default-500">
            完成每日任务，或者去商店送她礼物。
            <br />
            好感度达到 Lv.3 后，就可以和 {config.name} 聊天了。
          </p>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={openDailyTask}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-600 active:scale-[0.99]"
            >
              去完成每日任务
              <ArrowRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenShop()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-pink-200/80 bg-white/70 px-4 py-3 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-50 active:scale-[0.99] dark:border-pink-400/15 dark:bg-white/5 dark:text-pink-200 dark:hover:bg-white/10"
            >
              <ShoppingBag className="size-4" />
              去商店看看
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs text-default-400 transition-colors hover:text-default-600 dark:hover:text-default-300"
            >
              下次再说
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
