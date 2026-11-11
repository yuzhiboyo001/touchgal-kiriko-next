// import { fileURLToPath } from 'url'
import createMDX from '@next/mdx'
import type { NextConfig } from 'next'
// import remarkGfm from 'remark-gfm'
// import rehypeSlug from 'rehype-slug'
// import rehypeAutolinkHeadings from 'rehype-autolink-headings'
// import rehypePrettyCode from 'rehype-pretty-code'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

const imageBedHost = process.env.KUN_VISUAL_NOVEL_IMAGE_BED_HOST
if (!imageBedHost) {
  throw new Error('KUN_VISUAL_NOVEL_IMAGE_BED_HOST is required at build time')
}

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  transpilePackages: ['next-mdx-remote'],
  sassOptions: {
    silenceDeprecations: ['legacy-js-api']
  },
  images: {
    qualities: [65, 75],
    // AVIF 编码在 4C 机器上太贵；内容图本身已是 AVIF/WebP，优化器只留 WebP
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: imageBedHost,
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cloud.touchgaloss.com',
        port: '',
        pathname: '/**'
      }
    ]
  },

  output: 'standalone',
  outputFileTracingExcludes: {
    '*': [
      './backup/**',
      './PythonProject17/**',
      './.tmp/**',
      './.env',
      './.env.*',
      './*.log',
      './build*.log'
    ]
  },
  experimental: {
    optimizePackageImports: [
      '@heroui/react',
      'lucide-react',
      'date-fns',
      'framer-motion',
      'recharts',
      'react-hook-form',
      '@hookform/resolvers',
      'zustand'
    ]
  }
}

// Turbopack compatible errors
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    rehypePlugins: []
  }
})

export default withMDX(nextConfig)
