// components/kun/KirikoStandee/affection/checkLevelUp.ts
import { useUserStore } from '~/store/userStore'

export const checkLevelUp = (newLevel: number, totalAffection?: number) => {
  // 从本地存储获取上次记录的等级（如果没有则默认为 1）
  const lastLevel = Number(localStorage.getItem('last-affection-level') || '1')

  if (newLevel > lastLevel) {
    // 升级了！触发全站弹窗
    useUserStore.getState().setLevelUpToast({
      show: true,
      level: newLevel,
      total: totalAffection ?? newLevel
    })
    // 更新本地记录，防止刷新页面重复弹
    localStorage.setItem('last-affection-level', String(newLevel))
  }
}
