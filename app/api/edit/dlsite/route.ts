// /api/edit/dlsite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { canRoleUseFeature } from '~/lib/featureAccess'
import { uploadIntroductionImage } from '~/app/api/user/image/_upload'
import { fetchWithTimeout } from '~/lib/fetchWithTimeout'
import { fetchDlsiteData } from '../dlsite'

const dlsiteSchema = z.object({
  code: z.string().regex(/^(RJ|VJ)\d+$/i, 'DLSite Code 格式不正确'),
  uploadImages: z.boolean().optional()
})

const DLSITE_IMAGE_HOST = 'img.dlsite.jp'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const isAllowedImageUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === DLSITE_IMAGE_HOST
  } catch {
    return false
  }
}

const downloadImage = async (url: string) => {
  if (!isAllowedImageUrl(url)) {
    return null
  }

  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Referer: 'https://www.dlsite.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    },
    30_000
  )

  if (!response.ok) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/')) {
    return null
  }

  const length = Number(response.headers.get('content-length') || 0)
  if (length > MAX_IMAGE_BYTES) {
    return null
  }

  const buffer = await response.arrayBuffer()
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    return null
  }

  return buffer
}

const IMAGE_UPLOAD_CONCURRENCY = 3
const IMAGE_DEBUG = process.env.DLSITE_IMAGE_DEBUG === 'true'

const uploadDlsiteImages = async (
  descriptionMd: string,
  images: { token: string; url: string }[],
  uid: number
) => {
  const imageBedUrl = process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL

  if (!imageBedUrl) {
    return descriptionMd
  }

  const replacements = new Map<string, string>()
  let cursor = 0

  const worker = async () => {
    while (cursor < images.length) {
      const index = cursor++
      const { token, url } = images[index]
      if (!descriptionMd.includes(token)) {
        continue
      }

      try {
        const startedAt = performance.now()
        const buffer = await downloadImage(url)
        const downloadedAt = performance.now()

        if (!buffer) {
          console.warn(`[dlsite] 图片下载失败，保留原图: ${url}`)
          replacements.set(token, url)
          continue
        }

        const name = `${uid}-${Date.now()}-${index}`
        const result = await uploadIntroductionImage(name, buffer, uid)
        if (typeof result === 'string') {
          console.warn(`[dlsite] 图片上传失败: ${result}`)
          replacements.set(token, url)
          continue
        }

        replacements.set(
          token,
          `${imageBedUrl}/user/image/${uid}/${name}.${result.extension}`
        )

        if (IMAGE_DEBUG) {
          const finishedAt = performance.now()
          console.log(
            `[dlsite] img ${index + 1}/${images.length} download=${(
              downloadedAt - startedAt
            ).toFixed(0)}ms sharp+upload=${(finishedAt - downloadedAt).toFixed(
              0
            )}ms`
          )
        }
      } catch (error) {
        console.warn(`[dlsite] 图片处理异常: ${url}`, error)
        replacements.set(token, url)
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(IMAGE_UPLOAD_CONCURRENCY, images.length) },
      () => worker()
    )
  )

  let markdown = descriptionMd
  for (const { token, url } of images) {
    // Angle brackets keep URLs containing parentheses safe in Markdown.
    const imageUrl = replacements.get(token) ?? url
    markdown = markdown.replace(token, `![](<${imageUrl}>)`)
  }

  // DeepSeek 误删占位符时，把缺失图片追加到文末，避免整段丢图
  const missing = images.filter(({ token }) => !descriptionMd.includes(token))
  if (missing.length) {
    markdown += '\n\n' + missing.map(({ url }) => `![](<${url}>)`).join('\n\n')
  }

  return markdown
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, dlsiteSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (!(await canRoleUseFeature('dlsiteImport', payload.role))) {
    return NextResponse.json('当前仅超级管理员可使用 DLsite 爬虫')
  }

  try {
    const data = await fetchDlsiteData(input.code)

    // Python 只返回封面 URL；主站负责下载，前端再交给裁剪器。
    // 不在这里上传 R2，封面的 R2 落库仍然走正常发布流程。
    if (data.cover_url) {
      const coverBuffer = await downloadImage(data.cover_url)
      if (coverBuffer) {
        data.cover_data_url = `data:image/webp;base64,${Buffer.from(
          coverBuffer
        ).toString('base64')}`
      }
    }

    if (input.uploadImages) {
      if (IMAGE_DEBUG) {
        console.log(
          `[dlsite] uploadImages=true images=${data.images?.length ?? 0} uid=${payload.uid}`
        )
      }

      if (data.description_md && data.images?.length) {
        data.description_md = await uploadDlsiteImages(
          data.description_md,
          data.images,
          payload.uid
        )
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json('DLSite API 请求失败, 请稍后重试')
  }
}
