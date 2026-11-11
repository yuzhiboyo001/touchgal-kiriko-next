export interface UserInfo {
  id: number
  requestUserUid: number
  name: string
  email: string
  avatar: string
  bio: string
  role: number
  status: number
  registerTime: string
  moemoepoint: number
  nameplate?: string | null
  donorUntil?: string | Date | null
  supporterActive?: boolean
  follower: number
  following: number
  isFollow: boolean
  _count: {
    patch: number
    patch_resource: number
    patch_comment: number
    patch_favorite: number
    patch_rating: number
  }
}

export interface UserFollow {
  id: number
  name: string
  avatar: string
  bio: string
  follower: number
  following: number
  isFollow: boolean
  role?: number
}

export interface UserResource {
  id: number
  section: string
  patchUniqueId: string
  patchId: number
  patchName: string
  patchBanner: string
  type: string[]
  language: string[]
  platform: string[]
  created: string
}

export interface UserContribute {
  id: number
  patchUniqueId: string
  patchId: number
  patchName: string
  created: string
}

export interface UserComment {
  id: number
  patchUniqueId: string
  content: string
  like: number
  userId: number
  patchId: number
  patchName: string
  created: string
  quotedUserUid?: number | null
  quotedUsername?: string | null
}

export interface UserRating {
  id: number
  patchUniqueId: string
  patchName: string
  recommend: string
  overall: number
  playStatus: string
  shortSummary: string
  spoilerLevel: string
  like: number
  created: string
}

export interface FloatingCardUser {
  id: number
  name: string
  avatar: string
  bio: string
  moemoepoint: number
  role: number
  isFollow: boolean
  isBlocked: boolean // 我拉黑了 TA
  isBlockedBy: boolean // TA 拉黑了我
  _count: {
    follower: number
    patch: number
    patch_resource: number
  }
}

export interface BlockedUser {
  role?: number
  id: number
  name: string
  avatar: string
  bio: string
  blockedAt: string
}

export interface UserFavoritePatchFolder {
  id: number
  name: string
  description?: string
  is_public: boolean
  isAdd: boolean
  _count: { patch: number }
}
