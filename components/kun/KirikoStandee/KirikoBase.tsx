// components/kun/KirikoStandee/KirikoBase.tsx

'use client'

import { memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { StandeeConfig } from './types'
import { KirikoBubble } from './KirikoBubble'
import { KirikoHeader } from './components/KirikoHeader'
import { KirikoImage } from './components/KirikoImage'
import { KirikoActionBar } from './components/KirikoActionBar'
import { ShopFeature, ChatFeature, ChatLockModal } from '../features'
import { AffectionFeature } from '../features/AffectionFeature'
import { useDialogue } from '../hooks/useDialogue'
import { useKirikoInteraction } from '../hooks/useKirikoInteraction'
import { useKirikoScale } from '../hooks/useKirikoScale'
import { useHeartEffect } from '../hooks/useHeartEffect'
import { AchievementFeature } from '../features/AchievementFeature'
import { AboutFeature } from '../KirikoStandee/features/AboutFeature'

interface KirikoBaseProps {
  config: StandeeConfig
  isVisible: boolean
  setIsVisible: (v: boolean) => void
  isDragging: boolean
  pos: { x: number; y: number }
  scale: number
  scaledWidth: number
  scaledHeight: number
  hovered: boolean
  setHovered: (v: boolean) => void
  dragRef: React.RefObject<HTMLDivElement | null>
  handleMouseDown: (e: React.MouseEvent) => void
  imageError: boolean
  setImageError: (v: boolean) => void
}

export const KirikoBase = memo(
  ({
    config,
    isVisible,
    setIsVisible,
    isDragging,
    pos,
    scale,
    scaledWidth,
    scaledHeight,
    hovered,
    setHovered,
    dragRef,
    handleMouseDown,
    imageError,
    setImageError
  }: KirikoBaseProps) => {
    const { hearts, triggerHearts } = useHeartEffect()

    const { showDialogue, dialogueText, showRandomDialogue, showShopDialogue } =
      useDialogue(config)

    const {
      showShop,
      showChat,
      showAffection,
      chatLock,
      userCoins,
      showAchievement,
      showAbout, // ✅ 新增
      openAchievement,
      closeAchievement,
      openShop,
      openChat,
      closeChatLock,
      openAffection,
      openAbout, // ✅ 新增
      closeShop,
      closeChat,
      closeAffection,
      closeAbout, // ✅ 新增
      handleCoinsUpdate,
      handleMouseEnter,
      handleMouseLeave
    } = useKirikoInteraction({ config, setHovered })

    const { nameFontSize, starSize, dotSize, bubbleParams } =
      useKirikoScale(scale)

    const currentImagePath =
      showShop && config.shopImagePath ? config.shopImagePath : config.imagePath

    const handleBoxClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      showRandomDialogue()
      triggerHearts(5)
    }

    const handleOpenShop = (e: React.MouseEvent) => {
      openShop(e)
      showShopDialogue()
    }

    if (!isVisible) {
      return (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white/60 text-xs hover:bg-white/20 transition-colors"
            onClick={() => setIsVisible(true)}
          >
            显示看板娘
          </button>
        </div>
      )
    }

    const colorClass = `${config.bgColor} border ${config.borderColor}`

    return (
      <>
        <div
          ref={dragRef}
          className={`fixed z-50 hidden sm:block rounded-2xl ${colorClass} shadow-[0_0_40px_rgba(255,255,255,0.04)] overflow-visible select-none ${
            isDragging ? 'shadow-2xl scale-[1.02]' : ''
          }`}
          style={{
            left: pos.x,
            top: pos.y,
            width: scaledWidth,
            height: scaledHeight,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            willChange: 'transform, left, top'
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleBoxClick}
        >
          {showDialogue && (
            <KirikoBubble text={dialogueText} {...bubbleParams} />
          )}

          <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
            {hearts.map((heart) => (
              <div
                key={heart.id}
                className="absolute text-pink-300/60 animate-float-heart"
                style={
                  {
                    left: `${heart.x}%`,
                    top: `${heart.y}%`,
                    fontSize: `${heart.size}px`,
                    transform: `rotate(${heart.rotation}deg)`,
                    opacity: heart.opacity,
                    animationDuration: `${1.5 / heart.speed}s`,
                    willChange: 'transform, opacity',
                    '--drift-x': `${heart.driftX}px`
                  } as React.CSSProperties
                }
              >
                ❤️
              </div>
            ))}
          </div>

          <KirikoHeader
            name={config.name}
            nameColor={config.nameColor}
            scale={scale}
            nameFontSize={nameFontSize}
            starSize={starSize}
            dotSize={dotSize}
          />

          <KirikoActionBar
            hovered={hovered}
            config={config}
            openShop={handleOpenShop}
            openChat={openChat}
            openAffection={openAffection}
            openAchievement={openAchievement}
            openAbout={openAbout} // ✅ 新增
          />

          <KirikoImage
            imagePath={currentImagePath}
            name={config.name}
            imageError={imageError}
            setImageError={setImageError}
            isShopMode={showShop}
          />
        </div>

        <AnimatePresence>
          {showShop && (
            <ShopFeature
              config={config}
              onClose={closeShop}
              initialCoins={userCoins ?? 0}
              onCoinsUpdate={handleCoinsUpdate}
            />
          )}
          {showChat && (
            <ChatFeature config={config} onClose={closeChat} scale={scale} />
          )}
          {showAffection && (
            <AffectionFeature config={config} onClose={closeAffection} />
          )}
          {showAchievement && (
            <AchievementFeature config={config} onClose={closeAchievement} />
          )}
          {showAbout && ( // ✅ 新增
            <AboutFeature config={config} onClose={closeAbout} />
          )}
        </AnimatePresence>

        {chatLock && (
          <ChatLockModal
            config={chatLock.config}
            affection={chatLock.affection}
            level={chatLock.level}
            onClose={closeChatLock}
            onOpenShop={openShop}
          />
        )}

        <style>{`
          @keyframes floatHeart {
            0% {
              transform: translateY(0) translateX(0) scale(1) rotate(0deg);
              opacity: 1;
            }
            50% {
              transform: translateY(-60px) translateX(var(--drift-x, 0px)) scale(0.7) rotate(20deg);
              opacity: 0.7;
            }
            100% {
              transform: translateY(-120px) translateX(calc(var(--drift-x, 0px) * 0.5)) scale(0.2) rotate(40deg);
              opacity: 0;
            }
          }
          .animate-float-heart {
            animation: floatHeart 1.5s ease-out forwards;
          }
        `}</style>
      </>
    )
  }
)

KirikoBase.displayName = 'KirikoBase'
