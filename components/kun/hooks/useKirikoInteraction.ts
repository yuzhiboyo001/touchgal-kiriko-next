// components/kun/hooks/useKirikoInteraction.ts

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useUserStore } from '~/store/userStore'
import type { KirikoSnapshot } from '~/components/kun/KirikoStandee/actions'
import {
  loadKirikoSnapshot,
  updateCachedKirikoCoins
} from '~/components/kun/hooks/kirikoSnapshot'
import { CHAT_UNLOCK_LEVEL } from '~/components/kun/KirikoStandee/affection/constants'

const HOVER_DELAY = 100

interface UseKirikoInteractionProps {
  config: any
  setHovered: (v: boolean) => void
}

export const useKirikoInteraction = ({
  config,
  setHovered
}: UseKirikoInteractionProps) => {
  const [showShop, setShowShop] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showAffection, setShowAffection] = useState(false)
  const [showAchievement, setShowAchievement] = useState(false)
  const [showAbout, setShowAbout] = useState(false) // ✅ 新增
  const uid = useUserStore((state) => state.user.uid)
  const [chatLock, setChatLock] = useState<{
    affection: number
    level: number
    config: any
  } | null>(null)
  const [userCoins, setUserCoins] = useState<number | null>(null)

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const snapshotRef = useRef<KirikoSnapshot | null>(null)
  const chatRequestRef = useRef(0)

  const applySnapshot = useCallback((next: KirikoSnapshot | null) => {
    if (!next) return
    snapshotRef.current = next
    setUserCoins(next.coins)
  }, [])

  // 看板娘只查一次：金币 / 好感度 / 等级 / 角色权限
  useEffect(() => {
    let active = true
    loadKirikoSnapshot(uid)
      .then((next) => {
        if (active && next) applySnapshot(next)
      })
      .catch(() => {
        // 失败时保持 null，点击聊天会走一次兜底查询
      })
    return () => {
      active = false
    }
  }, [applySnapshot, uid])

  // 悬停处理
  const handleMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHovered(true)
  }, [setHovered])

  const handleMouseLeave = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setHovered(false)
      hoverTimerRef.current = null
    }, HOVER_DELAY)
  }, [setHovered])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  // 弹窗控制
  const openShop = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setShowShop(true)
  }, [])

  const openChat = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      const requestId = ++chatRequestRef.current

      try {
        // 优先用挂载时缓存的快照，点击后立即判断
        const current = snapshotRef.current ?? (await loadKirikoSnapshot(uid))
        if (!current || requestId !== chatRequestRef.current) {
          return
        }
        applySnapshot(current)

        if (current.role >= 3 || current.level >= CHAT_UNLOCK_LEVEL) {
          setShowChat(true)
          return
        }

        setChatLock({
          affection: current.affection,
          level: current.level,
          config
        })

        // 后台刷新一次，避免刚做完任务但快照还旧
        loadKirikoSnapshot(uid, true)
          .then((next) => {
            if (!next || requestId !== chatRequestRef.current) return
            applySnapshot(next)
            if (next.role >= 3 || next.level >= CHAT_UNLOCK_LEVEL) {
              setChatLock(null)
              setShowChat(true)
              return
            }

            setChatLock((prev) =>
              prev
                ? {
                    ...prev,
                    affection: next.affection,
                    level: next.level
                  }
                : prev
            )
          })
          .catch(() => undefined)
      } catch {
        // 网络异常时不要误开聊天；下一次点击会重新确认
        setChatLock({
          affection: 0,
          level: 1,
          config
        })
      }
    },
    [applySnapshot, config, uid]
  )

  const closeChatLock = useCallback(() => {
    chatRequestRef.current++
    setChatLock(null)
  }, [])

  const openAffection = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowAffection(true)
  }, [])

  const openAchievement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowAchievement(true)
  }, [])

  const openAbout = useCallback((e: React.MouseEvent) => {
    // ✅ 新增
    e.stopPropagation()
    setShowAbout(true)
  }, [])

  const closeAchievement = useCallback(() => setShowAchievement(false), [])
  const closeShop = useCallback(() => setShowShop(false), [])
  const closeChat = useCallback(() => setShowChat(false), [])
  const closeAffection = useCallback(() => setShowAffection(false), [])
  const closeAbout = useCallback(() => setShowAbout(false), []) // ✅ 新增

  const handleCoinsUpdate = useCallback(
    (newCoins: number) => {
      setUserCoins(newCoins)
      updateCachedKirikoCoins(uid, newCoins)
      if (snapshotRef.current) {
        snapshotRef.current = {
          ...snapshotRef.current,
          coins: newCoins
        }
      }
    },
    [uid]
  )

  return {
    showShop,
    showChat,
    showAffection,
    chatLock,
    userCoins,
    openShop,
    openChat,
    closeChatLock,
    openAffection,
    closeShop,
    closeChat,
    closeAffection,
    handleCoinsUpdate,
    handleMouseEnter,
    handleMouseLeave,
    showAchievement,
    openAchievement,
    closeAchievement,
    // ✅ 新增
    showAbout,
    openAbout,
    closeAbout
  }
}
