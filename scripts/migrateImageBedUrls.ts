/**
 * 把数据库里所有文本字段中旧的图片域名替换为新的图片域名。
 *
 * 用法：
 *   OLD_IMAGE_BED_URL="https://old-minio.example.com" pnpm exec esno scripts/migrateImageBedUrls.ts
 *   确认统计没问题后，再加 --apply 真正写入：
 *   OLD_IMAGE_BED_URL="https://old-minio.example.com" pnpm exec esno scripts/migrateImageBedUrls.ts --apply
 *
 * 新域名默认读取 KUN_VISUAL_NOVEL_IMAGE_BED_URL。
 */
import { prisma } from '~/prisma/index'

const apply = process.argv.includes('--apply')

const normalizeBase = (value: string) => value.trim().replace(/\/+$/, '')

const oldBase = normalizeBase(
  process.env.OLD_IMAGE_BED_URL || process.env.KUN_OLD_IMAGE_BED_URL || ''
)

const getOrigin = (value: string) => {
  try {
    return new URL(value).origin
  } catch {
    return normalizeBase(value)
  }
}

// 默认只替换域名（origin），保留旧 URL 的路径（例如 /kun/...）。
// 如需换路径，额外设置 NEW_IMAGE_BED_URL。
const newBase = normalizeBase(
  process.env.NEW_IMAGE_BED_URL ||
    process.env.NEW_IMAGE_BED_ORIGIN ||
    getOrigin(process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL || '')
)

if (!oldBase || !newBase) {
  console.error(
    '缺少环境变量：OLD_IMAGE_BED_URL（旧图片域名）和 KUN_VISUAL_NOVEL_IMAGE_BED_URL（新图片域名）'
  )
  process.exit(1)
}

if (oldBase === newBase) {
  console.error('旧域名和新域名相同，停止')
  process.exit(1)
}

const quoteIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`

const main = async () => {
  const columns = await prisma.$queryRaw<
    Array<{ table_name: string; column_name: string }>
  >`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying')
      AND table_name <> '_prisma_migrations'
    ORDER BY table_name, column_name
  `

  let totalRows = 0
  let matchedColumns = 0

  for (const { table_name: table, column_name: column } of columns) {
    const tableSql = quoteIdentifier(table)
    const columnSql = quoteIdentifier(column)
    const pattern = `%${oldBase}%`

    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*)::bigint AS count FROM ${tableSql} WHERE ${columnSql} LIKE $1`,
      pattern
    )
    const count = Number(rows[0]?.count ?? 0)

    if (count === 0) {
      continue
    }

    matchedColumns += 1
    totalRows += count
    console.log(`${apply ? '更新' : '待更新'} ${table}.${column}: ${count} 行`)

    if (apply) {
      await prisma.$executeRawUnsafe(
        `UPDATE ${tableSql} SET ${columnSql} = replace(${columnSql}, $1, $2) WHERE ${columnSql} LIKE $3`,
        oldBase,
        newBase,
        pattern
      )
    }
  }

  console.log('---')
  console.log(`旧域名: ${oldBase}`)
  console.log(`新域名: ${newBase}`)
  console.log(`涉及字段: ${matchedColumns}`)
  console.log(`涉及行数: ${totalRows}`)
  console.log(
    apply
      ? '已执行更新。请构建/重启应用，并检查图片 URL。'
      : '当前是 dry-run，确认后加 --apply 执行更新。'
  )
}

main()
  .catch((error) => {
    console.error('迁移失败:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
