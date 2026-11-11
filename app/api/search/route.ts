import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { searchSchema } from '~/validations/search'
import {
  GalgameCardSelectField,
  toGalgameCardCount
} from '~/constants/api/select'
import { getPatchVisibilityWhere } from '~/app/api/utils/getPatchVisibilityWhere'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'
import { checkRateLimit } from '~/lib/rateLimit'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { setKv } from '~/lib/redis'
import { getTaskEventKey } from '~/server/taskVerification'
import { Prisma } from '~/prisma/generated/prisma/client'
import type { SearchSuggestionType } from '~/types/api/search'
import {
  buildGalgameDateFilter,
  buildGalgameOrderBy,
  buildGalgameWhere
} from '../utils/galgameQuery'

const searchGalgame = async (
  input: z.infer<typeof searchSchema>,
  visibilityWhere: Prisma.patchWhereInput
) => {
  const {
    queryString,
    limit,
    searchOption,
    page,
    selectedType = 'all',
    selectedLanguage = 'all',
    selectedPlatform = 'all',
    sortField,
    sortOrder,
    selectedYears = ['all'],
    selectedMonths = ['all'],
    minRatingCount
  } = input
  const offset = (page - 1) * limit
  const insensitive = Prisma.QueryMode.insensitive

  const query = JSON.parse(queryString) as SearchSuggestionType[]
  const normalizeMode = (mode: SearchSuggestionType['mode'] | undefined) =>
    mode === 'exclude' ? 'exclude' : 'include'

  const buildKeywordCondition = (keyword: string): Prisma.patchWhereInput => ({
    OR: [
      { name: { contains: keyword, mode: insensitive } },
      { vndb_id: keyword },
      { vndb_relation_id: keyword },
      { dlsite_code: keyword },
      ...(searchOption.searchInIntroduction
        ? [{ introduction: { contains: keyword, mode: insensitive } }]
        : []),
      ...(searchOption.searchInAlias
        ? [
            {
              alias: {
                some: {
                  name: { contains: keyword, mode: insensitive }
                }
              }
            }
          ]
        : []),
      ...(searchOption.searchInTag
        ? [
            {
              tag: {
                some: {
                  tag: { name: { contains: keyword, mode: insensitive } }
                }
              }
            }
          ]
        : [])
    ]
  })

  const buildKeywordExcludeCondition = (
    keyword: string
  ): Prisma.patchWhereInput => ({
    AND: [
      {
        NOT: {
          name: {
            contains: keyword,
            mode: insensitive
          }
        }
      },
      {
        OR: [{ vndb_id: null }, { vndb_id: { not: keyword } }]
      },
      {
        OR: [{ vndb_relation_id: null }, { vndb_relation_id: { not: keyword } }]
      },
      {
        OR: [{ dlsite_code: null }, { dlsite_code: { not: keyword } }]
      },
      ...(searchOption.searchInIntroduction
        ? [
            {
              NOT: {
                introduction: {
                  contains: keyword,
                  mode: insensitive
                }
              }
            }
          ]
        : []),
      ...(searchOption.searchInAlias
        ? [
            {
              alias: {
                none: {
                  name: {
                    contains: keyword,
                    mode: insensitive
                  }
                }
              }
            }
          ]
        : []),
      ...(searchOption.searchInTag
        ? [
            {
              tag: {
                none: {
                  tag: {
                    name: {
                      contains: keyword,
                      mode: insensitive
                    }
                  }
                }
              }
            }
          ]
        : [])
    ]
  })

  const includedKeywords = query
    .filter(
      (item) =>
        item.type === 'keyword' && normalizeMode(item.mode) === 'include'
    )
    .map((item) => item.name.trim())
    .filter(Boolean)
  const includedTags = query.filter(
    (item) => item.type === 'tag' && normalizeMode(item.mode) === 'include'
  )
  const includedCompanies = query.filter(
    (item) => item.type === 'company' && normalizeMode(item.mode) === 'include'
  )
  const excludedKeywords = query
    .filter(
      (item) =>
        item.type === 'keyword' && normalizeMode(item.mode) === 'exclude'
    )
    .map((item) => item.name)
    .map((item) => item.trim())
    .filter(Boolean)
  const excludedTags = query.filter(
    (item) => item.type === 'tag' && normalizeMode(item.mode) === 'exclude'
  )
  const excludedCompanies = query.filter(
    (item) => item.type === 'company' && normalizeMode(item.mode) === 'exclude'
  )

  const dateFilter = buildGalgameDateFilter(selectedYears, selectedMonths)
  const where = buildGalgameWhere({
    selectedType,
    selectedLanguage,
    selectedPlatform,
    minRatingCount: sortField === 'rating' ? minRatingCount : 0,
    visibilityWhere
  })
  const orderBy = buildGalgameOrderBy(sortField, sortOrder)

  const queryCondition = [
    ...includedKeywords.map((q) => buildKeywordCondition(q)),

    visibilityWhere,

    ...includedTags.map((tag) => ({
      tag: {
        some: {
          ...(typeof tag.id === 'number'
            ? { tag_id: tag.id }
            : {
                tag: {
                  OR: [{ name: tag.name }, { alias: { has: tag.name } }]
                }
              })
        }
      }
    })),
    ...includedCompanies.map((company) => ({
      company: {
        some: {
          ...(typeof company.id === 'number'
            ? { company_id: company.id }
            : {
                company: {
                  OR: [
                    { name: company.name },
                    { alias: { has: company.name } },
                    { parent_brand: { has: company.name } }
                  ]
                }
              })
        }
      }
    })),
    ...excludedKeywords.map((q) => buildKeywordExcludeCondition(q)),
    ...excludedTags.map((tag) => ({
      NOT: {
        tag: {
          some: {
            ...(typeof tag.id === 'number'
              ? { tag_id: tag.id }
              : {
                  tag: {
                    OR: [{ name: tag.name }, { alias: { has: tag.name } }]
                  }
                })
          }
        }
      }
    })),
    ...excludedCompanies.map((company) => ({
      NOT: {
        company: {
          some: {
            ...(typeof company.id === 'number'
              ? { company_id: company.id }
              : {
                  company: {
                    OR: [
                      { name: company.name },
                      { alias: { has: company.name } },
                      { parent_brand: { has: company.name } }
                    ]
                  }
                })
          }
        }
      }
    }))
  ]

  const [data, total] = await Promise.all([
    prisma.patch.findMany({
      take: limit,
      skip: offset,
      orderBy,
      where: { AND: queryCondition, ...dateFilter, ...where },
      select: GalgameCardSelectField
    }),
    prisma.patch.count({
      where: { AND: queryCondition, ...dateFilter, ...where }
    })
  ])

  const galgames: GalgameCard[] = data.map((gal) => {
    const { favorite_count, resource_count, comment_count, ...rest } = gal
    return {
      ...rest,
      tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
      uniqueId: gal.unique_id,
      _count: toGalgameCardCount({
        favorite_count,
        resource_count,
        comment_count
      }),
      averageRating: gal.rating_stat?.avg_overall
        ? Math.round(gal.rating_stat.avg_overall * 10) / 10
        : 0
    }
  })

  return { galgames, total }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, searchSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const ip = getRemoteIp(req.headers)
  const rate = await checkRateLimit({
    key: `search:${ip || 'unknown'}`,
    limit: 30,
    windowSeconds: 60
  })
  if (!rate.allowed) {
    return NextResponse.json('操作太频繁，请稍后再试')
  }

  const payload = await verifyHeaderCookie(req)
  if (payload) {
    try {
      await setKv(getTaskEventKey(payload.uid, 'd4'), '1', 2 * 24 * 60 * 60)
    } catch (error) {
      console.error('记录搜索任务事件失败:', error)
    }
  }

  const visibilityWhere = await getPatchVisibilityWhere(req)

  const response = await searchGalgame(input, visibilityWhere)
  return NextResponse.json(response)
}
