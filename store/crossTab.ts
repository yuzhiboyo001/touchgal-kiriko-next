export const CROSS_TAB_SIGNAL_PREFIX = 'kun-store-sync'

/**
 * 给没有被 zustand persist 写入 localStorage 的 store 用（例如 cookie 存储的 settingStore）。
 * 其他标签页收到 storage 事件后会重新 hydrate。
 */
export const broadcastStoreChange = (store: string) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      `${CROSS_TAB_SIGNAL_PREFIX}:${store}`,
      String(Date.now())
    )
  } catch {
    // 隐私模式/存储配额满时忽略，不影响主流程
  }
}
