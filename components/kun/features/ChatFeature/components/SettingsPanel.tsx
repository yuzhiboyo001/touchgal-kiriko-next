// features/ChatFeature/components/SettingsPanel.tsx

import { memo, useState, useCallback } from 'react'
import { X, Smartphone, Users } from 'lucide-react'
import { PRESET_LOCATIONS } from '../config'

interface SettingsPanelProps {
  userLocation: string
  chatMode: 'online' | 'offline'
  isCustomLocation: boolean
  onLocationSelect: (location: string) => void
  onCustomLocationConfirm: (location: string) => void
  onChatModeChange: (mode: 'online' | 'offline') => void
  onClose: () => void
  /** 'pc' 向上弹出（默认）；'mobile' 底部全宽面板 */
  variant?: 'pc' | 'mobile'
}

export const SettingsPanel = memo(function SettingsPanel({
  userLocation,
  chatMode,
  isCustomLocation,
  onLocationSelect,
  onCustomLocationConfirm,
  onChatModeChange,
  onClose,
  variant = 'pc'
}: SettingsPanelProps) {
  const [customLocation, setCustomLocation] = useState('')
  const isMobile = variant === 'mobile'

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && customLocation.trim()) {
        onCustomLocationConfirm(customLocation.trim())
        setCustomLocation('')
      }
    },
    [customLocation, onCustomLocationConfirm]
  )

  const handleCustomConfirm = useCallback(() => {
    if (customLocation.trim()) {
      onCustomLocationConfirm(customLocation.trim())
      setCustomLocation('')
    }
  }, [customLocation, onCustomLocationConfirm])

  const handleLocationSelect = useCallback(
    (loc: string) => {
      onLocationSelect(loc)
      setCustomLocation('')
    },
    [onLocationSelect]
  )

  const locationButtonClass = useCallback(
    (loc: string) => {
      const isActive = userLocation === loc && !isCustomLocation
      return `${
        isMobile ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
      } rounded-lg transition-colors ${
        isActive
          ? 'bg-pink-500/40 text-white border border-pink-400/30'
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/5'
      }`
    },
    [userLocation, isCustomLocation, isMobile]
  )

  const modeButtonClass = useCallback(
    (mode: 'online' | 'offline') => {
      const isActive = chatMode === mode
      return `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-pink-500/40 text-white border border-pink-400/30'
          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/5'
      }`
    },
    [chatMode]
  )

  return (
    <div
      className={
        isMobile
          ? 'w-full bg-slate-900/98 rounded-t-2xl border-t border-white/15 shadow-2xl p-5 pb-6 max-h-[70vh] overflow-y-auto'
          : 'absolute right-0 bottom-full mb-2 w-64 bg-slate-900/95 rounded-xl border border-white/15 shadow-2xl p-4 z-20'
      }
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white/80">场景设置</span>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
          aria-label="关闭设置"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 地点选择 */}
      <div className="mb-3">
        <label className="text-xs text-white/50 block mb-1.5">选择地点</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_LOCATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocationSelect(loc)}
              className={locationButtonClass(loc)}
            >
              {loc}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            placeholder="输入自定义地点..."
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-pink-400/50 transition-colors"
          />
          <button
            onClick={handleCustomConfirm}
            className="px-3 py-1.5 text-xs rounded-lg bg-pink-500/30 hover:bg-pink-500/50 text-white transition-colors whitespace-nowrap"
          >
            确认
          </button>
        </div>
        {isCustomLocation && (
          <div className="mt-1 text-[10px] text-pink-400/60">
            ✅ 当前使用自定义地点
          </div>
        )}
      </div>

      {/* 对话模式 */}
      <div className="mb-2">
        <label className="text-xs text-white/50 block mb-1.5">
          📱 对话模式
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onChatModeChange('online')}
            className={modeButtonClass('online')}
          >
            <Smartphone className="w-4 h-4" />
            手机
          </button>
          <button
            onClick={() => onChatModeChange('offline')}
            className={modeButtonClass('offline')}
          >
            <Users className="w-4 h-4" />
            面对面
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-white/20 text-center">
        📍 当前：{userLocation} ·{' '}
        {chatMode === 'online' ? '📱 手机' : '👤 面对面'}
      </div>
    </div>
  )
})

SettingsPanel.displayName = 'SettingsPanel'
