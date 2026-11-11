'use client'

import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

export const ChatBudgetExhaustedModal = ({ onClose }: Props) => (
  <div
    className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/60 p-4"
    onClick={onClose}
    role="presentation"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-budget-title"
      className="relative w-full max-w-sm rounded-3xl border border-pink-100/80 bg-[#fff9fb] p-6 text-center shadow-xl dark:border-pink-400/15 dark:bg-[#1c1917]"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-default-400 transition-colors hover:bg-pink-100/70 hover:text-pink-600 dark:hover:bg-white/5"
      >
        <X className="size-4" />
      </button>

      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-pink-100 text-2xl dark:bg-pink-500/15">
        💗
      </div>
      <h2
        id="chat-budget-title"
        className="mt-4 text-lg font-semibold text-default-900 dark:text-white"
      >
        本月 AI 额度已用完
      </h2>
      <p className="mt-3 text-sm leading-7 text-default-500">
        本站本月的 AI 免费额度已全部耗尽
      </p>
      <p className="mt-1 text-xs leading-6 text-default-400">
        下个月会自动恢复。感谢理解。
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full rounded-2xl bg-pink-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-600 active:scale-[0.99]"
      >
        我知道了
      </button>
    </div>
  </div>
)
