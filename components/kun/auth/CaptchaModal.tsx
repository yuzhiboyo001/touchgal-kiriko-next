'use client'

import toast from 'react-hot-toast'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Image
} from '@heroui/react'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { KunLoading } from '../Loading'
import { kunCaptchaErrorMessageMap } from '~/constants/captcha'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { CaptchaData } from './captcha'

interface CaptchaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (code: string) => void
}

export const KunCaptchaModal = ({
  isOpen,
  onClose,
  onSuccess
}: CaptchaModalProps) => {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadCaptcha = useCallback(async (excludeId?: string) => {
    setLoading(true)
    setSelected(null)
    try {
      const url = excludeId
        ? `/auth/captcha?exclude=${encodeURIComponent(excludeId)}`
        : '/auth/captcha'
      const data = await kunFetchGet<CaptchaData>(url)
      if (!isMountedRef.current) return
      setCaptcha(data)
    } catch (error) {
      console.error('加载验证码失败:', error)
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        void loadCaptcha()
      } else {
        // Modal 关闭时清理状态
        setSelected(null)
        setErrorCount(0)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [isOpen, loadCaptcha])

  const handleRefresh = useCallback(() => {
    setErrorCount(0) // ✅ 换题重置错误次数
    loadCaptcha(captcha?.questionId)
  }, [captcha, loadCaptcha])

  const handleVerify = useCallback(async () => {
    if (isVerifying || selected === null || !captcha) return

    setIsVerifying(true)
    try {
      const response = await kunFetchPost<KunResponse<{ code: string }>>(
        '/auth/captcha',
        { sessionId: captcha.sessionId, answer: selected }
      )

      if (!isMountedRef.current) return

      if (typeof response === 'string') {
        toast.error(kunCaptchaErrorMessageMap[errorCount] || '验证失败，请重试')
        setErrorCount((prev) => Math.min(prev + 1, 6))
        // 失败换题：排除当前
        loadCaptcha(captcha.questionId)
      } else {
        onSuccess(response.code)
      }
    } catch (error) {
      console.error('验证失败:', error)
      toast.error(kunCaptchaErrorMessageMap[errorCount])
      loadCaptcha(captcha.questionId)
    } finally {
      if (isMountedRef.current) setIsVerifying(false)
    }
  }, [selected, captcha, errorCount, loadCaptcha, onSuccess, isVerifying])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      classNames={{
        base: 'bg-content1/95 border border-[var(--gal-sticker-border)] rounded-2xl text-foreground',
        wrapper: 'items-center justify-center'
      }}
    >
      <ModalContent>
        <ModalHeader className="flex-row items-center gap-2 pb-2">
          <Image
            src="/favicon.webp"
            alt={kunMoyuMoe.titleShort}
            width={32}
            height={32}
            className="rounded"
          />
          <span className="text-foreground/60 text-sm font-medium">
            {kunMoyuMoe.titleShort}
          </span>
        </ModalHeader>

        <ModalBody className="py-4">
          {loading || !captcha ? (
            <KunLoading hint="正在加载验证..." />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-foreground text-base font-ja-maru px-1">
                「{captcha.question}」
              </div>

              <div className="flex flex-col gap-2">
                {captcha.options.map((opt, i) => {
                  const isSelected = selected === i
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelected(i)}
                      className={`
                        w-full text-left px-4 py-3 rounded-xl border
                        transition-all duration-200 ease-out
                        ${
                          isSelected
                            ? 'border-pink-400 bg-pink-500/10 ring-2 ring-pink-300/40 shadow-sm'
                            : 'border-(--gal-sticker-border) bg-content2/40 hover:bg-(--gal-sticker-bg-hover) hover:border-pink-300/60 hover:scale-[1.01]'
                        }
                      `}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span
                          className={`
                            w-4 h-4 rounded-full border-2 shrink-0
                            ${isSelected ? 'border-pink-500 bg-pink-500' : 'border-default-400'}
                          `}
                        >
                          {isSelected && (
                            <span className="block w-full h-full rounded-full bg-white scale-[0.4]" />
                          )}
                        </span>
                        <span className="text-foreground">{opt}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex-row justify-between pt-2">
          <Button
            size="sm"
            variant="light"
            className="text-foreground/60 hover:text-pink-400"
            onPress={handleRefresh}
            isDisabled={loading || isVerifying}
          >
            换一题
          </Button>
          <div className="flex gap-2">
            <Button color="default" variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleVerify}
              isDisabled={selected === null || isVerifying || loading}
              isLoading={isVerifying}
            >
              确定
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
