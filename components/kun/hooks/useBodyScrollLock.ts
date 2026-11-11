'use client'

import { useEffect } from 'react'

let lockCount = 0
let savedScrollY = 0
let savedStyles: {
  position: string
  top: string
  left: string
  right: string
  width: string
  overflow: string
} | null = null

const acquireLock = () => {
  if (lockCount === 0 && typeof document !== 'undefined') {
    const body = document.body
    savedScrollY = window.scrollY
    savedStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow
    }

    body.style.position = 'fixed'
    body.style.top = `-${savedScrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
  }
  lockCount++
}

const releaseLock = () => {
  if (lockCount === 0) return
  lockCount--

  if (lockCount === 0 && savedStyles && typeof document !== 'undefined') {
    const body = document.body
    body.style.position = savedStyles.position
    body.style.top = savedStyles.top
    body.style.left = savedStyles.left
    body.style.right = savedStyles.right
    body.style.width = savedStyles.width
    body.style.overflow = savedStyles.overflow
    window.scrollTo(0, savedScrollY)
    savedStyles = null
  }
}

export const useBodyScrollLock = (active = true) => {
  useEffect(() => {
    if (!active) return

    acquireLock()
    return releaseLock
  }, [active])
}
