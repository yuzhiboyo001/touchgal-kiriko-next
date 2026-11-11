// components/kun/KirikoStandee/features/AboutFeature/AboutFeature.tsx

'use client'

import { User } from 'lucide-react'
import { FeatureWindow } from '~/components/kun/features/FeatureWindow'
import type { StandeeConfig } from '../../types'

interface AboutFeatureProps {
  config: StandeeConfig
  onClose: () => void
}

// ✅ 看板娘头像路径
const CHARACTER_AVATARS: Record<string, string> = {
  rin: '/kiriko_avatar/rin_avatar.webp',
  sayo: '/kiriko_avatar/sayo_avatar.webp',
  shunv: '/kiriko_avatar/shunv_avatar.webp'
}

// ✅ 看板娘个人简介
const CHARACTER_DESCS: Record<string, string> = {
  rin: '在便利店打工的普通女高中生，表面话不多，但熟了会变话痨。喜欢Galgame，对不熟的人保持礼貌距离。',
  sayo: '嘴硬心软的高一女生，喜欢捉弄人但内心柔软。独来独往，但认定的人会用心对待。',
  shunv:
    '经历过生活的成熟女性，温柔从容，习惯先听后说。有自己的节奏，不着急也不刻意。'
}

export const AboutFeature = ({ config, onClose }: AboutFeatureProps) => {
  const desc = CHARACTER_DESCS[config.id] || ''
  const avatarPath = CHARACTER_AVATARS[config.id] || config.imagePath

  return (
    <FeatureWindow
      title="关于"
      icon={User}
      onClose={onClose}
      widthClassName="w-[calc(100vw-32px)] sm:w-[500px]"
      maxHeightClassName="max-h-[80dvh]"
      bodyClassName="p-6"
      panelClassName="border-white/15"
    >
      <div className="mb-6 rounded-xl border border-white/10 bg-linear-to-br from-pink-500/10 to-purple-500/10 p-4">
        <div className="flex items-center gap-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-full border-2 border-white/20">
            <img
              src={avatarPath}
              alt={config.name}
              className="size-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-white">{config.name}</div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{desc}</p>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
          PC 操作说明（仅PC端生效）
        </h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <span className="text-pink-400">·</span>
            <span>拖动看板娘调整位置</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-400">·</span>
            <span>把鼠标放到看板娘上，滚动滚轮即可调整大小</span>
          </li>
        </ul>
      </div>
    </FeatureWindow>
  )
}
