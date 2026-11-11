import { Card } from '@heroui/card'
import { CheckCircle2 } from 'lucide-react'
import { kunMetadata } from './metadata'
import { BackHomeButton } from './BackHomeButton'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Kun() {
  return (
    <Card className="w-full max-w-md p-8 m-auto text-center max-h-80">
      <div className="flex justify-center mb-4">
        <CheckCircle2 className="size-16 text-success-500" />
      </div>
      <h1 className="mb-4 text-2xl font-bold">申请已经提交</h1>
      <div className="mb-6 text-default-500">
        <p>感谢您申请成为创作者!</p>
        <p>我们会在数小时内审核您的请求!</p>
      </div>
      <BackHomeButton />
    </Card>
  )
}
