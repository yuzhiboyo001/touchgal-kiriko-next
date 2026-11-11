// components/patch/favorite/FavoriteModal.tsx

'use client'

import { useEffect, useRef, useState, useTransition, useMemo } from 'react'
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  Pagination,
  Skeleton
} from '@heroui/react'
import { Folder } from 'lucide-react'
import { kunFetchGet, kunFetchPut } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { EditFolderModal } from '~/components/user/favorite/EditFolderModal'
import { useTaskStore } from '~/store/taskStore'
import {
  DAILY_TASKS,
  WEEKLY_TASKS,
  CHALLENGE_TASKS
} from '~/components/effects/daily-task'
import type { UserFavoritePatchFolder } from '~/types/api/user'
// ✅ 新增：成就弹窗
import { AchievementToast } from '~/components/kun/features/AchievementFeature'
import { ACHIEVEMENTS } from '~/components/kun/features/AchievementFeature/config'
import { completeTask } from '~/components/effects/daily-task/utils/completeTask'

const LIMIT = 5

// ✅ 局部类型：收藏结果 + 成就
type ToggleFavoriteResult = {
  added: boolean
  newAchievements?: string[]
}

interface Props {
  patchId: number
  isOpen: boolean
  onClose: () => void
}

export const FavoriteModal = ({ patchId, isOpen, onClose }: Props) => {
  const [folders, setFolders] = useState<UserFavoritePatchFolder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isFetching, setIsFetching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fetchSeqRef = useRef(0)
  // ✅ 新增：待显示的成就
  const [newAchievements, setNewAchievements] = useState<string[]>([])

  // ✅ 当前要显示的成就
  const currentAchievement = useMemo(() => {
    if (newAchievements.length === 0) return null
    return ACHIEVEMENTS.find((a) => a.id === newAchievements[0])
  }, [newAchievements])

  const fetchFolders = async (currentPage: number) => {
    const seq = ++fetchSeqRef.current
    setIsFetching(true)
    try {
      const response = await kunFetchGet<{
        folders: UserFavoritePatchFolder[]
        total: number
      }>('/user/profile/favorite/folder', {
        patchId,
        page: currentPage,
        limit: LIMIT
      })
      if (seq !== fetchSeqRef.current) return
      setFolders(response.folders)
      setTotal(response.total)
    } finally {
      if (seq === fetchSeqRef.current) {
        setIsFetching(false)
      }
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      setPage(1)
      void fetchFolders(1)
    }, 0)

    return () => clearTimeout(timer)
  }, [isOpen])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchFolders(newPage)
  }

  const handleAddToFolder = async (folderId: number) => {
    startTransition(async () => {
      const res = await kunFetchPut<ToggleFavoriteResult>(`/patch/favorite`, {
        patchId,
        folderId
      })
      kunErrorHandler(res, async (value) => {
        const { newAchievements: achievements, added } = value

        toast.success(added ? '收藏成功' : '取消收藏成功')
        fetchFolders(page)

        if (achievements?.length && achievements.length > 0) {
          setNewAchievements((prev) => [...prev, ...achievements])
        }

        // ✅ 只有收藏时才触发 d3 任务
        if (added) {
          await completeTask('d3')
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Favorite] 取消收藏，不触发任务')
          }
        }
      })
    })
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <>
      {/* ✅ 成就弹窗 */}
      {currentAchievement && (
        <AchievementToast
          achievement={currentAchievement}
          onComplete={() => setNewAchievements((prev) => prev.slice(1))}
        />
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isDismissable={false}
        backdrop="opaque"
        classNames={{
          backdrop: 'bg-black/50 backdrop-blur-none',
          base: 'shadow-none'
        }}
      >
        <ModalContent className="shadow-none">
          <ModalBody className="py-6">
            <div className="space-y-4">
              <h2>
                <p className="text-lg font-bold">添加到收藏夹</p>
                <p className="text-sm text-default-500">
                  点击文件夹收藏, 再次点击取消收藏
                </p>
              </h2>

              <EditFolderModal
                action="create"
                onActionSuccess={() => fetchFolders(page)}
              />

              {isFetching
                ? Array.from({ length: LIMIT }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))
                : folders.map((folder) => (
                    <Button
                      key={folder.id}
                      startContent={<Folder className="w-4 h-4" />}
                      variant="bordered"
                      fullWidth
                      className="justify-between"
                      onPress={() => handleAddToFolder(folder.id)}
                      isLoading={isPending}
                      isDisabled={isPending}
                    >
                      <span>{folder.name}</span>
                      <Chip size="sm">
                        {folder.isAdd
                          ? '本游戏已添加'
                          : `${folder._count.patch} 个游戏`}
                      </Chip>
                    </Button>
                  ))}

              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    total={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    isDisabled={isFetching || isPending}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default FavoriteModal
