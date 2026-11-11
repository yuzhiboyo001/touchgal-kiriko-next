// components/kun/KirikoStandee/components/KirikoActionBar.tsx

'use client'

import { memo } from 'react'
import { KirikoButton } from '../KirikoButton'
import { FUNC_ICONS } from '../config'
import type { StandeeConfig } from '../types'

interface KirikoActionBarProps {
  hovered: boolean
  config: StandeeConfig
  openShop: (e: React.MouseEvent) => void
  openChat: (e: React.MouseEvent) => void
  openAffection: (e: React.MouseEvent) => void
  openAchievement: (e: React.MouseEvent) => void
  openAbout: (e: React.MouseEvent) => void // ✅ 新增
}

export const KirikoActionBar = memo(
  ({
    hovered,
    config,
    openShop,
    openChat,
    openAffection,
    openAchievement,
    openAbout // ✅ 新增
  }: KirikoActionBarProps) => {
    const handleButtonClick = (itemId: string) => (e: React.MouseEvent) => {
      switch (itemId) {
        case 'chat':
          openChat(e)
          break
        case 'shop':
          openShop(e)
          break
        case 'affection':
          openAffection(e)
          break
        case 'achievement':
          openAchievement(e)
          break
        case 'about': // ✅ 替换 settings
          openAbout(e)
          break
        default:
          break
      }
    }

    return (
      <div className="absolute top-12 right-4 flex flex-col gap-2 z-30">
        {FUNC_ICONS.map((item, index) => (
          <KirikoButton
            key={item.id}
            item={item}
            index={index}
            hovered={hovered}
            iconBg={config.iconBg}
            iconHover={config.iconHover}
            onClick={handleButtonClick(item.id)}
          />
        ))}
      </div>
    )
  }
)

KirikoActionBar.displayName = 'KirikoActionBar'
