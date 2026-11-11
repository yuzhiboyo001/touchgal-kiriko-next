import type { MessageUnreadStatus } from './message'
import type { UserState } from '~/store/userStore'

export interface GlobalCapabilities {
  canAccessAdmin: boolean
  canCreatePatch: boolean
  canEditPatch: boolean
  canDeletePatch: boolean
  canManageTags: boolean
  canManageCompanies: boolean
  canApplyCreator: boolean
  canPublishOfficialResource: boolean
}

export interface FeatureCapabilities {
  canPublishResource: boolean
  canUseDlsiteImport: boolean
}

export interface UserSession {
  user: UserState
  unread: MessageUnreadStatus
  capabilities: GlobalCapabilities
}

export type AuthUserState = UserState & {
  capabilities: GlobalCapabilities
}

export type SessionStatus =
  'pending' | 'authenticated' | 'anonymous' | 'unavailable'

export interface LoginSession {
  id: string
  userAgent: string
  ip: string
  createdAt: number
  lastActiveAt: number
  isCurrent: boolean
}

export interface RevokeLoginSessionResponse {
  revokedCurrent: boolean
}

export interface RevokeOtherLoginSessionsResponse {
  revokedCount: number
}
