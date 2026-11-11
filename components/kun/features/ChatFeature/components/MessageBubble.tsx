// features/ChatFeature/components/MessageBubble.tsx

import { memo, useMemo } from 'react'
import { Avatar as HeroAvatar } from '@heroui/avatar'
import { formatMessageTime, getMessageFullTime } from '../utils/chatUtils'
import { CHARACTER_CONFIG } from '../config'

interface MessageBubbleProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    time?: string
    fullTime?: string
  }
  character: 'rin' | 'sayo' | 'shunv'
  userAvatar?: string
  userName?: string
}

// ✅ 提到组件外部（稳定引用）
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}

// ✅ 提到组件外部
const AVATAR_IMG_PROPS = {
  loading: 'lazy' as const,
  decoding: 'async' as const,
  onError: handleImageError
}

export const MessageBubble = memo(
  ({ message, character, userAvatar, userName }: MessageBubbleProps) => {
    const { displayTime, fullTimeDisplay, isUser, avatarSrc, avatarAlt } =
      useMemo(() => {
        const isUser = message.role === 'user'
        const displayTime = formatMessageTime(message.fullTime)
        const fullTimeDisplay = getMessageFullTime(message.fullTime)
        const avatarSrc = isUser
          ? userAvatar
          : CHARACTER_CONFIG[character].avatar
        const avatarAlt = isUser
          ? userName || '你'
          : CHARACTER_CONFIG[character].name

        return { displayTime, fullTimeDisplay, isUser, avatarSrc, avatarAlt }
      }, [
        message.content,
        message.fullTime,
        message.role,
        character,
        userAvatar,
        userName
      ])

    return (
      <div
        className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      >
        <HeroAvatar
          src={avatarSrc}
          name={avatarAlt}
          size="sm"
          className="border-2 border-white/10 shrink-0"
          showFallback
          imgProps={AVATAR_IMG_PROPS}
        />
        <div
          className={`max-w-[70%] ${isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}
        >
          <div
            className={`px-4 py-2.5 rounded-2xl ${isUser ? 'bg-pink-500/20 text-white rounded-tr-sm' : 'bg-white/10 text-white/90 rounded-tl-sm'}`}
          >
            {message.content}
          </div>
          <span
            className={`text-[10px] text-white/30 mt-1 ${isUser ? 'mr-1' : 'ml-1'}`}
            title={fullTimeDisplay}
          >
            {message.fullTime ? message.fullTime.slice(5, 16) : displayTime}
          </span>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.fullTime === nextProps.message.fullTime &&
      prevProps.message.time === nextProps.message.time &&
      prevProps.message.role === nextProps.message.role &&
      prevProps.character === nextProps.character &&
      prevProps.userAvatar === nextProps.userAvatar &&
      prevProps.userName === nextProps.userName
    )
  }
)

MessageBubble.displayName = 'MessageBubble'
