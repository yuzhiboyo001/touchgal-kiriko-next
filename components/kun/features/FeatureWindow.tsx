'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useBodyScrollLock } from '~/components/kun/hooks/useBodyScrollLock'
import { cn } from '~/utils/cn'

interface Props {
  title: string
  subtitle?: string
  icon: LucideIcon
  onClose: () => void
  children: ReactNode
  variant?: 'window' | 'fullscreen'
  panelClassName?: string
  bodyClassName?: string
  widthClassName?: string
  maxHeightClassName?: string
}

export const FeatureWindow = ({
  title,
  subtitle,
  icon: Icon,
  onClose,
  children,
  variant = 'window',
  panelClassName,
  bodyClassName,
  widthClassName,
  maxHeightClassName
}: Props) => {
  useBodyScrollLock()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const fullscreen = variant === 'fullscreen'

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex touch-pan-y items-center justify-center overscroll-none bg-zinc-950/65',
        fullscreen ? 'p-0' : 'p-3 sm:p-6'
      )}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-window-title"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'relative flex touch-pan-y flex-col overflow-hidden border bg-[#1c1917] text-white shadow-none',
          fullscreen
            ? 'h-[100dvh] w-full max-w-none rounded-none border-0'
            : cn(
                'max-w-[calc(100vw-24px)] rounded-[22px] border-white/15',
                widthClassName || 'w-[calc(100vw-24px)] sm:w-[560px]',
                maxHeightClassName || 'max-h-[84dvh]'
              ),
          panelClassName
        )}
      >
        <div
          className={cn(
            'relative flex flex-shrink-0 items-center justify-between border-b border-white/10 px-5 py-4',
            fullscreen && 'pt-[max(1rem,env(safe-area-inset-top))] md:pt-4'
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Icon className="size-4.5 text-pink-300" />
            </div>
            <div className="min-w-0">
              <h2
                id="feature-window-title"
                className="truncate text-lg font-semibold tracking-wide"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 truncate text-[11px] text-white/45">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),1rem)]',
            bodyClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
