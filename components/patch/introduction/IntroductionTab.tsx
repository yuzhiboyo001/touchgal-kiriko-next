'use client'

import { useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Card, CardBody } from '@heroui/card'
import { List, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Info } from './Info'
import { PatchTag } from './Tag'
import { PatchCompany } from './Company'
import { SupportOriginal } from './SupportOriginal'
import {
  SAFE_MEDIA_PROTOCOLS,
  getHttpUrlHostname,
  isHostnameExcluded,
  isRedirectableUrl,
  sanitizeUserHref,
  sanitizeUserUrl
} from '~/utils/safeUrl'
import { useUserStore } from '~/store/userStore'
import type { PatchCapabilities, PatchIntroduction } from '~/types/api/patch'

import './_adjust.scss'

const KunPlyr = dynamic(
  () =>
    import('~/components/kun/milkdown/plugins/components/video/Plyr').then(
      (mod) => mod.KunPlyr
    ),
  { ssr: false }
)

type ExternalLinkNavigation = {
  href: string
  shouldOpenExternal: boolean
}

const getExternalLinkNavigation = (
  href: string
): ExternalLinkNavigation | null => {
  const safeHref = sanitizeUserHref(href)
  if (!safeHref) {
    return null
  }

  const { enableRedirect, excludedDomains } = useUserStore.getState().user
  const hostname = getHttpUrlHostname(safeHref)
  const isExcludedDomain = hostname
    ? isHostnameExcluded(hostname, excludedDomains)
    : false
  const shouldRedirect =
    !isExcludedDomain && enableRedirect && isRedirectableUrl(safeHref)

  return {
    href: shouldRedirect
      ? `/redirect?url=${encodeURIComponent(safeHref)}`
      : safeHref,
    shouldOpenExternal: !enableRedirect && isRedirectableUrl(safeHref)
  }
}

const getClosestVideoPlayer = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return null
  }

  const element = target.closest('[data-video-player]')
  return element instanceof HTMLElement ? element : null
}

const getClosestExternalLink = (
  target: EventTarget | null,
  content: HTMLElement
) => {
  if (!(target instanceof Element)) {
    return null
  }

  const anchor = target.closest('a[data-kun-external-link]')
  return anchor instanceof HTMLAnchorElement && content.contains(anchor)
    ? anchor
    : null
}

const scheduleRootUnmount = (root: Root) => {
  window.setTimeout(() => {
    root.unmount()
  }, 0)
}

const SECTION_LABEL_EN: Record<string, string> = {
  游戏背景: 'BACKGROUND',
  游戏目标: 'OBJECTIVE',
  游戏简介: 'OVERVIEW',
  游戏故事: 'STORY',
  游戏内容: 'CONTENT',
  游戏玩法: 'GAMEPLAY',
  故事简介: 'STORY',
  角色介绍: 'CHARACTERS',
  H场景: 'H SCENES',
  其他要素: 'OTHERS',
  游戏截图: 'SCREENSHOTS',
  游戏信息: 'INFO',
  相关内容: 'RELATED',
  世界观: 'WORLD'
}

const splitSectionLabel = (value: string) => {
  const [label, custom] = value.split(/\s*[|｜]\s*/, 2)
  return {
    label: label.trim(),
    custom: custom?.trim()
  }
}

type TocItem = {
  id: string
  number: string
  title: string
  english?: string
}

const GameToc = ({
  items,
  activeId
}: {
  items: TocItem[]
  activeId: string
}) => {
  if (items.length < 2) return null

  return (
    <aside className="kun-game-toc" aria-label="游戏详情目录">
      <div className="kun-game-toc-scroll">
        <p className="kun-game-toc-heading">目录</p>
        <ol className="kun-game-toc-list">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="kun-game-toc-link"
                data-active={activeId === item.id}
                aria-current={activeId === item.id ? 'location' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <span className="kun-game-toc-number">{item.number}</span>
                <span className="kun-game-toc-text">
                  <span>{item.title}</span>
                  {item.english && (
                    <span className="kun-game-toc-english">{item.english}</span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}

const MobileGameToc = ({
  items,
  activeId,
  visible
}: {
  items: TocItem[]
  activeId: string
  visible: boolean
}) => {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      setOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    const list = listRef.current
    if (!open || !list || !activeId) return

    const active = list.querySelector<HTMLElement>(
      `[data-toc-id="${activeId}"]`
    )
    if (!active) return

    const listRect = list.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    const target =
      list.scrollTop +
      activeRect.top -
      listRect.top -
      (list.clientHeight - activeRect.height) / 2
    list.scrollTo({
      top: Math.max(0, target),
      behavior: 'smooth'
    })
  }, [activeId, open])

  if (items.length < 2) return null

  return (
    <>
      {visible && !open && (
        <button
          ref={buttonRef}
          type="button"
          aria-label="打开游戏目录"
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="fixed right-3 top-16 z-30 flex h-10 items-center gap-1 rounded-full border border-pink-200/60 bg-background/90 px-3 text-xs text-default-600 shadow-[0_8px_24px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:border-pink-400/15 dark:text-default-300 md:hidden"
        >
          <List className="size-3.5" />
          目录
        </button>
      )}

      {visible && open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="游戏目录"
          className="fixed right-3 top-16 z-40 w-[260px] max-w-[calc(100vw-24px)] origin-top-right overflow-hidden rounded-[20px] border border-pink-200/70 bg-[#fff9fb]/95 shadow-[0_16px_44px_rgba(0,0,0,0.16)] backdrop-blur-xl dark:border-pink-400/15 dark:bg-[#1c1917]/95 md:hidden"
        >
          <div className="flex items-center justify-between border-b border-pink-100/80 px-4 py-3 dark:border-white/10">
            <p className="text-xs font-semibold tracking-[0.16em] text-pink-700 dark:text-pink-300">
              目录
            </p>
            <button
              type="button"
              aria-label="关闭游戏目录"
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-full text-default-400 transition-colors active:bg-pink-100/70 dark:active:bg-white/5"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <ol
            ref={listRef}
            className="max-h-[60vh] space-y-0.5 overflow-y-auto p-2"
          >
            {items.map((item) => {
              const active = activeId === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    data-toc-id={item.id}
                    aria-current={active ? 'location' : undefined}
                    onClick={() => {
                      setOpen(false)
                      document.getElementById(item.id)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      })
                    }}
                    className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition-colors ${
                      active
                        ? 'bg-pink-100/80 text-pink-700 dark:bg-pink-400/10 dark:text-pink-300'
                        : 'text-default-600 active:bg-default-100 dark:text-default-300 dark:active:bg-white/5'
                    }`}
                  >
                    <span
                      className={`pt-0.5 text-[10px] tabular-nums ${
                        active
                          ? 'text-pink-500 dark:text-pink-300'
                          : 'text-default-400'
                      }`}
                    >
                      {item.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] leading-5">
                        {item.title}
                      </span>
                      {item.english && (
                        <span
                          className={`mt-0.5 block text-[9px] uppercase tracking-[0.12em] ${
                            active
                              ? 'text-pink-400/80 dark:text-pink-300/60'
                              : 'text-default-400'
                          }`}
                        >
                          {item.english}
                        </span>
                      )}
                    </span>
                    {active && (
                      <span className="pt-0.5 text-[10px] text-pink-400">
                        ♡
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </>
  )
}

const VideoLoadingPlaceholder = ({ poster }: { poster?: string }) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
    {poster && (
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain opacity-70"
        loading="lazy"
      />
    )}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00b3ff] shadow-lg">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      </div>
    </div>
  </>
)

const LazyKunPlyr = ({
  src,
  poster,
  autoPlay
}: {
  src: string
  poster?: string
  autoPlay: boolean
}) => {
  const [isReady, setIsReady] = useState(false)

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-zinc-950">
      {!isReady && <VideoLoadingPlaceholder poster={poster} />}
      <div
        className={`absolute inset-0 [&_.plyr]:h-full [&_.plyr]:w-full [&_.plyr__video-wrapper]:h-full [&_.plyr__poster]:!bg-contain [&_.plyr__poster]:!bg-center [&_video]:h-full [&_video]:w-full [&_video]:!object-contain [&_video]:object-center ${
          isReady ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <KunPlyr
          src={src}
          poster={poster}
          className="h-full w-full object-contain object-center"
          autoPlay={autoPlay}
          onReady={() => setIsReady(true)}
        />
      </div>
    </div>
  )
}

interface Props {
  intro: PatchIntroduction
  patchId: number
  uid?: number
  capabilities: PatchCapabilities
}

export const IntroductionTab = ({
  intro,
  patchId,
  uid,
  capabilities
}: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeSectionId, setActiveSectionId] = useState('')
  const [showMobileToc, setShowMobileToc] = useState(false)

  useEffect(() => {
    const content = contentRef.current
    if (!content) {
      return
    }

    const decorated: HTMLSpanElement[] = []
    const labelContainers: HTMLElement[] = []
    const originalLabels: Array<{
      node: Element
      text: string
    }> = []

    content
      .querySelectorAll<HTMLElement>(
        'blockquote > p > strong:only-child, h2, h3, h4'
      )
      .forEach((node) => {
        const rawLabel = node.textContent?.trim() || ''
        if (!rawLabel) return
        // Character bullets such as `・伊莱莎` are not section labels.
        if (!/^H[234]$/.test(node.tagName) && /^[・·•-]/.test(rawLabel)) {
          return
        }

        const isHeading = /^H[234]$/.test(node.tagName)
        const { label, custom } = splitSectionLabel(rawLabel)
        const english = custom || SECTION_LABEL_EN[label]
        const container = isHeading ? node : node.closest('blockquote')
        if (!container) return

        container.classList.add(
          isHeading ? 'kun-section-heading' : 'kun-section-label'
        )
        labelContainers.push(container)

        if (
          !english ||
          node.nextElementSibling?.classList.contains('kun-section-label-en')
        ) {
          return
        }

        if (custom) {
          originalLabels.push({ node, text: rawLabel })
          node.textContent = label
        }

        const span = document.createElement('span')
        span.className = `kun-section-label-en${custom ? ' is-custom' : ''}`
        span.textContent = english
        node.insertAdjacentElement('afterend', span)
        decorated.push(span)
      })

    return () => {
      decorated.forEach((span) => span.remove())
      originalLabels.forEach(({ node, text }) => {
        node.textContent = text
      })
      labelContainers.forEach((container) =>
        container.classList.remove('kun-section-label', 'kun-section-heading')
      )
    }
  }, [intro.introduction])

  useEffect(() => {
    const content = contentRef.current
    if (!content) {
      return
    }

    const containers = Array.from(
      content.querySelectorAll<HTMLElement>(
        '.kun-section-label, .kun-section-heading'
      )
    )
    if (containers.length === 0) {
      setTocItems([])
      setActiveSectionId('')
      return
    }

    const numberNodes: HTMLSpanElement[] = []
    const items = containers
      .map((container, index): TocItem | null => {
        const titleNode = container.matches('blockquote')
          ? container.querySelector('strong')
          : container
        const title = titleNode?.textContent?.trim() || ''
        if (!title) {
          return null
        }

        const englishNode =
          container.querySelector('.kun-section-label-en') ||
          (container.nextElementSibling?.classList.contains(
            'kun-section-label-en'
          )
            ? container.nextElementSibling
            : null)
        const english = englishNode?.textContent?.trim()
        const number = String(index + 1).padStart(2, '0')
        const id = `game-section-${index + 1}`
        const numberNode = document.createElement('span')
        numberNode.className = 'kun-section-number'
        numberNode.textContent = number
        numberNode.setAttribute('aria-hidden', 'true')

        if (container.matches('blockquote')) {
          const strong = container.querySelector('strong')
          if (strong) {
            strong.before(numberNode)
          } else {
            container.prepend(numberNode)
          }
        } else {
          container.prepend(numberNode)
        }

        container.id = id
        numberNodes.push(numberNode)

        return {
          id,
          number,
          title,
          english: english || undefined
        }
      })
      .filter((item): item is TocItem => Boolean(item))

    setTocItems(items)
    setActiveSectionId((current) =>
      current && items.some((item) => item.id === current)
        ? current
        : items[0]?.id || ''
    )

    let frame = 0
    const markLongLabels = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        containers.forEach((container) => {
          const titleNode = container.matches('blockquote')
            ? container.querySelector('strong')
            : container
          if (!titleNode) return

          const lineHeight =
            parseFloat(window.getComputedStyle(titleNode).lineHeight) || 0
          const isLong =
            lineHeight > 0 &&
            container.getBoundingClientRect().height > lineHeight * 1.7
          container.classList.toggle('is-long', isLong)
        })
      })
    }

    markLongLabels()
    window.addEventListener('resize', markLongLabels)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', markLongLabels)
      numberNodes.forEach((node) => node.remove())
      containers.forEach((container) => {
        container.classList.remove('is-long')
        container.removeAttribute('id')
      })
    }
  }, [intro.introduction])

  useEffect(() => {
    if (tocItems.length < 2) return

    const sections = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element))
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveSectionId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-140px 0px -55% 0px',
        threshold: [0, 1]
      }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [tocItems])

  useEffect(() => {
    let frame = 0

    const updateVisibility = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const content = contentRef.current
        if (!content) return
        setShowMobileToc(content.getBoundingClientRect().top < 72)
      })
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [intro.introduction])

  useEffect(() => {
    const content = contentRef.current
    if (!content) {
      return
    }

    const videoRoots = new Map<HTMLElement, Root>()

    const mountVideoPlayer = (element: HTMLElement) => {
      if (
        !content.contains(element) ||
        element.hasAttribute('data-video-loaded')
      ) {
        return
      }

      const src = element.getAttribute('data-src')
      const safeSrc = src ? sanitizeUserUrl(src, SAFE_MEDIA_PROTOCOLS) : null
      if (!safeSrc) {
        return
      }

      const poster = element.getAttribute('data-poster')
      const safePoster = poster
        ? sanitizeUserUrl(poster, SAFE_MEDIA_PROTOCOLS)
        : null

      const rootElement = document.createElement('div')
      rootElement.className = 'w-full'
      element.setAttribute('data-video-loaded', '')
      element.removeAttribute('role')
      element.removeAttribute('tabindex')
      element.replaceChildren(rootElement)

      const root = createRoot(rootElement)
      videoRoots.set(element, root)
      root.render(
        <LazyKunPlyr src={safeSrc} poster={safePoster ?? undefined} autoPlay />
      )
    }

    const applyExternalLinkNavigation = (anchor: HTMLAnchorElement) => {
      const href =
        anchor.getAttribute('data-href') || anchor.getAttribute('href')
      const navigation = href ? getExternalLinkNavigation(href) : null
      if (!navigation) {
        anchor.removeAttribute('href')
        anchor.removeAttribute('target')
        anchor.removeAttribute('rel')
        return false
      }

      anchor.setAttribute('href', navigation.href)
      if (navigation.shouldOpenExternal) {
        anchor.setAttribute('target', '_blank')
        anchor.setAttribute('rel', 'noopener noreferrer')
      } else {
        anchor.removeAttribute('target')
        anchor.removeAttribute('rel')
      }

      return true
    }

    const handleExternalLinkPrepare = (event: Event) => {
      const anchor = getClosestExternalLink(event.target, content)
      if (anchor) {
        applyExternalLinkNavigation(anchor)
      }
    }

    const handleExternalLinkClick = (event: MouseEvent) => {
      const anchor = getClosestExternalLink(event.target, content)
      if (anchor && !applyExternalLinkNavigation(anchor)) {
        event.preventDefault()
      }
    }

    const handleVideoClick = (event: MouseEvent) => {
      const element = getClosestVideoPlayer(event.target)
      if (element) {
        mountVideoPlayer(element)
      }
    }

    const handleVideoKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return
      }

      const element = getClosestVideoPlayer(event.target)
      if (!element || element.hasAttribute('data-video-loaded')) {
        return
      }

      event.preventDefault()
      mountVideoPlayer(element)
    }

    content.addEventListener('pointerdown', handleExternalLinkPrepare)
    content.addEventListener('contextmenu', handleExternalLinkPrepare)
    content.addEventListener('focusin', handleExternalLinkPrepare)
    content.addEventListener('click', handleExternalLinkClick)
    content.addEventListener('click', handleVideoClick)
    content.addEventListener('keydown', handleVideoKeyDown)

    return () => {
      content.removeEventListener('pointerdown', handleExternalLinkPrepare)
      content.removeEventListener('contextmenu', handleExternalLinkPrepare)
      content.removeEventListener('focusin', handleExternalLinkPrepare)
      content.removeEventListener('click', handleExternalLinkClick)
      content.removeEventListener('click', handleVideoClick)
      content.removeEventListener('keydown', handleVideoKeyDown)
      videoRoots.forEach(scheduleRootUnmount)
      videoRoots.clear()
    }
  }, [intro.introduction])

  return (
    <>
      <Card className="bg-white/95 dark:bg-black/55 rounded-3xl border border-white/50 dark:border-white/5 p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <CardBody className="p-0 space-y-6">
          <div
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: intro.introduction }}
            className="kun-prose kun-game-intro max-w-none"
          />

          {/* <div className="mt-4">
          <h3 className="mb-4 text-xl font-medium">游戏制作商</h3>
        </div> */}

          <SupportOriginal
            dlsiteCode={intro.dlsiteCode ?? ''}
            companies={intro.company}
          />

          {uid && (
            <PatchTag
              patchId={patchId}
              initialTags={intro.tag}
              canManage={capabilities.canManageTags}
            />
          )}

          <PatchCompany
            patchId={patchId}
            initialCompanies={intro.company}
            vndbId={intro.vndbId}
            canManage={capabilities.canManageCompanies}
          />

          <Info intro={intro} />
        </CardBody>
      </Card>
      <GameToc items={tocItems} activeId={activeSectionId} />
      <MobileGameToc
        key={showMobileToc ? 'toc-visible' : 'toc-hidden'}
        items={tocItems}
        activeId={activeSectionId}
        visible={showMobileToc}
      />
    </>
  )
}
