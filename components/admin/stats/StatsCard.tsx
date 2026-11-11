'use client'

import { Card, CardBody } from '@heroui/react'
import type { FC } from 'react'

export const StatsCard: FC<{ title: string; value: number | string }> = ({
  title,
  value
}) => (
  <Card className="w-full md:w-[calc(25%-1rem)]">
    <CardBody className="flex flex-col justify-between">
      <p className="text-sm font-medium tracking-wide text-default-500">
        {title}
      </p>
      <p className="text-xl font-semibold text-default-700">
        {typeof value === 'number' ? value.toLocaleString('zh-CN') : value}
      </p>
    </CardBody>
  </Card>
)
