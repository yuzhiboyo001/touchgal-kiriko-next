import sharp from 'sharp'

import { uploadImageToS3 } from '~/lib/s3'
import { checkBufferSize } from '~/app/api/utils/checkBufferSize'

// 每个进程只跑 1 个 libvips 任务，避免 4 个 worker 同时编码 AVIF 打满 4 核
sharp.concurrency(1)

const createSharp = (image: ArrayBuffer) =>
  sharp(Buffer.from(image), {
    limitInputPixels: 40_000_000,
    failOn: 'error',
    sequentialRead: true
  })

export const uploadPatchBanner = async (
  image: ArrayBuffer,
  id: number,
  originalImage?: ArrayBuffer
) => {
  if (image.byteLength === 0) {
    return '上传文件不能为空'
  }
  if (originalImage && originalImage.byteLength === 0) {
    return '上传文件不能为空'
  }

  const banner = await createSharp(image)
    .resize(1920, 1080, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: 60 })
    .toBuffer()
  const miniBanner = await createSharp(image)
    .resize(460, 259, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: 60 })
    .toBuffer()

  if (!checkBufferSize(miniBanner, 1.007)) {
    return '图片体积过大'
  }

  const bucketName = `patch/${id}/banner`

  const uploadTasks = [
    uploadImageToS3(`${bucketName}/banner.avif`, banner),
    uploadImageToS3(`${bucketName}/banner-mini.avif`, miniBanner)
  ]

  if (originalImage) {
    uploadTasks.push(
      createSharp(originalImage)
        .avif({ quality: 60 })
        .toBuffer()
        .then((fullBanner) =>
          uploadImageToS3(`${bucketName}/banner-full.avif`, fullBanner)
        )
    )
  }

  await Promise.all(uploadTasks)
}
