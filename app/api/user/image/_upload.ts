import sharp from 'sharp'

import { uploadImageToS3 } from '~/lib/s3'
import { checkBufferSize } from '~/app/api/utils/checkBufferSize'

sharp.concurrency(1)

const createSharp = (image: ArrayBuffer) =>
  sharp(Buffer.from(image), {
    limitInputPixels: 40_000_000,
    failOn: 'error',
    sequentialRead: true
  })

export const uploadIntroductionImage = async (
  name: string,
  image: ArrayBuffer,
  uid: number
) => {
  if (image.byteLength === 0) {
    return '上传文件不能为空'
  }

  const metadata = await createSharp(image).metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  const isLongImage = height > width * 1.2

  // 长图保留原始高度；普通简介图按普通横图处理
  const maxHeight = isLongImage ? 8000 : 1080
  const maxSizeMb = isLongImage ? 6 : 2
  const qualities = isLongImage ? [82, 76, 70] : [70, 64, 58]
  const extension = isLongImage ? 'webp' : 'avif'

  let minImage: Buffer | undefined
  for (const quality of qualities) {
    const pipeline = createSharp(image).resize(1920, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })

    minImage = isLongImage
      ? await pipeline
          .webp({
            quality,
            // 长图文字多，smartSubsample 能减少文字边缘发糊
            smartSubsample: true,
            effort: 6
          })
          .toBuffer()
      : await pipeline
          .avif({
            quality,
            effort: 4,
            chromaSubsampling: '4:2:0'
          })
          .toBuffer()

    if (checkBufferSize(minImage, maxSizeMb)) {
      break
    }
  }

  if (!minImage || !checkBufferSize(minImage, maxSizeMb)) {
    return '图片体积过大'
  }

  const s3Key = `user/image/${uid}/${name}.${extension}`

  await uploadImageToS3(
    s3Key,
    minImage,
    isLongImage ? 'image/webp' : 'image/avif',
    'public, max-age=31536000, immutable'
  )

  return { extension }
}
