// components/kun/features/ShopFeature/config.ts

import type { LucideIcon } from 'lucide-react'
import {
  // 饮品
  Coffee,
  Milk,
  Beer,
  Wine,
  Droplet,
  // 食物
  EggFried,
  Fish,
  Pizza,
  Sandwich,
  Soup,
  Cake,
  IceCream,
  Cookie,
  Candy,
  Popcorn,
  Apple,
  // 礼物
  Gift,
  Music,
  Sparkles,
  Flower,
  Heart,
  Gem,
  Crown,
  // 周边
  Package,
  Book,
  // 饰品
  Watch,
  Glasses,
  Feather,
  Train,
  // 其他
  UtensilsCrossed,
  Headphones,
  Gamepad2,
  Camera,
  Plane,
  ShoppingBag,
  Award,
  Shirt
} from 'lucide-react'
import type { ShopItem } from './types'

export const ICON_MAP: Record<string, LucideIcon> = {
  Milk,
  Coffee,
  Beer,
  Wine,
  Droplet,
  EggFried,
  Fish,
  Pizza,
  Sandwich,
  Train,
  Soup,
  Cake,
  IceCream,
  Cookie,
  Candy,
  Popcorn,
  Apple,
  UtensilsCrossed,
  Gift,
  Music,
  Sparkles,
  Flower,
  Heart,
  Gem,
  Crown,
  Package,
  Book,
  ShoppingBag,
  Award,
  Watch,
  Glasses,
  Feather,
  Headphones,
  Gamepad2,
  Camera,
  Plane,
  Shirt
}

export const SHOP_ITEMS: ShopItem[] = [
  // ===== 饮品 (drink) =====
  {
    id: 'calpis',
    name: '可口可乐',
    price: 150,
    iconName: 'Milk',
    description: '最经典的汽水',
    category: 'drink',
    affection: 1
  },
  {
    id: 'matcha',
    name: '抹茶拿铁',
    price: 280,
    iconName: 'Coffee',
    description: '和风甘甜',
    category: 'drink',
    affection: 3
  },

  {
    id: 'coffee',
    name: '手冲咖啡',
    price: 300,
    iconName: 'Coffee',
    description: '苦涩中带着温柔',
    category: 'drink',
    affection: 3
  },
  {
    id: 'sake',
    name: '梅酒',
    price: 400,
    iconName: 'Beer',
    description: '年轻人不要贪杯',
    category: 'drink',
    affection: 5,
    rare: true
  },

  // ===== 食物 (food) =====
  {
    id: 'omurice',
    name: '蛋包饭',
    price: 450,
    iconName: 'EggFried',
    description: '❤ 用番茄酱写上名字',
    category: 'food',
    affection: 5
  },
  {
    id: 'takoyaki',
    name: '章鱼烧',
    price: 320,
    iconName: 'Fish',
    description: '热腾腾的满足感',
    category: 'food',
    affection: 3
  },
  {
    id: 'pizza',
    name: '玛格丽特披萨',
    price: 550,
    iconName: 'Pizza',
    description: '那不勒斯风味',
    category: 'food',
    affection: 6
  },
  {
    id: 'sandwich',
    name: '鸡蛋三明治',
    price: 250,
    iconName: 'Sandwich',
    description: '便利店经典',
    category: 'food',
    affection: 2
  },
  {
    id: 'curry',
    name: '咖喱饭',
    price: 480,
    iconName: 'Soup',
    description: '微辣的温暖',
    category: 'food',
    affection: 5
  },
  {
    id: 'cake',
    name: '草莓蛋糕',
    price: 380,
    iconName: 'Cake',
    description: '甜到心里',
    category: 'food',
    affection: 4
  },
  {
    id: 'ramen',
    name: '拉面',
    price: 500,
    iconName: 'Soup',
    description: '深夜的慰藉',
    category: 'food',
    affection: 4
  },
  {
    id: 'icecream',
    name: '冰淇淋',
    price: 200,
    iconName: 'IceCream',
    description: '夏天怎么能少',
    category: 'food',
    affection: 2
  },
  {
    id: 'cookie',
    name: '手作曲奇',
    price: 160,
    iconName: 'Cookie',
    description: '充满心意的甜点',
    category: 'food',
    affection: 2
  },
  {
    id: 'candy',
    name: '柠檬糖',
    price: 100,
    iconName: 'Candy',
    description: '酸酸甜甜的日常',
    category: 'food',
    affection: 1
  },
  {
    id: 'popcorn',
    name: '爆米花',
    price: 180,
    iconName: 'Popcorn',
    description: '看电影的标配',
    category: 'food',
    affection: 2
  },

  // ===== 礼物 (gift) =====
  {
    id: 'flower',
    name: '花束',
    price: 600,
    iconName: 'Flower',
    description: '传达心意',
    category: 'gift',
    affection: 8
  },
  {
    id: 'chocolate',
    name: '手作巧克力',
    price: 350,
    iconName: 'Heart',
    description: '❤ 本命巧克力',
    category: 'gift',
    affection: 5
  },
  {
    id: 'musicbox',
    name: '音乐盒',
    price: 800,
    iconName: 'Music',
    description: '♪ 旋律中的回忆',
    category: 'gift',
    affection: 10
  },
  {
    id: 'giftbox',
    name: '礼物盒',
    price: 450,
    iconName: 'Gift',
    description: '惊喜的预感',
    category: 'gift',
    affection: 8
  },
  {
    id: 'accessory',
    name: '发饰',
    price: 280,
    iconName: 'Sparkles',
    description: '让她更可爱',
    category: 'gift',
    affection: 5
  },
  {
    id: 'plushie',
    name: '毛绒玩偶',
    price: 550,
    iconName: 'Package',
    description: '软软的陪伴',
    category: 'gift',
    affection: 7
  },
  {
    id: 'perfume',
    name: '香水',
    price: 700,
    iconName: 'Sparkles',
    description: '淡淡的花香',
    category: 'gift',
    affection: 9
  },

  // ===== 周边 (merch) =====
  {
    id: 'keychain',
    name: '亚克力钥匙扣',
    price: 400,
    iconName: 'ShoppingBag',
    description: '随身携带的羁绊',
    category: 'merch',
    affection: 4
  },
  {
    id: 'poster',
    name: 'B2海报',
    price: 500,
    iconName: 'ShoppingBag',
    description: '墙上的风景',
    category: 'merch',
    affection: 5
  },
  {
    id: 'acoustic_stand',
    name: '立牌',
    price: 600,
    iconName: 'ShoppingBag',
    description: '二次元桌面的她',
    category: 'merch',
    affection: 6
  },
  {
    id: 'tapestry',
    name: '挂画',
    price: 800,
    iconName: 'ShoppingBag',
    description: 'ACG党狂喜',
    category: 'merch',
    affection: 7
  },
  {
    id: 'badge',
    name: '吧唧套装',
    price: 350,
    iconName: 'Award',
    description: '这下全收集了',
    category: 'merch',
    affection: 4
  },

  // ===== 特殊 (special) =====
  {
    id: 'onsen_trip',
    name: '草津温泉旅行券',
    price: 35000, // 一泊二食，合理价格
    iconName: 'Train',
    description: '日本三名泉之一，汤畑的夜晚特别美',
    category: 'special',
    affection: 350,
    limited: true
  },
  {
    id: 'ring',
    name: '戒指',
    price: 350000, // 婚约戒指真实价格带
    iconName: 'Gem',
    description: '轻抚无名指时，想起那天的约定',
    category: 'special',
    affection: 1500,
    limited: true,
    rare: true
  },
  {
    id: 'bracelet',
    name: '手链',
    price: 15000,
    iconName: 'Feather',
    description: '纤细的银链，像某个夏天的风铃声',
    category: 'special',
    affection: 120
  },
  {
    id: 'game_limited',
    name: '限定版Galgame',
    price: 12000,
    iconName: 'Gamepad2',
    description: '特典版，附赠原声带和设定集',
    category: 'special',
    affection: 100
  },

  {
    id: 'camera',
    name: '拍立得',
    price: 16000,
    iconName: 'Camera',
    description: '把日常的瞬间，变成可以触摸的回忆',
    category: 'special',
    affection: 150
  }
]

export const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'drink', label: '饮品' },
  { id: 'food', label: '食物' },
  { id: 'gift', label: '礼物' },
  { id: 'merch', label: '周边' },
  { id: 'special', label: '特殊' }
] as const

export type CategoryId = 'all' | 'drink' | 'food' | 'gift' | 'merch' | 'special'
