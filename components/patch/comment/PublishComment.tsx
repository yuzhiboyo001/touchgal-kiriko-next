// components/patch/comment/PublishComment.tsx

'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Switch } from '@heroui/switch'
import { EyeOff, Send } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { useUserStore } from '~/store/userStore'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import { KunMarkdownEditor } from '~/components/kun/editor/MarkdownEditor'
import { completeTask } from '~/components/effects/daily-task/utils/completeTask'
import type { PatchComment } from '~/types/api/patch'

type CommentWithAchievements = PatchComment & {
  newAchievements?: string[]
}

interface CreateCommentProps {
  patchId: number
  receiverUsername: string | null | undefined
  parentId?: number | null
  setNewComment: (newComment: PatchComment) => void
  onSuccess?: () => void
  onCancel?: () => void
  onAchievements?: (ids: string[]) => void
}

export const PublishComment = ({
  patchId,
  parentId = null,
  receiverUsername = null,
  setNewComment,
  onSuccess,
  onCancel,
  onAchievements
}: CreateCommentProps) => {
  const [loading, setLoading] = useState(false)
  const user = useUserStore((state) => state.user)
  const [content, setContent] = useState('')
  const [isSpoiler, setIsSpoiler] = useState(false)

  const handlePublishComment = async () => {
    setLoading(true)
    const res = await kunFetchPost<CommentWithAchievements>('/patch/comment', {
      patchId,
      parentId,
      content: content.trim(),
      isSpoiler
    })

    kunErrorHandler(res, async (value) => {
      const { newAchievements: achievements, ...comment } = value

      setNewComment({
        ...comment,
        user: { id: user.uid, name: user.name, avatar: user.avatar }
      })
      toast.success('评论发布成功')
      setContent('')
      setIsSpoiler(false)

      if (achievements?.length && achievements.length > 0) {
        onAchievements?.(achievements)
      }

      // ✅ 评论成功 → 完成 d5（服务端 newlyCompleted 裁决弹不弹）
      await completeTask('d5')
      onSuccess?.()
    })

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="pb-0 space-x-4">
        <KunAvatar
          uid={user.uid}
          avatarProps={{
            showFallback: true,
            name: user.name,
            src: user.avatar
          }}
        />
        <div className="flex flex-col">
          <span className="font-semibold">{user.name}</span>
          {receiverUsername && (
            <span className="text-sm">回复 @{receiverUsername}</span>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <KunMarkdownEditor
          value={content}
          onChange={setContent}
          minHeight={180}
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Switch
            isSelected={isSpoiler}
            onValueChange={setIsSpoiler}
            color="warning"
            size="sm"
            thumbIcon={<EyeOff className="size-3" />}
          >
            <span className="text-sm text-default-600">剧透评论</span>
          </Switch>

          <div className="flex gap-2">
            {onCancel && (
              <Button variant="flat" onPress={onCancel}>
                取消
              </Button>
            )}
            <Button
              color="primary"
              startContent={<Send className="size-4" />}
              isDisabled={!content.trim() || loading}
              isLoading={loading}
              onPress={handlePublishComment}
            >
              发布评论
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
