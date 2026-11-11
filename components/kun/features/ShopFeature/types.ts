import type { StandeeConfig } from '../../KirikoStandee/types'

export interface FeatureProps {
  config: StandeeConfig
  onClose: () => void
  scale?: number
}

export interface ShopItem {
  id: string
  name: string
  price: number
  iconName: string
  description: string
  category: 'drink' | 'food' | 'gift' | 'merch' | 'accessory' | 'special'
  affection: number
  stock?: number
  limited?: boolean
  rare?: boolean
}

export type CategoryId =
  'all' | 'drink' | 'food' | 'gift' | 'merch' | 'accessory' | 'special'

export interface ShopFeatureProps {
  config: StandeeConfig
  onClose: () => void
  initialCoins?: number
  onCoinsUpdate?: (newCoins: number) => void
}
