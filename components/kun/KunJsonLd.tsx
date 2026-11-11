import { kunMoyuMoe } from '~/config/moyu-moe'

const organizationId = `${kunMoyuMoe.domain.main}/#organization`
const websiteId = `${kunMoyuMoe.domain.main}/#website`

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: kunMoyuMoe.titleShort,
      url: kunMoyuMoe.domain.main,
      logo: {
        '@type': 'ImageObject',
        url: kunMoyuMoe.og.image
      },
      sameAs: ['https://x.com/Galgame_gzwz']
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: kunMoyuMoe.domain.main,
      name: kunMoyuMoe.titleShort,
      description: kunMoyuMoe.description,
      inLanguage: 'zh-CN',
      publisher: {
        '@id': organizationId
      }
    }
  ]
}

export const KunJsonLd = () => (
  <script
    type="application/ld+json"
    suppressHydrationWarning
    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
  />
)
