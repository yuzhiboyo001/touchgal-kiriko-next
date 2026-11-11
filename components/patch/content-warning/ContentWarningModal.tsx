'use client'

import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  patchId: number
  enabled: boolean
}

const STORAGE_VERSION = 'v1'

const storageKey = (patchId: number) =>
  `kiriko:content-warning:${patchId}:${STORAGE_VERSION}`

export const ContentWarningModal = ({ patchId, enabled }: Props) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!enabled) {
        setOpen(false)
        return
      }

      try {
        setOpen(localStorage.getItem(storageKey(patchId)) !== '1')
      } catch {
        // 隐私模式下 localStorage 可能不可用；至少本次仍然提示。
        setOpen(true)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [enabled, patchId])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  const handleContinue = () => {
    try {
      localStorage.setItem(storageKey(patchId), '1')
    } catch {
      // 存不进去就只关闭本次弹窗，不阻塞阅读。
    }
    setOpen(false)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    // 手机端：全屏遮罩 + 居中；PC(sm 及以上)：遮罩不再铺满整屏，只包住卡片本身
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[5px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-warning-title"
      aria-describedby="content-warning-description"
    >
      <div
        className="relative w-full max-w-107.5 overflow-hidden rounded-3xl border border-pink-500/20 bg-content1/95 p-6 text-foreground shadow-[0_24px_80px_rgba(236,72,153,0.18)] backdrop-blur-xl sm:p-7"
        style={{ maxWidth: 430 }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-pink-500/60 via-rose-400/40 to-purple-500/60" />
        <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-pink-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 size-36 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10 text-pink-400">
            <Sparkles className="size-6" />
          </div>
          <div className="space-y-1">
            <span className="inline-flex w-fit items-center rounded-full border border-pink-500/20 bg-pink-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-pink-400">
              Content Notice
            </span>
            <h2
              id="content-warning-title"
              className="text-xl ml-2 font-semibold"
            >
              小提醒 ~
            </h2>
          </div>
        </div>

        <p
          id="content-warning-description"
          className="mt-5 text-sm leading-7 text-default-600"
        >
          本作品包含可能引起不适的内容，部分题材或描写较为强烈。
          请确认继续浏览。
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="flat"
            color="default"
            size="sm"
            className="gal-sticker"
            onPress={handleBack}
          >
            返回
          </Button>
          <Button
            color="primary"
            size="sm"
            className="gal-sticker gal-sticker-pink"
            autoFocus
            onPress={handleContinue}
          >
            继续浏览
          </Button>
        </div>
      </div>
    </div>
  )
}
