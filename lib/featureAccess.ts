import { getKv, setKv } from '~/lib/redis'

export type FeatureKey = 'publishResource' | 'dlsiteImport'

export type RoleFlags = {
  1: boolean
  2: boolean
  3: boolean
  4: boolean
}

export type FeatureAccess = Record<FeatureKey, RoleFlags>

export const FEATURE_ACCESS_REDIS_KEY = 'admin:feature-access'

export const DEFAULT_FEATURE_ACCESS: FeatureAccess = {
  // 创作者（role 2）和管理员（role 3）默认可以发布资源；
  // 是否继续开放仍可在后台功能权限中单独关闭。
  publishResource: { 1: false, 2: true, 3: true, 4: true },
  dlsiteImport: { 1: false, 2: false, 3: false, 4: true }
}

const normalizeFlags = (value: unknown): RoleFlags => {
  const source = value && typeof value === 'object' ? value : {}
  const read = (role: 1 | 2 | 3) =>
    (source as Record<string, unknown>)[String(role)] === true

  return {
    1: read(1),
    2: read(2),
    3: read(3),
    // 超级管理员固定允许，避免后台误关后无法恢复
    4: true
  }
}

const normalizeAccess = (value: unknown): FeatureAccess => {
  const source = value && typeof value === 'object' ? value : {}
  return {
    publishResource: normalizeFlags(
      (source as Partial<FeatureAccess>).publishResource
    ),
    dlsiteImport: normalizeFlags(
      (source as Partial<FeatureAccess>).dlsiteImport
    )
  }
}

export const getFeatureAccess = async (): Promise<FeatureAccess> => {
  try {
    const raw = await getKv(FEATURE_ACCESS_REDIS_KEY)
    return raw ? normalizeAccess(JSON.parse(raw)) : DEFAULT_FEATURE_ACCESS
  } catch (error) {
    console.error('读取功能权限开关失败，使用默认关闭:', error)
    return DEFAULT_FEATURE_ACCESS
  }
}

export const setFeatureAccess = async (access: FeatureAccess) => {
  await setKv(FEATURE_ACCESS_REDIS_KEY, JSON.stringify(normalizeAccess(access)))
}

export const canRoleUseFeature = async (feature: FeatureKey, role: number) => {
  if (role >= 4) return true
  if (role < 1 || role > 3) return false

  const access = await getFeatureAccess()
  return access[feature][role as 1 | 2 | 3] === true
}
