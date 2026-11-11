'use client'

import Link from 'next/link'
import { Button } from '@heroui/button'

export const BackHomeButton = () => {
  return (
    <Button as={Link} href="/" color="primary">
      返回主页
    </Button>
  )
}
