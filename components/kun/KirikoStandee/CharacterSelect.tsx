// components/kun/KirikoStandee/CharacterSelect.tsx
'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

const CHARACTERS = [
  {
    id: 'rin',
    name: '神崎 凛',
    nameJp: 'かんざき りん',
    desc: '在便利店打工的普通女高中生，表面话不多，但熟了会变话痨。喜欢Galgame，对不熟的人保持礼貌距离。',
    imagePath: '/kiriko_avatar/rin_avatar.webp',
    accentColor: 'pink-400',
    ringColor: 'ring-pink-400/50',
    borderColor: 'border-pink-400',
    bgHover: 'hover:bg-pink-500/10',
    // ✅ 完整类名，供 Tailwind JIT 扫描
    shadowHover: 'hover:shadow-pink-400/10',
    textAccent: 'text-pink-400'
  },
  {
    id: 'sayo',
    name: '星野 小夜',
    nameJp: 'ほしの さよ',
    desc: '嘴硬心软的小女孩，喜欢捉弄人但内心柔软。独来独往，但认定的人会用心对待。',
    imagePath: '/kiriko_avatar/sayo_avatar.webp',
    accentColor: 'purple-400',
    ringColor: 'ring-purple-400/50',
    borderColor: 'border-purple-400',
    bgHover: 'hover:bg-purple-500/10',
    shadowHover: 'hover:shadow-purple-400/10',
    textAccent: 'text-purple-400'
  },
  {
    id: 'shunv',
    name: '月城 静香',
    nameJp: 'つきしろ しずか',
    desc: '经历过生活的成熟女性，温柔从容，习惯先听后说。有自己的节奏，不着急也不刻意。',
    imagePath: '/kiriko_avatar/shunv_avatar.webp',
    accentColor: 'amber-400',
    ringColor: 'ring-amber-400/50',
    borderColor: 'border-amber-400',
    bgHover: 'hover:bg-amber-500/10',
    shadowHover: 'hover:shadow-amber-400/10',
    textAccent: 'text-amber-400'
  }
] as const
interface CharacterSelectModalProps {
  onSelect: (characterId: string) => void
  isLoading?: boolean
  isOpen: boolean
  onClose?: () => void
}

export const CharacterSelectModal = ({
  onSelect,
  isLoading = false,
  isOpen,
  onClose
}: CharacterSelectModalProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = useCallback(
    (id: string) => {
      if (isLoading) return
      setSelectedId(id)
    },
    [isLoading]
  )

  const handleConfirm = useCallback(() => {
    if (selectedId && !isLoading) {
      onSelect(selectedId)
    }
  }, [selectedId, isLoading, onSelect])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-6">
      <div className="absolute inset-0 bg-black/50" />

      {/* ✅ Modal 内容区：flex-col + overflow-hidden，卡片区滚动，按钮区固定 */}
      <div className="relative w-full max-w-6xl h-[90vh] sm:h-auto sm:max-h-[95vh] bg-background rounded-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* 标题区：固定 */}
        <div className="text-center p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground/90 tracking-wide">
            选择你的看板娘
          </h1>
          <p className="text-xs sm:text-sm text-foreground/40 mt-1">
            选一个你喜欢的角色，她将陪伴你度过每一天
          </p>
        </div>

        {/* 卡片区：可滚动 */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-10 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pb-4">
            {CHARACTERS.map((char) => {
              const isSelected = selectedId === char.id

              return (
                <div
                  key={char.id}
                  className={`
                    relative cursor-pointer rounded-xl overflow-hidden border
                    transition-all duration-200 ease-out
                    hover:scale-[1.05] hover:shadow-lg ${char.shadowHover}
                    ${char.bgHover}
                    ${
                      isSelected
                        ? `${char.borderColor} ring-2 ${char.ringColor}`
                        : 'border-white/10 hover:border-white/30'
                    }
                    bg-white/5
                  `}
                  onClick={() => handleSelect(char.id)}
                >
                  {/* 手机：2/2（方形），PC：3/4 */}
                  <div className="relative aspect-[2/2] sm:aspect-[2/2] overflow-hidden bg-foreground/5">
                    <Image
                      src={char.imagePath}
                      alt={char.name}
                      fill
                      data-no-lightbox="true"
                      className="cursor-default select-none object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      priority
                      quality={75}
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
                  </div>

                  <div className="relative p-2.5 sm:p-3 space-y-1">
                    <div className="flex items-start justify-between">
                      <h3
                        className={`text-sm sm:text-base font-bold ${
                          isSelected ? char.textAccent : 'text-foreground/90'
                        }`}
                      >
                        {char.name}
                      </h3>
                    </div>

                    <div
                      className="relative max-h-[40px] sm:max-h-[60px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                      style={{
                        scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                        scrollbarWidth: 'thin'
                      }}
                    >
                      <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed line-clamp-2 sm:line-clamp-none">
                        {char.desc}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ✅ 底部按钮区：固定，始终可见 */}
        <div className="flex-shrink-0 border-t border-white/10 bg-background/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-center">
            <button
              onClick={handleConfirm}
              disabled={!selectedId || isLoading}
              className={`
                w-full sm:w-auto px-6 sm:px-8 py-2.5 rounded-xl font-medium transition-all duration-200
                ${
                  selectedId && !isLoading
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-white/[0.08] text-foreground/40 border border-white/10 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? '处理中...' : '✨ 选择她'}
            </button>
          </div>
          <p className="text-center mt-2 text-[10px] sm:text-xs text-foreground/20">
            选择后不可更改，请慎重选择
          </p>
        </div>
      </div>
    </div>
  )
}
