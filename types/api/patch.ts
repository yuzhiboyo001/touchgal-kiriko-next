import { Tag } from './tag'
import { Company } from './company'
import type { ResourceHealthStatus } from '~/constants/resource'

export interface PatchCapabilities {
  canEditPatch: boolean
  canDeletePatch: boolean
  canEditBanner: boolean
  canManageTags: boolean
  canManageCompanies: boolean
}

export interface Patch {
  id: number
  uniqueId: string
  vndbId: string | null
  vndbRelationId: string | null
  bangumiId: number | null
  dlsiteCode: string | null
  name: string
  banner: string
  introduction: string
  status: number
  view: number
  download: number
  alias: string[]
  type: string[]
  language: string[]
  platform: string[]
  tags: string[]
  isFavorite: boolean
  contentLimit: string
  contentWarning: boolean
  ratingSummary: PatchRatingSummary
  user: {
    id: number
    name: string
    avatar: string
    role?: number
  }
  created: string
  updated: string
  _count: {
    favorite_folder: number
    resource: number
    comment: number
  }
}

export interface PatchRatingSummary {
  average: number
  count: number
  histogram: { score: number; count: number }[]
  recommend: {
    strong_no: number
    no: number
    neutral: number
    yes: number
    strong_yes: number
  }
}

export interface PatchIntroduction {
  vndbId: string | null
  vndbRelationId?: string | null
  bangumiId?: number | null
  dlsiteCode?: string | null
  introduction: string
  released: string
  alias: string[]
  tag: Tag[]
  company: Company[]
  resourceUpdateTime: Date | string
  created: Date | string
  updated: Date | string
}

export interface PatchUpdate {
  name: string
  alias: string[]
  introduction: string
}

export interface PatchResourceLink {
  id: number
  storage: string
  size: string
  code: string
  password: string
  hash: string
  content: string
  sortOrder: number
  download: number
  healthStatus: ResourceHealthStatus
  lastCheckedAt: string | null
  lastOkAt: string | null
  checkErrno: number | null
  checkMessage: string
  remoteMd5: string
  remoteSize: string
  failCount: number
}

export interface PatchResource {
  id: number
  name: string
  section: string
  uniqueId: string
  isOfficial: boolean
  type: string[]
  language: string[]
  note: string
  noteHtml: string
  platform: string[]
  links: PatchResourceLink[]
  likeCount: number
  isLike: boolean
  status: number
  userId: number
  patchId: number
  created: string
  canEdit: boolean
  canDelete: boolean
  user: KunUser & {
    patchCount: number
    role: number
  }
}

export interface PatchComment {
  id: number
  uniqueId: string
  content: string
  isLike: boolean
  isSpoiler: boolean
  likeCount: number
  parentId: number | null
  userId: number
  patchId: number
  created: string
  updated: string
  canEdit: boolean
  canDelete: boolean
  reply: PatchComment[]
  user: KunUser
  quotedContent?: string | null
  quotedUsername?: string | null
  replyToUser?: KunUser | null
}

export interface PatchCommentResponse {
  comments: PatchComment[]
  total: number
  currentPage: number
}
