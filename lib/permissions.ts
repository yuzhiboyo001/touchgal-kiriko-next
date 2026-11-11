import type { GlobalCapabilities } from '~/types/api/session'

export interface Viewer {
  uid: number
  role: number
}

export const getGlobalCapabilities = (role: number): GlobalCapabilities => ({
  canAccessAdmin: role >= 4,
  canCreatePatch: role >= 4,
  canEditPatch: role >= 3,
  canDeletePatch: role >= 4,
  canManageTags: role >= 3,
  canManageCompanies: role >= 3,
  canApplyCreator: role === 1,
  canPublishOfficialResource: role >= 3
})

/**
 * 服务端评论权限的唯一规则来源。
 * 列表接口用它生成 canEdit/canDelete，写接口用它做最终校验。
 */
export const canManageOwnedContent = (
  viewer: Viewer,
  ownerUserId: number
): boolean => {
  if (viewer.uid <= 0) return false
  return viewer.uid === ownerUserId || viewer.role >= 3
}

export const canEditComment = (
  viewer: Viewer,
  commentUserId: number
): boolean => canManageOwnedContent(viewer, commentUserId)

export const canDeleteComment = (
  viewer: Viewer,
  commentUserId: number
): boolean => canManageOwnedContent(viewer, commentUserId)

export const canEditRating = (viewer: Viewer, ratingUserId: number): boolean =>
  canManageOwnedContent(viewer, ratingUserId)

export const canDeleteRating = (
  viewer: Viewer,
  ratingUserId: number
): boolean => canManageOwnedContent(viewer, ratingUserId)

export const canReportRating = (
  viewer: Viewer,
  ratingUserId: number
): boolean => viewer.uid > 0 && viewer.role < 3 && viewer.uid !== ratingUserId

export const canEditPatch = (viewer: Viewer): boolean =>
  getGlobalCapabilities(viewer.role).canEditPatch

export const canDeletePatch = (viewer: Viewer): boolean =>
  getGlobalCapabilities(viewer.role).canDeletePatch

export const canEditPatchBanner = (
  viewer: Viewer,
  patchOwnerId: number
): boolean =>
  viewer.uid > 0 && (viewer.uid === patchOwnerId || viewer.role >= 3)

export const canEditResource = (
  viewer: Viewer,
  resourceOwnerId: number
): boolean => canManageOwnedContent(viewer, resourceOwnerId)

export const canDeleteResource = (
  viewer: Viewer,
  resourceOwnerId: number
): boolean => canManageOwnedContent(viewer, resourceOwnerId)

export const canManageTags = (viewer: Viewer): boolean =>
  getGlobalCapabilities(viewer.role).canManageTags

export const canManageCompanies = (viewer: Viewer): boolean =>
  getGlobalCapabilities(viewer.role).canManageCompanies
