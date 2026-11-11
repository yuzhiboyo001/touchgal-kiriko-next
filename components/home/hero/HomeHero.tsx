// components/home/HomeHero.tsx
// （假设路径，你按实际改）

import { Card, CardBody } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Sparkles } from 'lucide-react'
import { KunCarousel } from '../carousel/KunCarousel'
import { getKunPosts } from '../carousel/mdx'
import { RandomGalgameButton } from '../carousel/RandomGalgameButton'
import { Twitter } from '~/components/kun/icons/Twitter'
import { KunHomeNavigationItems } from '../NavigationItems'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { getServerUserSession } from '~/app/api/user/session/service'

export const HomeHero = async () => {
  const initialSession = await getServerUserSession()
  const posts = getKunPosts()

  return (
    <div className="w-full mx-auto">
      <div className="grid min-h-0 grid-cols-1 gap-0 sm:min-h-75 sm:grid-cols-2 sm:gap-6">
        <div className="flex-col justify-center hidden space-y-2 sm:flex sm:space-y-6">
          <Card
            className="h-full border-none bg-transparent"
            style={{
              backgroundImage:
                'linear-gradient(to bottom right, rgba(236,72,153,0.1), rgba(168,85,247,0.1), rgba(34,197,94,0.1))'
            }}
          >
            <CardBody className="flex justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <Chip
                  variant="flat"
                  className="bg-pink-500/10 border border-pink-400/20 text-pink-500 px-4 py-2 rounded-full font-ja-maru tracking-wider"
                >
                  欢迎来到 Kiriko
                </Chip>
              </div>

              <div className="space-y-3">
                {' '}
                {/* 稍微缩小一点上下间距 */}
                <h1 className="py-1 text-3xl font-bold text-transparent xl:text-4xl bg-linear-to-r from-primary-500 to-secondary-500 bg-clip-text">
                  Kiriko — 雾织成梦的地方
                </h1>
                {/* 日文副标题：强制左对齐，稍微缩小字号，降低透明度 */}
                <p
                  className="text-xs sm:text-sm text-default-500/80 font-ja-maru text-left"
                  style={{
                    letterSpacing: '0.25em'
                  }}
                >
                  霧の紡ぐ夢の庭、時を超えて咲く花
                </p>
              </div>

              <div className="flex items-center gap-2">
                <RandomGalgameButton
                  className="gal-sticker gal-sticker-pink"
                  color="primary"
                  variant="solid"
                >
                  随机一部游戏
                </RandomGalgameButton>
                <a
                  href="https://x.com/Galgame_gzwz"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="关注 X 频道"
                  title="推特"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-medium bg-secondary/20 text-secondary transition-colors hover:bg-secondary/30"
                >
                  <Twitter />
                </a>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <KunHomeNavigationItems
              buttonSize="lg"
              initialSession={initialSession?.user ?? null}
            />
          </div>
        </div>

        <KunCarousel
          posts={posts}
          initialSession={initialSession?.user ?? null}
        />
      </div>
    </div>
  )
}
