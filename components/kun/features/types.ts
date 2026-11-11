// features/types.ts
import type { StandeeConfig } from '../KirikoStandee/types'

export interface FeatureProps {
  config: StandeeConfig
  onClose: () => void
  scale?: number
}
