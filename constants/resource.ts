// constants/resource.ts
export const resourceTypes = [
  {
    value: 'pc',
    label: 'PC游戏',
    description: '在 Windows, macOS 等电脑设备上运行的游戏'
  },
  {
    value: 'row',
    label: '生肉资源',
    description: '没有中文翻译, 仅有日语或其它语言的 Galgame'
  },
  {
    value: 'chinese',
    label: '汉化资源',
    description: '汉化 Galgame 下载资源, 有简体中文或繁体中文支持'
  },
  {
    value: 'patch',
    label: '补丁资源',
    description: '与这个 Galgame 相关的补丁资源'
  },
  {
    value: 'mobile',
    label: '手机游戏',
    description: '可以在手机上运行的 Galgame 游戏'
  },
  {
    value: 'emulator',
    label: '模拟器资源',
    description:
      '可以在手机模拟器, 例如 KiriKiri, ONS, Tyranor 等模拟器中运行的 Galgame 游戏'
  },
  {
    value: 'app',
    label: '直装资源',
    description: '可以直接在手机安装并游玩的 Galgame'
  },
  {
    value: 'tool',
    label: '游戏工具',
    description: '辅助游玩 Galgame 的工具, 例如 KRKR 模拟器, Magpie 等'
  },
  {
    value: 'notice',
    label: '官方通知',
    description: '由官方发布的站点通知'
  },
  {
    value: 'other',
    label: '其它',
    description: '其它内容'
  }
]

export const SUPPORTED_TYPE = [
  'pc',
  'chinese',
  'mobile',
  'emulator',
  'row',
  'app',
  'patch',
  'tool',
  'notice',
  'other'
]
export const SUPPORTED_TYPE_MAP: Record<string, string> = {
  all: '全部类型',
  pc: 'PC游戏',
  chinese: '汉化资源',
  mobile: '手机游戏',
  emulator: '模拟器资源',
  row: '生肉资源',
  app: '直装资源',
  patch: '补丁资源',
  tool: '游戏工具',
  notice: '官方通知',
  other: '其它'
}
export const ALL_SUPPORTED_TYPE = ['all', ...SUPPORTED_TYPE]

export const SUPPORTED_LANGUAGE = ['zh-Hans', 'zh-Hant', 'ja', 'en', 'other']
export const ALL_SUPPORTED_LANGUAGE = ['all', ...SUPPORTED_LANGUAGE]
export const SUPPORTED_LANGUAGE_MAP: Record<string, string> = {
  all: '全部语言',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  ja: '日本語',
  en: 'English',
  other: '其它'
}

export const SUPPORTED_PLATFORM = [
  'windows',
  'android',
  'macos',
  'ios',
  'linux',
  'other'
]
export const ALL_SUPPORTED_PLATFORM = ['all', ...SUPPORTED_PLATFORM]
export const SUPPORTED_PLATFORM_MAP: Record<string, string> = {
  all: '全部平台',
  windows: 'Windows',
  android: 'Android',
  macos: 'MacOS',
  ios: 'iOS',
  linux: 'Linux',
  other: '其它'
}

// ==========================================
// 资源存储类型重构：彻底移除 S3 与官方盘
// ==========================================

export const SUPPORTED_RESOURCE_LINK = ['user']

// 仅保留自定义链接的选项
export const storageTypes = [
  {
    value: 'user',
    label: '网盘下载链接 (自定义)',
    description: '请提供百度网盘、夸克网盘、阿里云盘等有效的下载分享链接'
  }
]

export const SUPPORTED_RESOURCE_LINK_MAP: Record<string, string> = {
  user: '网盘下载链接'
}

export const RESOURCE_HEALTH_STATUS = [
  'active',
  'dead',
  'expired',
  'password_required',
  'password_error',
  'rate_limited',
  'unknown'
] as const

export type ResourceHealthStatus = (typeof RESOURCE_HEALTH_STATUS)[number]

export const RESOURCE_HEALTH_STATUS_MAP: Record<ResourceHealthStatus, string> =
  {
    active: '正常',
    dead: '已失效',
    expired: '已过期',
    password_required: '需要提取码',
    password_error: '提取码错误',
    rate_limited: '检查受限',
    unknown: '未知'
  }

export const RESOURCE_HEALTH_STATUS_COLOR: Record<
  ResourceHealthStatus,
  'success' | 'danger' | 'warning' | 'default'
> = {
  active: 'success',
  dead: 'danger',
  expired: 'danger',
  password_required: 'warning',
  password_error: 'warning',
  rate_limited: 'warning',
  unknown: 'default'
}

export const SUPPORTED_RESOURCE_SECTION = ['galgame', 'patch']

export const RESOURCE_SECTION_MAP: Record<string, string> = {
  galgame: 'Galgame 资源',
  patch: 'Galgame 补丁'
}

// 网盘域名识别映射表
export const PAN_DOMAIN_MAP: Record<string, string> = {
  'pan.baidu.com': '百度网盘',
  'yun.baidu.com': '百度网盘',
  'pan.quark.cn': '夸克网盘',
  'drive.uc.cn': 'UC网盘',
  'fast.uc.cn': 'UC网盘',
  'aliyundrive.com': '阿里云盘',
  'alipan.com': '阿里云盘',
  'cloud.189.cn': '天翼云盘',
  'caiyun.139.com': '移动云盘',
  '115.com': '115网盘',
  '115cdn.com': '115网盘',
  'mega.nz': 'MEGA',
  'drive.google.com': 'Google Drive',
  '1drv.ms': 'OneDrive',
  'share.weiyun.com': '腾讯微云',
  'weiyun.com': '腾讯微云',
  'lanzou.com': '蓝奏云',
  'lanzoui.com': '蓝奏云',
  'lanzoux.com': '蓝奏云',
  'jianguoyun.com': '坚果云'
}

// 获取网盘名称的工具函数
export const getPanName = (url: string | undefined) => {
  if (!url) return '网盘下载链接'

  try {
    // 补全协议头，防止 new URL 报错
    const urlString = url.startsWith('http') ? url : `https://${url}`
    const hostname = new URL(urlString).hostname.toLowerCase()

    for (const [domain, name] of Object.entries(PAN_DOMAIN_MAP)) {
      if (hostname.includes(domain)) {
        return name
      }
    }
  } catch (e) {
    // URL 解析失败，直接返回默认值
  }

  return '网盘下载链接'
}
