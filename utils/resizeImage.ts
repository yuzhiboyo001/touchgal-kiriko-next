import toast from 'react-hot-toast'
import { dataURItoBlob } from '~/utils/dataURItoBlob'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export const checkImageValid = (file: File) => {
  if (allowedTypes.includes(file.type)) {
    return true
  } else {
    toast.error('我们仅支持 jpg, png, webp, avif 图片')
    return false
  }
}

interface CompressDataURLOptions {
  maxDimension?: number
  quality?: number
  maxSizeBytes?: number
}

export const compressDataURLToWebp = (
  dataUrl: string,
  options: CompressDataURLOptions = {}
): Promise<Blob> => {
  const { maxDimension = 3840, quality = 0.85, maxSizeBytes } = options

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      let width = image.naturalWidth
      let height = image.naturalHeight

      if (width > maxDimension || height > maxDimension) {
        const aspectRatio = width / height
        if (aspectRatio > 1) {
          width = maxDimension
          height = Math.round(maxDimension / aspectRatio)
        } else {
          height = maxDimension
          width = Math.round(maxDimension * aspectRatio)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建 canvas 上下文'))
        return
      }
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('压缩图片为 WebP 失败'))
            return
          }
          if (maxSizeBytes && blob.size > maxSizeBytes) {
            const limitMb = (maxSizeBytes / 1024 / 1024).toFixed(1)
            reject(
              new Error(`压缩后原图体积仍超过 ${limitMb} MB, 请选择更小的图片`)
            )
            return
          }
          resolve(blob)
        },
        'image/webp',
        quality
      )
    }
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = dataUrl
  })
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const MAX_UPLOAD_PIXELS = 40_000_000

/**
 * 上传前只做校验，不重新编码。
 * 缩放和最终格式（长图 WebP / 普通图 AVIF）全部交给服务端 Sharp，
 * 避免浏览器 canvas 有损压缩后再被服务端压缩一次。
 */
export const prepareImageForUpload = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('图片体积不能超过 20MB')
      reject(new Error('Image is too large.'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    const cleanup = () => URL.revokeObjectURL(objectUrl)

    image.onload = () => {
      const pixels = image.naturalWidth * image.naturalHeight
      cleanup()

      if (pixels > MAX_UPLOAD_PIXELS) {
        toast.error('图片像素过大，请压缩后再上传')
        reject(new Error('Image has too many pixels.'))
        return
      }

      resolve(file)
    }

    image.onerror = () => {
      cleanup()
      toast.error('图片加载失败')
      reject(new Error('Image load failed.'))
    }

    image.src = objectUrl
  })
}
