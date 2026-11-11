// components/kun/KirikoStandee/index.tsx

'use client'

import { useEffect, useState } from 'react'
import { Rin } from '../characters/Rin'
import { Sayo } from '../characters/Sayo'
import { Shizuka } from '../characters/Shizuka'
import { KirikoMobile } from './Mobile' // ✅ 引入我们刚写好的手机版
import { CharacterSelectModal } from '~/components/kun/KirikoStandee/CharacterSelect'
import { useKirikoProfile } from '~/components/kun/hooks/useKirikoProfile'
import { useUserStore } from '~/store/userStore'
import { useSessionStore } from '~/store/sessionStore'
import { useKirikoUiStore } from '~/store/kirikoUiStore'

interface KirikoStandeeProps {
  character?: 'rin' | 'sayo' | 'shunv'
  position?: 'left' | 'right'
  defaultX?: number
  defaultY?: number
  defaultScale?: number
  minScale?: number
  maxScale?: number
}

export const KirikoStandee = ({
  character = 'shunv',
  position = 'left',
  defaultX,
  defaultY,
  defaultScale,
  minScale,
  maxScale
}: KirikoStandeeProps) => {
  const user = useUserStore((state) => state.user)
  const sessionStatus = useSessionStore((state) => state.status)
  const isLoggedIn =
    user.uid !== 0 &&
    !!user.name &&
    (sessionStatus === 'authenticated' || sessionStatus === 'unavailable')

  // ✅ 新增：监听屏幕尺寸，自适应渲染
  const [isMobile, setIsMobile] = useState(false)

  const {
    hasProfile,
    selectedCharacter,
    showSelectModal,
    isLoading,
    selectCharacter,
    setShowSelectModal
  } = useKirikoProfile(character)
  const setKirikoCharacter = useKirikoUiStore((state) => state.setCharacter)
  const isKirikoOpen = useKirikoUiStore((state) => state.isOpen)

  useEffect(() => {
    if (hasProfile && selectedCharacter) {
      setKirikoCharacter(selectedCharacter as 'rin' | 'sayo' | 'shunv')
    }
  }, [hasProfile, selectedCharacter, setKirikoCharacter])

  // 检查屏幕宽度
  useEffect(() => {
    const checkMobile = () => {
      // md 断点是 768px
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ===== 切换角色时同步更新主题色 =====
  useEffect(() => {
    document.documentElement.classList.remove(
      'theme-rin',
      'theme-sayo',
      'theme-shunv'
    )
    document.documentElement.classList.add(`theme-${selectedCharacter}`)

    return () => {
      document.documentElement.classList.remove(`theme-${selectedCharacter}`)
    }
  }, [selectedCharacter])

  // ===== 未登录 → 不渲染任何内容 =====
  if (!isLoggedIn) return null

  // ===== 加载中 → 不渲染 =====
  if (hasProfile === null) return null

  // ===== 已登录 + 未选角色 → 显示选择弹窗 =====
  if (!hasProfile && showSelectModal) {
    return (
      <CharacterSelectModal
        onSelect={selectCharacter}
        isLoading={isLoading}
        isOpen={true}
        onClose={() => {
          setShowSelectModal(false)
        }}
      />
    )
  }

  // ===== 已登录 + 未选角色 + 弹窗已关闭 → 常驻入口 =====
  if (!hasProfile) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white/60 text-xs hover:bg-white/20 transition-colors"
          onClick={() => setShowSelectModal(true)}
        >
          选择看板娘
        </button>
      </div>
    )
  }

  // 手机端只有打开时才挂载 Mobile；关闭时不要运行聊天/商店等交互 hooks。
  if (isMobile) {
    return isKirikoOpen ? <KirikoMobile character={selectedCharacter} /> : null
  }

  const standeeProps = {
    position,
    defaultX,
    defaultY,
    defaultScale,
    minScale,
    maxScale
  }

  switch (selectedCharacter) {
    case 'rin':
      return <Rin {...standeeProps} />
    case 'sayo':
      return <Sayo {...standeeProps} />
    case 'shunv':
      return <Shizuka {...standeeProps} />
    default:
      return <Rin {...standeeProps} />
  }
}
