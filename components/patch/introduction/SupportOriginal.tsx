import { ExternalLink, Heart } from 'lucide-react'
import { KunExternalLink } from '~/components/kun/external-link/ExternalLink'
import type { Company } from '~/types/api/company'

interface Props {
  dlsiteCode: string
  companies?: Company[]
}

export const SupportOriginal = ({ dlsiteCode, companies = [] }: Props) => {
  const company = companies[0]
  const officialWebsite = companies
    .flatMap((item) => item.official_website ?? [])
    .find((site) => site.trim().length > 0)

  if (!dlsiteCode && !officialWebsite && !company) {
    return null
  }

  const dlsiteUrl = dlsiteCode
    ? `https://www.dlsite.com/maniax/work/=/product_id/${encodeURIComponent(dlsiteCode)}.html/`
    : ''

  const companyUrl =
    officialWebsite || (company ? `/company/${company.id}` : '')
  const companyLinkLabel = officialWebsite ? '前往会社官网' : '查看会社页面'

  const description =
    dlsiteCode && officialWebsite
      ? '喜欢这部作品的话，可以通过 DLsite 或会社官网查看详情。'
      : dlsiteCode
        ? '喜欢这部作品的话，可以通过 DLsite 查看更多详情。'
        : officialWebsite
          ? '喜欢这部作品的话，可以前往游戏会社官网查看详情。'
          : '喜欢这部作品的话，可以前往游戏会社页面查看相关信息。'

  return (
    <section className="mt-8 mb-2">
      <div className="flex flex-col gap-4 rounded-2xl border border-pink-500/20 bg-pink-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-pink-500/10 text-pink-400">
            <Heart className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              支持正版
            </h2>
            <p className="mt-1.5 text-sm text-default-500 sm:text-base">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 self-end sm:self-auto">
          {dlsiteUrl && (
            <KunExternalLink
              link={dlsiteUrl}
              color="secondary"
              size="md"
              showAnchorIcon={false}
            >
              前往 DLsite
              <ExternalLink className="ml-1 size-4" />
            </KunExternalLink>
          )}

          {companyUrl && (
            <KunExternalLink
              link={companyUrl}
              color="secondary"
              size="md"
              showAnchorIcon={false}
            >
              {companyLinkLabel}
              <ExternalLink className="ml-1 size-4" />
            </KunExternalLink>
          )}
        </div>
      </div>
    </section>
  )
}
