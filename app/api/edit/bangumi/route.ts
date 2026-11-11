import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { BANGUMI_API_BASE, getBangumiHeaders } from '~/constants/bangumi'
import { lowQualityTags } from '~/lib/bgmDirtyTag'
import { proxyFetch } from '~/lib/proxyFetch'

const bangumiSchema = z.object({
  bangumiId: z.string().regex(/^\d+$/, 'Bangumi ID 必须为纯数字')
})

interface BangumiTag {
  name: string
  count: number
}

interface BangumiInfoboxItem {
  key: string
  value: string | { v: string }[]
}

interface BangumiSubject {
  name?: string
  name_cn?: string
  tags?: BangumiTag[]
  infobox?: BangumiInfoboxItem[]
}

const dirtyTagSet = new Set(lowQualityTags)

const DEVELOPER_KEYS = new Set([
  '开发',
  '游戏开发商',
  '开发商',
  '发行',
  '发行商',
  '制作',
  '製作'
])

const splitByJapaneseSeparator = (name: string): string[] =>
  name
    .split('、')
    .map((s) => s.trim())
    .filter(Boolean)

const extractDevelopers = (infobox?: BangumiInfoboxItem[]): string[] => {
  if (!infobox) return []
  const names: string[] = []
  for (const item of infobox) {
    if (!DEVELOPER_KEYS.has(item.key)) continue
    if (typeof item.value === 'string') {
      names.push(...splitByJapaneseSeparator(item.value))
    } else if (Array.isArray(item.value)) {
      for (const entry of item.value) {
        if (entry.v?.trim()) names.push(...splitByJapaneseSeparator(entry.v))
      }
    }
  }
  return [...new Set(names)]
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, bangumiSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  try {
    const res = await proxyFetch(
      `${BANGUMI_API_BASE}/v0/subjects/${input.bangumiId}`,
      { headers: getBangumiHeaders() }
    )
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300)
      console.error(
        `[bangumi] subject ${input.bangumiId} HTTP ${res.status}: ${detail}`
      )

      if (res.status === 404) {
        return NextResponse.json('未找到该 Bangumi 条目，请检查 ID 是否正确', {
          status: 404
        })
      }
      if (res.status === 429) {
        return NextResponse.json('Bangumi 请求过于频繁，请稍后再试', {
          status: 429
        })
      }

      return NextResponse.json(`Bangumi API 请求失败 (${res.status})`, {
        status: 502
      })
    }

    const data = (await res.json()) as BangumiSubject

    const tags = (data.tags ?? [])
      .filter((t) => !dirtyTagSet.has(t.name))
      .map((t) => t.name)

    const developers = extractDevelopers(data.infobox)

    return NextResponse.json({
      name: data.name ?? '',
      nameCn: data.name_cn ?? '',
      tags,
      developers
    })
  } catch (error) {
    console.error('[bangumi] request failed:', error)
    return NextResponse.json(
      `Bangumi API 请求失败: ${
        error instanceof Error ? error.message : '未知错误'
      }`,
      { status: 502 }
    )
  }
}
