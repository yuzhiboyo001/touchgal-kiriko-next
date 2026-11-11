// components/home/NavigationItems.tsx
'use client'

import { Button, Link } from '@heroui/react'
import { homeNavigationItems } from '~/constants/home'
import type { UserState } from '~/store/userStore'

interface Props {
  buttonSize: 'sm' | 'md' | 'lg'
  initialSession?: UserState | null
}

// PC端的原始内联样式，完美保留
const buttonStyle = {
  paddingTop: '10px',
  paddingBottom: '10px',
  paddingLeft: '16px',
  paddingRight: '16px',
  minHeight: '56px',
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px'
}

export const KunHomeNavigationItems = ({ buttonSize }: Props) => {
  return (
    <>
      {homeNavigationItems.map((item) => {
        const isTag = item.label === '标签'
        const className = `w-full shadow-md opacity-70 gal-sticker gal-sticker-pink ${
          isTag ? 'text-primary' : ''
        }`

        const innerContent = (
          <>
            <item.icon className="w-5 h-5 shrink-0 text-current" />
            <div
              className="flex flex-col items-center justify-center"
              style={{ gap: '5px', lineHeight: 1.2 }}
            >
              <span
                className="font-ja-maru tracking-wider leading-none"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  opacity: 0.7
                }}
              >
                {item.ja}
              </span>
              <span
                className="opacity-70 tracking-wider leading-none mt-0.5"
                style={{
                  fontSize: '15px',
                  fontWeight: 500
                }}
              >
                {item.label}
              </span>
            </div>
          </>
        )

        return (
          <Button
            key={item.label}
            as={Link}
            href={item.href}
            className={className}
            color={item.color}
            variant="flat"
            size={buttonSize}
            isExternal={item.isExternal}
            style={buttonStyle}
          >
            {innerContent}
          </Button>
        )
      })}
    </>
  )
}
