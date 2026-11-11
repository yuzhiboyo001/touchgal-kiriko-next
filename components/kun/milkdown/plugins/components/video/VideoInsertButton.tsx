'use client'

import { useState } from 'react'
import {
  Button,
  Image,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip
} from '@heroui/react'
import { Video } from 'lucide-react'
import { insertKunVideoCommand } from './videoPlugin'
import type { CmdKey } from '@milkdown/core'

interface VideoInsertButtonProps {
  call: <T>(command: CmdKey<T>, payload?: T | undefined) => boolean | undefined
}

const isPreviewableUrl = (value: string) => /^https?:\/\//i.test(value.trim())

export const VideoInsertButton = ({ call }: VideoInsertButtonProps) => {
  const [link, setLink] = useState('')
  const [poster, setPoster] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const resetForm = () => {
    setLink('')
    setPoster('')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const handleVideoInsert = () => {
    const trimmedLink = link.trim()
    if (!trimmedLink) {
      return
    }

    const trimmedPoster = poster.trim()
    call(insertKunVideoCommand.key, {
      src: trimmedLink,
      ...(trimmedPoster ? { poster: trimmedPoster } : {})
    })
    setIsOpen(false)
    resetForm()
  }

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      placement="bottom"
      offset={10}
    >
      <PopoverTrigger>
        <Button isIconOnly variant="light">
          <Tooltip content="插入视频" offset={16}>
            <Video className="size-6" />
          </Tooltip>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px]">
        {(titleProps) => (
          <div className="w-full space-y-3 px-1 py-2">
            <p className="text-small font-bold text-foreground" {...titleProps}>
              插入视频
            </p>

            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              label="视频 URL"
              size="sm"
              variant="bordered"
              placeholder="https://...mp4"
            />

            <Input
              value={poster}
              onChange={(e) => setPoster(e.target.value)}
              label="封面图 URL（可选）"
              size="sm"
              variant="bordered"
              placeholder="https://img.kiriko.ink/..."
              description="留空则使用播放器的默认底色"
            />

            {isPreviewableUrl(poster) && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-default-200 bg-default-100">
                <Image
                  src={poster.trim()}
                  alt="封面预览"
                  removeWrapper
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <Button
              variant="flat"
              color="primary"
              onPress={handleVideoInsert}
              isDisabled={!link.trim()}
              className="mt-1 w-full"
            >
              确定插入
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
