'use client'

import { Tooltip } from '@heroui/tooltip'
import { Button } from '@heroui/button'
import { Search } from 'lucide-react'
import { useRouter } from '@bprogress/next'
import { useHotkeys } from 'react-hotkeys-hook'

export const KunSearch = () => {
  const router = useRouter()
  useHotkeys('ctrl+k', (event) => {
    event.preventDefault()
    router.push('/search')
  })

  return (
    <Tooltip
      disableAnimation
      showArrow
      closeDelay={0}
      content="您可以按下 Ctrl + K 快速搜索"
    >
      <Button
        isIconOnly
        variant="light"
        aria-label="搜索"
        onPress={() => router.push('/search')}
        className="text-pink-400/80 hover:text-pink-400"
      >
        <Search className="size-6" />
      </Button>
    </Tooltip>
  )
}
