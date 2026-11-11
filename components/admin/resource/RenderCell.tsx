'use client'

import { Chip } from '@heroui/react'
import Link from 'next/link'
import {
  RESOURCE_HEALTH_STATUS_COLOR,
  RESOURCE_HEALTH_STATUS_MAP,
  SUPPORTED_RESOURCE_LINK_MAP
} from '~/constants/resource'
import { KunTimeAgo } from '~/components/kun/TimeAgo'
import { ResourceEdit } from './ResourceEdit'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import type { AdminResource } from '~/types/api/admin'

export const RenderCell = (resource: AdminResource, columnKey: string) => {
  switch (columnKey) {
    case 'name':
      return (
        <Link
          href={`/${resource.uniqueId}`}
          className="font-medium hover:text-primary-500"
        >
          {resource.patchName}
        </Link>
      )
    case 'user':
      return (
        <KunUser
          user={resource.user}
          userProps={{
            name: resource.user.name,
            avatarProps: {
              src: resource.user.avatar
            }
          }}
        />
      )
    case 'storage':
      if (!resource.links.length) {
        return (
          <Chip color="default" variant="flat">
            无链接
          </Chip>
        )
      }
      return (
        <div className="flex flex-wrap gap-1">
          {resource.links.slice(0, 2).map((link) => (
            <Chip key={link.id} color="primary" variant="flat">
              {SUPPORTED_RESOURCE_LINK_MAP[link.storage]}
            </Chip>
          ))}
          {resource.links.length > 2 && (
            <Chip color="default" variant="flat">
              +{resource.links.length - 2}
            </Chip>
          )}
        </div>
      )
    case 'size':
      if (!resource.links.length) {
        return (
          <Chip size="sm" variant="flat">
            无链接
          </Chip>
        )
      }
      return (
        <div className="flex flex-wrap gap-1">
          {resource.links.slice(0, 2).map((link) => (
            <Chip key={link.id} size="sm" variant="flat">
              {link.size}
            </Chip>
          ))}
          {resource.links.length > 2 && (
            <Chip size="sm" variant="flat">
              +{resource.links.length - 2}
            </Chip>
          )}
        </div>
      )
    case 'health':
      if (!resource.links.length) {
        return (
          <Chip size="sm" variant="flat">
            无链接
          </Chip>
        )
      }
      return (
        <div className="flex flex-wrap gap-1">
          {resource.links.map((link) => (
            <Chip
              key={link.id}
              size="sm"
              variant="flat"
              color={RESOURCE_HEALTH_STATUS_COLOR[link.healthStatus]}
            >
              {RESOURCE_HEALTH_STATUS_MAP[link.healthStatus]}
            </Chip>
          ))}
        </div>
      )
    case 'last_checked': {
      const checkedAt = resource.links
        .map((link) => link.lastCheckedAt)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1)

      return checkedAt ? (
        <Chip size="sm" variant="light">
          <KunTimeAgo date={checkedAt} />
        </Chip>
      ) : (
        <Chip size="sm" variant="flat" color="default">
          未检查
        </Chip>
      )
    }
    case 'created':
      return (
        <Chip size="sm" variant="light">
          <KunTimeAgo date={resource.created} />
        </Chip>
      )
    case 'actions':
      return <ResourceEdit initialResource={resource} />
    default:
      return (
        <Chip color="primary" variant="flat">
          未知
        </Chip>
      )
  }
}
