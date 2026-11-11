'use client'

import { Button } from '@heroui/button'
import { useDisclosure } from '@heroui/modal'
import { Plus } from 'lucide-react'
import { KunHeader } from '../kun/Header'
import { CompanyFormModal } from './form/CompanyFormModal'
import type { FC } from 'react'
import type { Company as CompanyType } from '~/types/api/company'

interface Props {
  setNewCompany: (company: CompanyType) => void
  canManageCompanies: boolean
}

export const CompanyHeader: FC<Props> = ({
  setNewCompany,
  canManageCompanies
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <KunHeader
        name="会社列表"
        description="这里是本站 Galgame 中包含的所有会社"
        headerEndContent={
          <>
            {canManageCompanies && (
              <Button color="primary" onPress={onOpen} startContent={<Plus />}>
                创建会社
              </Button>
            )}
          </>
        }
      />

      <CompanyFormModal
        type="create"
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={(newCompany) => {
          setNewCompany(newCompany)
          onClose()
        }}
      />
    </>
  )
}
