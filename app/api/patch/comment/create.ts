// app/api/patch/comment/create.ts

import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchCommentCreateSchema } from '~/validations/patch'
import { createDedupMessage } from '~/app/api/utils/message'
import { createMentionMessage } from '~/app/api/utils/createMentionMessage'
import {
  COMMENT_HTML_VERSION,
  markdownToHtmlComment
} from '~/app/api/utils/render/markdownToHtmlComment'
import type { PatchComment } from '~/types/api/patch'
import { checkComment100 } from '~/components/kun/KirikoStandee/achievements'

// ✅ 新增：查"双向拉黑"
const checkBlocked = async (uid: number, otherUid: number) => {
  if (uid <= 0 || otherUid <= 0 || uid === otherUid) return false
  const rel = await prisma.user_block_relation.findFirst({
    where: {
      OR: [
        { blocker_id: uid, blocked_id: otherUid },
        { blocker_id: otherUid, blocked_id: uid }
      ]
    },
    select: { id: true }
  })
  return !!rel
}

export const createPatchComment = async (
  input: z.infer<typeof patchCommentCreateSchema>,
  uid: number
) => {
  // ✅ 新增：如果回复某人，检查黑名单
  if (input.parentId) {
    const parentComment = await prisma.patch_comment.findUnique({
      where: { id: input.parentId },
      select: { user_id: true }
    })
    if (parentComment && parentComment.user_id !== uid) {
      if (await checkBlocked(uid, parentComment.user_id)) {
        return '无法回复该用户'
      }
    }
  }

  let contentHtml = ''
  let contentHtmlVersion = 0
  try {
    contentHtml = await markdownToHtmlComment(input.content)
    contentHtmlVersion = COMMENT_HTML_VERSION
  } catch {
    contentHtml = ''
    contentHtmlVersion = 0
  }

  const data = await prisma.patch_comment.create({
    data: {
      content: input.content,
      content_html: contentHtml,
      content_html_version: contentHtmlVersion,
      is_spoiler: input.isSpoiler,
      user_id: uid,
      patch_id: input.patchId,
      parent_id: input.parentId
    },
    include: {
      patch: {
        select: {
          name: true,
          unique_id: true
        }
      },
      user: {
        select: {
          name: true
        }
      }
    }
  })

  if (input.parentId) {
    const parentComment = await prisma.patch_comment.findUnique({
      where: { id: input.parentId }
    })

    if (parentComment!.user_id !== uid) {
      await createDedupMessage({
        type: 'comment',
        content: `回复了您的评论：${parentComment!.content.slice(0, 107)}`,
        sender_id: uid,
        recipient_id: parentComment!.user_id,
        link: `/${data.patch.unique_id}?tab=comments&commentId=${data.id}`
      })
    }
  }

  await createMentionMessage(
    data.patch.unique_id,
    data.patch.name,
    data.id,
    uid,
    data.user.name,
    input.content
  )

  const newComment: Omit<PatchComment, 'user'> = {
    id: data.id,
    uniqueId: data.patch?.unique_id ?? '',
    content:
      contentHtmlVersion === COMMENT_HTML_VERSION && contentHtml
        ? contentHtml
        : await markdownToHtmlComment(data.content),
    isLike: false,
    isSpoiler: data.is_spoiler,
    likeCount: 0,
    parentId: data.parent_id,
    userId: data.user_id,
    patchId: data.patch_id,
    canEdit: true,
    canDelete: true,
    reply: [],
    created: String(data.created),
    updated: String(data.updated)
  }

  const newAchievements: string[] = []
  const result = await checkComment100(uid)
  if (result.isNew) {
    newAchievements.push('comment_100')
    console.log('🎉 [Achievement] 解锁: 茶话会常客')
  }

  return {
    ...newComment,
    newAchievements
  }
}
