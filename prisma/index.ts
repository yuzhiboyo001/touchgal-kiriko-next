import 'dotenv/config'
import pg from 'pg'
import type { PoolConfig } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const connectionString = `${process.env.KUN_DATABASE_URL}`

const poolConfig: PoolConfig & {
  statement_timeout: number
  query_timeout: number
} = {
  connectionString,
  // 4 个 web worker + 1 个 cron，每个进程 4 条，总峰值约 20 条
  max: 4,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // 防止深分页/坏查询长期占用数据库
  statement_timeout: 10000,
  query_timeout: 10000
}

const pool = new pg.Pool(poolConfig)

const STATEMENT_CACHE_MAX = 1000
const statementNames = new Map<string, string>()
let statementCounter = 0

const statementNameGenerator = (query: { sql: string }) => {
  const cached = statementNames.get(query.sql)
  if (cached !== undefined) return cached
  if (statementNames.size >= STATEMENT_CACHE_MAX) {
    const oldest = statementNames.keys().next().value
    if (oldest !== undefined) statementNames.delete(oldest)
  }
  const name = `s${(statementCounter++).toString(36)}`
  statementNames.set(query.sql, name)
  return name
}

const adapter = new PrismaPg(pool, { statementNameGenerator })
const prisma = new PrismaClient({ adapter })

export { prisma }
