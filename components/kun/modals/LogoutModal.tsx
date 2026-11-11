// components/kun/modals/LogoutModal.tsx

'use client'

import { Button } from '@heroui/button'
import { LogOut, X } from 'lucide-react'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
  userName?: string
}

export const LogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  userName
}: LogoutModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 ">
      <div className="relative bg-linear-to-br from-pink-500/10 via-purple-500/10 to-rose-500/10 border border-white/20 rounded-2xl px-12 py-10 shadow-2xl shadow-rose-500/20 min-w-110 max-w-[90vw]">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 图标 */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-pink-400/30 to-rose-400/30 flex items-center justify-center border border-white/15">
            <LogOut className="w-10 h-10 text-pink-400" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-center text-2xl font-bold text-white font-ja-maru tracking-wider">
          本当に離れますか？
          <span className="block text-sm font-normal text-white/50 mt-1">
            您确定要离开吗？
          </span>
        </h2>

        {/* 用户名 */}
        {userName && (
          <p className="text-center text-white/70 text-sm mt-3 font-ja">
            「{userName}」さん、また会いましょう
          </p>
        )}

        {/* 装饰分隔线 */}
        <div className="flex items-center justify-center gap-3 my-6">
          <div className="h-px w-12 bg-linear-to-r from-transparent to-white/20" />
          <span className="text-white/30 text-xs font-ja-maru tracking-widest">
            ✦ 絆 ✦
          </span>
          <div className="h-px w-12 bg-linear-to-l from-transparent to-white/20" />
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <Button
            variant="bordered"
            className="flex-1 border-white/20 text-white/70 hover:bg-white/10 rounded-xl py-6 h-auto"
            onPress={onClose}
            isDisabled={isLoading}
          >
            いいえ
            <span className="text-white/30 text-xs ml-1">(留下)</span>
          </Button>
          <Button
            color="danger"
            className="flex-1 bg-linear-to-r from-pink-500/80 to-rose-500/80 hover:from-pink-500 hover:to-rose-500 text-white border-none rounded-xl py-6 h-auto shadow-lg shadow-rose-500/20"
            onPress={onConfirm}
            isLoading={isLoading}
          >
            はい
            <span className="text-white/70 text-xs ml-1">(离开)</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
