// app/layout.tsx

import { Toaster } from 'react-hot-toast'
import { Suspense } from 'react'
import { Providers } from './providers'
import { KunTopBar } from '~/components/kun/top-bar/TopBar'
import { KunTopBarSession } from '~/components/kun/top-bar/TopBarSession'
import { KunFooter } from '~/components/kun/Footer'
import { KunNavigationBreadcrumb } from '~/components/kun/NavigationBreadcrumb'
import { generateKunMetadata, kunViewport } from './metadata'
import { KunBackToTop } from '~/components/kun/BackToTop'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { preconnect, prefetchDNS } from 'react-dom'
import type { Metadata, Viewport } from 'next'
import '~/styles/index.css'
import './actions'
import { KirikoStandee } from '~/components/kun/KirikoStandee'
import { StaticSakura } from '~/components/effects/StaticSakura'
import { KunJsonLd } from '~/components/kun/KunJsonLd'
import { DailyTask } from '~/components/effects/daily-task'
import { MobileBottomNav } from '~/components/kun/top-bar/MobileBottomNav'
export const viewport: Viewport = kunViewport
export const metadata: Metadata = generateKunMetadata()

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  preconnect(kunMoyuMoe.domain.imageBed)
  prefetchDNS(kunMoyuMoe.domain.imageBed)

  return (
    <html lang="zh-Hans" suppressHydrationWarning>
      {process.env.NODE_ENV !== 'production' &&
        process.env.KUN_VISUAL_NOVEL_TEST_SITE_LABEL && (
          <head>
            <meta name="robots" content="noindex,nofollow" />
            <meta name="googlebot" content="noindex,nofollow" />
          </head>
        )}

      <body>
        <KunJsonLd />
        <Providers>
          <div
            className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground"
            style={{
              minHeight: '100vh',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <StaticSakura
              count={24}
              minSize={30}
              maxSize={100}
              minOpacity={0.08}
              maxOpacity={0.12}
              color="#ffb7c5"
              showWashi={true}
              showGlow={true}
              opacity={0.12}
            />

            <div className="w-full">
              <Suspense
                fallback={
                  <KunTopBar initialSession={null} sessionStatus="pending" />
                }
              >
                <KunTopBarSession />
              </Suspense>
            </div>

            <div className="w-full">
              <KunNavigationBreadcrumb />
            </div>

            <div className="flex min-h-[calc(100dvh-256px)] w-full max-w-7xl grow px-3 pb-20 sm:px-6 sm:pb-0">
              {children}
              <Toaster />
            </div>

            <div className="w-full">
              <KunBackToTop />
            </div>

            <div className="w-full pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
              <KunFooter />
            </div>
            <KirikoStandee />
            <MobileBottomNav />
          </div>
        </Providers>
      </body>
    </html>
  )
}
