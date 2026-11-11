'use client'

import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export const KunBackToTop = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!show) {
    return null
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-5 z-50 flex size-10 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/20 transition-colors hover:bg-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-pink-700 sm:bottom-12 sm:right-6"
    >
      <ArrowUp className="size-6" />
    </button>
  )
}
