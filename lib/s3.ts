import { createReadStream } from 'fs'
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'

const getContentType = (key: string) => {
  const lowerKey = key.toLowerCase()

  if (lowerKey.endsWith('.avif')) return 'image/avif'
  if (lowerKey.endsWith('.webp')) return 'image/webp'
  if (lowerKey.endsWith('.png')) return 'image/png'
  if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg')) {
    return 'image/jpeg'
  }
  if (lowerKey.endsWith('.gif')) return 'image/gif'
  if (lowerKey.endsWith('.svg')) return 'image/svg+xml'

  return 'application/octet-stream'
}

export const s3 = new S3Client({
  endpoint: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_ENDPOINT!,
  region: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_REGION!,
  credentials: {
    accessKeyId: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_SECRET_ACCESS_KEY!
  },
  // MinIO 通常需要 path-style；R2 默认 virtual-hosted-style。
  // 如 R2 访问异常，可在 .env 设置 KUN_S3_FORCE_PATH_STYLE=true 再试。
  forcePathStyle: process.env.KUN_S3_FORCE_PATH_STYLE === 'true',
  requestChecksumCalculation: 'WHEN_REQUIRED'
})

const Bucket = process.env.KUN_VISUAL_NOVEL_S3_STORAGE_BUCKET_NAME!
const KeyPrefix = process.env.KUN_VISUAL_NOVEL_S3_KEY_PREFIX ?? ''

const withKeyPrefix = (key: string) => `${KeyPrefix}${key.replace(/^\/+/, '')}`

export const uploadVideoToS3 = async (
  filePath: string,
  fileName: string,
  mimeType: string,
  uniqueId: string
) => {
  const fileStream = createReadStream(filePath)

  const bucketName = withKeyPrefix(
    `touchgal/galgame/${uniqueId}/video/${fileName}`
  )

  const uploadCommand = new PutObjectCommand({
    Bucket,
    Key: bucketName,
    Body: fileStream,
    ContentType: mimeType,
    // 视频/封面可能覆盖同名 key，1 天缓存更安全
    CacheControl: 'public, max-age=86400'
  })
  await s3.send(uploadCommand)
}

export const uploadImageToS3 = async (
  key: string,
  fileBuffer: Buffer,
  contentType = getContentType(key),
  cacheControl = 'public, max-age=86400'
) => {
  const uploadCommand = new PutObjectCommand({
    Bucket,
    Key: withKeyPrefix(key),
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: cacheControl,
    ContentDisposition: 'inline'
  })
  await s3.send(uploadCommand)
}

export const deleteFileFromS3 = async (key: string) => {
  const deleteCommand = new DeleteObjectCommand({
    Bucket,
    Key: withKeyPrefix(key)
  })
  await s3.send(deleteCommand)
}

export const deletePrefixFromS3 = async (prefix: string) => {
  const fullPrefix = withKeyPrefix(prefix)
  let continuationToken: string | undefined

  do {
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken
      })
    )

    const keys = (listed.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key))

    if (keys.length > 0) {
      const result = await s3.send(
        new DeleteObjectsCommand({
          Bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true
          }
        })
      )
      if (result.Errors?.length) {
        console.error('删除 R2 前缀对象部分失败:', result.Errors)
      }
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined
  } while (continuationToken)
}
