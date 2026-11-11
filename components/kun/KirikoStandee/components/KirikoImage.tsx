// components/kun/KirikoStandee/components/KirikoImage.tsx

'use client'

import { memo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface KirikoImageProps {
  imagePath: string
  name: string
  imageError: boolean
  setImageError: (v: boolean) => void
  isShopMode?: boolean
}

export const KirikoImage = memo(
  ({
    imagePath,
    name,
    imageError,
    setImageError,
    isShopMode = false
  }: KirikoImageProps) => {
    return (
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={imagePath}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.37,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="absolute inset-0"
          >
            {!imageError ? (
              <Image
                src={imagePath}
                alt={name}
                fill
                data-no-lightbox="true"
                className="object-contain"
                priority
                quality={65}
                fetchPriority="high"
                loading="eager"
                sizes="(max-width: 768px) 50vw, 33vw"
                draggable={false}
                onError={() => setImageError(true)}
                style={{ willChange: 'transform' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                <div className="text-center">
                  <div className="text-lg mb-2">🧸</div>
                  <div>图片未找到</div>
                  <div className="text-[10px] mt-1 opacity-60">{imagePath}</div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }
)

KirikoImage.displayName = 'KirikoImage'
