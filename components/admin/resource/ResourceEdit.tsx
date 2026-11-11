'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@heroui/react'
import { Edit2, RefreshCw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { kunFetchDelete, kunFetchPost } from '~/utils/kunFetch'
import { EditResourceDialog } from '~/components/patch/resource/edit/EditResourceDialog'
import type { AdminResource } from '~/types/api/admin'

interface Props {
  initialResource: AdminResource
}

// TODO: Reactivity
export const ResourceEdit = ({ initialResource }: Props) => {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  const handleCheckLinks = async () => {
    if (!initialResource.isOfficial) {
      toast.error('仅官方资源参与链接检查')
      return
    }

    const baiduLinks = initialResource.links.filter((link) =>
      link.content.includes('pan.baidu.com')
    )
    if (!baiduLinks.length) {
      toast.error('没有可检查的百度网盘链接')
      return
    }

    setChecking(true)
    let failed = 0
    for (const link of baiduLinks) {
      const res = await kunFetchPost<KunResponse<{}>>('/admin/resource/check', {
        linkId: link.id
      })
      if (typeof res === 'string') failed += 1
    }
    setChecking(false)
    toast[failed ? 'error' : 'success'](
      failed ? `${failed} 条链接检查失败` : '链接检查完成'
    )
    router.refresh()
  }

  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit
  } = useDisclosure()

  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete
  } = useDisclosure()
  const [deleting, setDeleting] = useState(false)
  const handleDeleteResource = async () => {
    setDeleting(true)

    const res = await kunFetchDelete<KunResponse<{}>>('/admin/resource', {
      resourceId: initialResource.id
    })
    if (typeof res === 'string') {
      toast.error(res)
    } else {
      toast.success('删除资源链接成功')
    }

    setDeleting(false)
    onCloseDelete()
  }

  return (
    <>
      <div className="flex gap-2">
        {initialResource.isOfficial && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label="立即检查链接"
            isDisabled={checking}
            isLoading={checking}
            onPress={handleCheckLinks}
          >
            <RefreshCw size={16} />
          </Button>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          aria-label="编辑或补链"
          onPress={onOpenEdit}
        >
          <Edit2 size={16} />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          onPress={onOpenDelete}
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <Modal
        size="3xl"
        isOpen={isOpenEdit}
        onClose={onCloseEdit}
        scrollBehavior="outside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <EditResourceDialog
          onClose={onCloseEdit}
          resource={initialResource}
          onSuccess={onCloseEdit}
          type="admin"
        />
      </Modal>

      <Modal isOpen={isOpenDelete} onClose={onCloseDelete} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            删除资源链接
          </ModalHeader>
          <ModalBody>
            <p>您确定要删除这条资源链接吗, 该操作不可撤销</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseDelete}>
              取消
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteResource}
              disabled={deleting}
              isLoading={deleting}
            >
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
