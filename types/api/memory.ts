export type BrainMemoryType = 'core' | 'relationship' | 'promise' | 'episode'

export interface BrainMemoryItem {
  content: string
  slot?: string | null
  source_turn?: number | null
  evidence?: string | null
  status?: 'open' | 'done' | 'cancelled' | null
}

export interface BrainMemoryExtraction {
  core?: BrainMemoryItem[]
  relationship?: BrainMemoryItem | null
  promises?: BrainMemoryItem[]
  episodes?: BrainMemoryItem[]
}
