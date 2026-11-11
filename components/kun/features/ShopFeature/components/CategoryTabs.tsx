// features/ShopFeature/components/CategoryTabs.tsx

'use client'

import { memo } from 'react'
import { CATEGORIES, CategoryId } from '../config'

interface CategoryTabsProps {
  selected: CategoryId
  onChange: (id: CategoryId) => void
  accent: string
  textBright: string
}

export const CategoryTabs = memo(
  ({ selected, onChange, accent, textBright }: CategoryTabsProps) => {
    return (
      <div className="flex gap-2 px-4 md:px-6 py-3 border-b border-white/5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`
              px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-200
              ${
                selected === cat.id
                  ? `${accent} ${textBright} shadow-lg shadow-rose-500/20 scale-[1.02]`
                  : `text-white/50 hover:text-white/80 hover:bg-white/5`
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>
    )
  }
)

CategoryTabs.displayName = 'CategoryTabs'
