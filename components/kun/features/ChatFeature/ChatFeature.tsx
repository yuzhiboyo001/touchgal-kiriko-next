// features/ChatFeature/ChatFeature.tsx

'use client'

import { useRef, useEffect, memo, useState, useCallback, useMemo } from 'react'
import { X, Send, Loader2, Settings2, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import type { ChatFeatureProps } from './types'
import { useChatController } from './hooks/useChatController'
import { useUserStore } from '~/store/userStore'
import { MessageBubble } from './components/MessageBubble'
import { SettingsPanel } from './components/SettingsPanel'
import { CHARACTER_CONFIG } from './config'
import { AchievementToast } from '~/components/kun/features/AchievementFeature'
import { ACHIEVEMENTS } from '~/components/kun/features/AchievementFeature/config'
import { completeTask } from '~/components/effects/daily-task/utils/completeTask'
import { useBodyScrollLock } from '~/components/kun/hooks/useBodyScrollLock'
import { ChatBudgetExhaustedModal } from './ChatBudgetExhaustedModal'

export const ChatFeature = memo(({ config, onClose }: ChatFeatureProps) => {
  useBodyScrollLock()
  const character = config.id as 'rin' | 'sayo' | 'shunv'
  const user = useUserStore((state) => state.user)

  const {
    messages,
    isLoading,
    remainingQuota,
    isQuotaExceeded,
    isConnected,
    sendMessage,
    messagesEndRef,
    userLocation,
    setUserLocation,
    chatMode,
    setChatMode,
    dailyLimit,
    isDataLoaded,
    hasMoreHistory,
    isLoadingOlder,
    loadOlder,
    newAchievements,
    clearNewAchievements,
    budgetExhausted,
    dismissBudgetExhausted
  } = useChatController({ character })

  const [showSettings, setShowSettings] = useState(false)
  const [isCustomLocation, setIsCustomLocation] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const userAvatar = user?.avatar
  const userName = user?.name
  const characterAvatar = CHARACTER_CONFIG[character].avatar
  const characterName = CHARACTER_CONFIG[character].name

  const currentAchievement = useMemo(() => {
    if (!newAchievements || newAchievements.length === 0) return null
    return ACHIEVEMENTS.find((a) => a.id === newAchievements[0])
  }, [newAchievements])

  const handleSend = useCallback(async () => {
    if (!isDataLoaded) return
    if (inputRef.current?.value) {
      const message = inputRef.current.value
      inputRef.current.value = ''
      const result = await sendMessage(message)
      const chatDailyCount = result?.chatDailyCount

      if (chatDailyCount != null) {
        // ✅ 当天累计 ≥ 3 → d2；≥ 10 → w3
        if (chatDailyCount >= 3)
          await completeTask('d2', { skipIfCompleted: true })
        if (chatDailyCount >= 10)
          await completeTask('w3', { skipIfCompleted: true })
      }
    }
  }, [isDataLoaded, sendMessage])
  const theme = useMemo(
    () => ({
      bg: config.shopBg || 'bg-slate-900/90',
      border: config.shopBorder || 'border-white/10',
      accent: config.shopAccent || 'bg-pink-500/30 hover:bg-pink-500/50',
      textBright: config.shopText || 'text-white'
    }),
    [config]
  )

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleLocationSelect = useCallback(
    (loc: string) => {
      setUserLocation(loc)
      setIsCustomLocation(false)
      setShowSettings(false)
    },
    [setUserLocation]
  )

  const handleCustomLocationConfirm = useCallback(
    (loc: string) => {
      setUserLocation(loc)
      setIsCustomLocation(true)
      setShowSettings(false)
    },
    [setUserLocation]
  )

  const handleMessagesScroll = useCallback(async () => {
    const container = messagesContainerRef.current
    if (
      !container ||
      container.scrollTop > 80 ||
      !hasMoreHistory ||
      isLoadingOlder ||
      isLoading
    ) {
      return
    }

    const previousScrollHeight = container.scrollHeight
    const previousScrollTop = container.scrollTop
    const loaded = await loadOlder()

    if (loaded > 0) {
      requestAnimationFrame(() => {
        if (!messagesContainerRef.current) return
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight -
          previousScrollHeight +
          previousScrollTop
      })
    }
  }, [hasMoreHistory, isLoadingOlder, isLoading, loadOlder])

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev)
  }, [])

  const closeSettings = useCallback(() => {
    setShowSettings(false)
  }, [])

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      // ① turnNumber 最准（后端轮次号，单调递增）
      if (a.turnNumber != null && b.turnNumber != null) {
        if (a.turnNumber !== b.turnNumber) return a.turnNumber - b.turnNumber
      }
      // ② createdAt 次准（ISO 字符串可直接比）
      if (a.createdAt && b.createdAt) {
        const t = a.createdAt.localeCompare(b.createdAt)
        if (t !== 0) return t
      }
      // ③ fullTime 兜底（已到秒）
      if (a.fullTime && b.fullTime) {
        const t = a.fullTime.localeCompare(b.fullTime)
        if (t !== 0) return t
      }
      return 0
    })
  }, [messages])

  return (
    <>
      {budgetExhausted && (
        <ChatBudgetExhaustedModal onClose={dismissBudgetExhausted} />
      )}

      {currentAchievement && (
        <AchievementToast
          achievement={currentAchievement}
          onComplete={clearNewAchievements}
        />
      )}

      {/* 遮罩：手机端场景面板打开时点击关闭 */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 md:hidden"
          onClick={closeSettings}
        />
      )}

      {/* 外层：手机端铺满屏幕；PC 端居中 */}
      <div className="fixed inset-0 z-[50] flex touch-pan-y overscroll-none md:items-center md:justify-center">
        <div
          className={`relative w-full h-full md:h-auto md:w-[520px] md:max-w-[90vw] md:max-h-[80vh] rounded-none md:rounded-2xl ${theme.bg} border-0 md:border ${theme.border} overflow-hidden flex flex-col shadow-[0_10px_50px_rgba(0,0,0,0.5)] md:ring-1 md:ring-white/10`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ✅ 静态渐变层：替代 blur 的层次感，零 GPU 开销 */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />
          {/* ===== 手机端顶部下拉把手 ===== */}
          <div className="md:hidden flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* ===== 头部 ===== */}
          <div className="flex items-center justify-between px-5 py-4 md:py-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden flex-shrink-0">
                <Image
                  src={characterAvatar}
                  alt={characterName}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${theme.textBright}`}>
                  {characterName}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}
                  >
                    ●
                  </span>
                  <span className="text-xs text-white/80">
                    {isConnected ? '在线' : '离线'}
                  </span>
                  <span className="text-[10px] text-white/30">
                    ｜剩余 {remainingQuota} 次
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ===== 消息列表 ===== */}
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="gal-scrollbar overflow-y-auto p-4 space-y-4 flex-1 min-h-0"
          >
            {isLoadingOlder && (
              <div className="flex justify-center py-2 text-xs text-white/40">
                正在加载更早的聊天记录...
              </div>
            )}
            {sortedMessages.length === 0 ? (
              <div className="text-center text-white/40 text-sm mt-20">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/10 overflow-hidden">
                  <Image
                    src={characterAvatar}
                    alt={characterName}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>
                <p className="text-base font-medium text-white/60">
                  {characterName}
                </p>
                <p className="text-xs mt-1 text-white/30">
                  说点什么，她会回应你（每天 {dailyLimit} 次）
                </p>
              </div>
            ) : (
              sortedMessages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  character={character}
                  userAvatar={userAvatar}
                  userName={userName}
                />
              ))
            )}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full border-2 border-white/10 overflow-hidden flex-shrink-0">
                  <Image
                    src={characterAvatar}
                    alt={characterName}
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                </div>
                <div className="bg-white/10 px-4 py-2.5 rounded-2xl rounded-tl-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ===== 输入区域 ===== */}
          <div className="border-t border-white/10 p-3 relative flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3">
            {/* PC 端：场景面板向上弹出，保持原样 */}
            {showSettings && (
              <div className="hidden md:block">
                <SettingsPanel
                  userLocation={userLocation}
                  chatMode={chatMode}
                  isCustomLocation={isCustomLocation}
                  onLocationSelect={handleLocationSelect}
                  onCustomLocationConfirm={handleCustomLocationConfirm}
                  onChatModeChange={setChatMode}
                  onClose={closeSettings}
                />
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                onKeyDown={handleKeyDown}
                disabled={!isDataLoaded || budgetExhausted}
                placeholder={
                  isDataLoaded
                    ? `在${userLocation}说点什么…（剩余 ${remainingQuota} 次）`
                    : '正在加载对话…'
                }
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-pink-400/50 transition-colors"
              />

              {/* 场景按钮 —— 统一放到发送按钮左侧 */}
              <button
                onClick={toggleSettings}
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white border border-white/10 flex-shrink-0"
                aria-label="场景设置"
              >
                <Settings2 className="w-4 h-4" />
                <ChevronDown
                  className={`w-3 h-3 transition-transform hidden sm:block ${showSettings ? 'rotate-180' : ''}`}
                />
              </button>

              <button
                onClick={handleSend}
                disabled={
                  !isDataLoaded ||
                  isLoading ||
                  isQuotaExceeded ||
                  budgetExhausted
                }
                className={`px-4 py-2.5 rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ${theme.accent}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 手机端：场景面板从底部滑入 */}
      {showSettings && (
        <div className="fixed inset-x-0 bottom-0 z-[60] md:hidden animate-[slideUp_0.25s_ease-out]">
          <SettingsPanel
            variant="mobile"
            userLocation={userLocation}
            chatMode={chatMode}
            isCustomLocation={isCustomLocation}
            onLocationSelect={handleLocationSelect}
            onCustomLocationConfirm={handleCustomLocationConfirm}
            onChatModeChange={setChatMode}
            onClose={closeSettings}
          />
        </div>
      )}
    </>
  )
})

ChatFeature.displayName = 'ChatFeature'
