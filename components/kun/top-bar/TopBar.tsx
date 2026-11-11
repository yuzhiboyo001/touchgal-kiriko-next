'use client'

import { useEffect, useState } from 'react'
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle
} from '@heroui/navbar'
import Link from 'next/link'
import { KunTopBarBrand } from './Brand'
import { KunTopBarUser } from './User'
import { usePathname } from 'next/navigation'
import { kunNavItem } from '~/constants/top-bar'
import { KunMobileMenu } from './KunMobileMenu'
import type { SessionStatus, UserSession } from '~/types/api/session'

interface Props {
  initialSession: UserSession | null
  sessionStatus?: SessionStatus
}

export const KunTopBar = ({ initialSession, sessionStatus }: Props) => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMenuOpen(false), 0)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <Navbar
      maxWidth="xl"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      classNames={{ wrapper: 'px-3 sm:px-6' }}
    >
      <NavbarContent className="sm:hidden" justify="start">
        <li className="h-full">
          <NavbarMenuToggle />
        </li>
      </NavbarContent>

      <div className="flex items-center gap-2">
        {/* ===== Logo 区域 - 保持品牌样式，不做成按钮 ===== */}
        <KunTopBarBrand />

        {/* ===== 导航链接 - 统一粉色贴纸 ===== */}
        <NavbarContent className="hidden gap-4 sm:flex">
          {kunNavItem.map((item) => (
            <NavbarItem key={item.href} isActive={pathname === item.href}>
              <Link
                className="gal-sticker gal-sticker-pink flex flex-col items-center"
                href={item.href}
                style={{
                  // ===== 按钮整体尺寸 =====
                  paddingLeft: '28px', // 左右内边距（默认 32px，调大按钮变宽）
                  paddingRight: '28px', // 左右内边距
                  paddingTop: '8px', // 上下内边距（默认 12px，调大按钮变高）
                  paddingBottom: '8px', // 上下内边距
                  minWidth: '80px', // 最小宽度（可选）
                  minHeight: '30px', // 最小高度（可选）

                  // ===== 圆角 =====
                  borderRadius: '17px', // 圆角大小（默认 16px）

                  // ===== 间距 =====
                  gap: '2px' // 日文和中文之间的间距
                }}
              >
                {/* 日文（小字） */}
                <span
                  className="font-ja-maru text-[9px] opacity-80 tracking-wider"
                  style={{
                    fontSize: '10px', // ← 日文字体大小
                    letterSpacing: '0.2em', // ← 日文字距
                    opacity: 0.7 // ← 日文透明度
                  }}
                >
                  {item.ja}
                </span>

                {/* 中文（大字） */}
                <span
                  className="text-[13px] opacity-100 tracking-wider"
                  style={{
                    fontSize: '13px', // ← 中文字体大小
                    letterSpacing: '0.2em', // ← 中文字距
                    fontWeight: 500 // ← 中文粗细
                  }}
                >
                  {item.name}
                </span>
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      </div>

      <KunTopBarUser
        initialSession={initialSession}
        initialSessionStatus={sessionStatus}
      />

      <KunMobileMenu />
    </Navbar>
  )
}
