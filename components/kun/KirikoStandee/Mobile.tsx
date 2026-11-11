// components/kun/KirikoStandee/Mobile.tsx

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ShoppingBag, Heart, Trophy, Info } from 'lucide-react'
import { CHARACTER_CONFIGS } from './config'
import { ChatFeature, ShopFeature, ChatLockModal } from '../features'
import { AffectionFeature } from '../features/AffectionFeature'
import { AchievementFeature } from '../features/AchievementFeature'
import { AboutFeature } from './features/AboutFeature'
import { useDialogue } from '../hooks/useDialogue'
import { useKirikoInteraction } from '../hooks/useKirikoInteraction'
import { KirikoBubble } from './KirikoBubble'
import { useKirikoUiStore } from '~/store/kirikoUiStore'
import { useBodyScrollLock } from '~/components/kun/hooks/useBodyScrollLock'

export const KirikoMobile = ({ character = 'rin' }: { character?: string }) => {
  useBodyScrollLock()
  const [mounted, setMounted] = useState(false)
  const [hovered, setHovered] = useState(false)
  const isOpen = useKirikoUiStore((state) => state.isOpen)
  const close = useKirikoUiStore((state) => state.close)

  const cfg = CHARACTER_CONFIGS[character] || CHARACTER_CONFIGS['rin']
  const { showDialogue, dialogueText, showRandomDialogue } = useDialogue(cfg)

  const {
    showShop,
    showChat,
    showAffection,
    chatLock,
    userCoins,
    showAchievement,
    showAbout,
    openAchievement,
    closeAchievement,
    openShop,
    openChat,
    closeChatLock,
    openAffection,
    openAbout,
    closeShop,
    closeChat,
    closeAffection,
    closeAbout,
    handleCoinsUpdate,
    handleMouseEnter,
    handleMouseLeave
  } = useKirikoInteraction({ config: cfg, setHovered })

  const CARD_WIDTH = 280
  const CARD_HEIGHT = 460

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, close])

  const ACTIONS = [
    { id: 'chat', onClick: openChat, icon: MessageCircle, label: '聊天' },
    { id: 'shop', onClick: openShop, icon: ShoppingBag, label: '商店' },
    { id: 'affection', onClick: openAffection, icon: Heart, label: '好感' },
    {
      id: 'achievement',
      onClick: openAchievement,
      icon: Trophy,
      label: '成就'
    },
    { id: 'about', onClick: openAbout, icon: Info, label: '关于' }
  ]

  if (!mounted || !isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[45] touch-none overscroll-none bg-black/45 md:hidden"
        onClick={close}
        aria-hidden="true"
      />

      <div
        className="fixed inset-0 z-[46] flex touch-none items-center justify-center overscroll-none p-4 md:hidden"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(event) => event.stopPropagation()}
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          className={`
            relative rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.04)]
            select-none overflow-hidden flex flex-col
            ${cfg.bgColor} border ${cfg.borderColor}
          `}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* 上半部分：立绘展示区 */}
          <div
            className="relative flex-1 w-full"
            onClick={() => {
              showRandomDialogue()
              handleMouseEnter()
            }}
          >
            {/* 顶栏 */}
            <div className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-3 z-30">
              <h2
                className={`text-xl font-bold ${cfg.nameColor} tracking-widest flex items-center gap-1 drop-shadow-md`}
              >
                {cfg.name}
                <span className="text-[20px] opacity-80">✦</span>
              </h2>

              {/* 呼吸竖线 */}
              <div className="flex gap-2.5 items-center h-5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: ['6px', '17px', '6px'],
                      opacity: [0.3, 1, 0.3],
                      backgroundColor: ['#c084fc', '#f472b6', '#c084fc']
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.15
                    }}
                    className="w-[4px] rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* 气泡 */}
            {showDialogue && (
              <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[90%] z-40 pointer-events-none">
                <KirikoBubble
                  text={dialogueText}
                  scale={0.8}
                  offsetTop={0}
                  offsetRight={0}
                  maxWidth={220}
                  minWidth={100}
                  minHeight={40}
                  textSize={14}
                  textColor="#333"
                  lineHeight={1.5}
                  letterSpacing={0}
                  paddingX={12}
                  paddingY={8}
                  triangleSize={8}
                  triangleOffset={100}
                />
              </div>
            )}

            {/* 立绘 */}
            <div className="absolute inset-0 mt-10 pointer-events-none">
              <Image
                src={cfg.imagePath}
                alt="看板娘"
                fill
                data-no-lightbox="true"
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-contain object-bottom drop-shadow-2xl"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* 下半部分：图标栏 */}
          <div className="relative w-full py-4 px-1 flex items-center justify-around border-t border-white/10 z-30">
            {ACTIONS.map((act) => (
              <button
                key={act.id}
                onClick={(event) => {
                  event.stopPropagation()
                  act.onClick(event)
                }}
                title={act.label}
                className={`
                  flex items-center justify-center w-12 h-12 rounded-full
                  transition-all duration-300 border border-white/20 shadow-lg
                  ${cfg.iconBg} ${cfg.iconHover} hover:scale-110 active:scale-95
                `}
              >
                <act.icon className="w-[20px] h-[20px] text-white drop-shadow-md" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showShop && (
          <ShopFeature
            config={cfg}
            onClose={closeShop}
            initialCoins={userCoins ?? 0}
            onCoinsUpdate={handleCoinsUpdate}
          />
        )}
        {showChat && <ChatFeature config={cfg} onClose={closeChat} scale={1} />}
        {showAffection && (
          <AffectionFeature config={cfg} onClose={closeAffection} />
        )}
        {showAchievement && (
          <AchievementFeature config={cfg} onClose={closeAchievement} />
        )}
        {showAbout && <AboutFeature config={cfg} onClose={closeAbout} />}
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
    </>
  )
}
