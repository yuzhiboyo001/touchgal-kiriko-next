// components/kun/KirikoStandee/types.ts

export interface StandeeConfig {
  id: string
  name: string
  imagePath: string
  shopImagePath?: string
  nameColor: string
  borderColor: string
  bgColor: string
  accentColor: string
  iconBg: string
  iconHover: string
  // 商店主题
  shopBg: string
  shopBorder: string
  shopAccent: string
  shopText: string
}

export interface StandeeProps {
  position?: 'left' | 'right'
  defaultX?: number
  defaultY?: number
  defaultScale?: number
  minScale?: number
  maxScale?: number
}

export interface StandeeState {
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
}
