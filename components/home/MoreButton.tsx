'use client'

import Link from 'next/link'
import { Button } from '@heroui/button'
import { ChevronRight } from 'lucide-react'

interface Props {
  href: string
}

export const HomeMoreButton = ({ href }: Props) => {
  return (
    <Button
      variant="light"
      as={Link}
      color="primary"
      endContent={<ChevronRight className="size-4" />}
      href={href}
    >
      查看更多
    </Button>
  )
}
