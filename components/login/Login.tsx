// components/login/Login.tsx
'use client'

import { useTransition } from 'react'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Link, useDisclosure } from '@heroui/react'
import { kunFetchPost } from '~/utils/kunFetch'
import { loginSchema } from '~/validations/auth'
import { useUserStore } from '~/store/userStore'
import { useSessionStore } from '~/store/sessionStore'
import { refreshAll } from '~/store/sync'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { useRouter } from '@bprogress/next'
import toast from 'react-hot-toast'
import { KunCaptchaModal } from '~/components/kun/auth/CaptchaModal'
import { KunTextDivider } from '~/components/kun/TextDivider'
import type { UserState } from '~/store/userStore'
import type { AuthUserState, GlobalCapabilities } from '~/types/api/session'

const loginFormSchema = loginSchema.omit({ captcha: true })
type LoginFormData = z.infer<typeof loginFormSchema>

export const LoginForm = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isPending, startTransition] = useTransition()
  const setUser = useUserStore((state) => state.setUser)
  const router = useRouter()

  const { control, getValues, handleSubmit, reset } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      name: '',
      password: ''
    }
  })

  const handleCaptchaSuccess = async (code: string) => {
    startTransition(async () => {
      onClose()
      const res = await kunFetchPost<
        KunResponse<
          (UserState | KunUser) & {
            require2FA: boolean
            capabilities?: GlobalCapabilities
          }
        >
      >('/auth/login', {
        ...getValues(),
        captcha: code
      })

      kunErrorHandler(res, async (value) => {
        if (value.require2FA) {
          router.push('/login/2fa')
        } else {
          const state = value as AuthUserState
          setUser(state)
          useSessionStore.getState().markAuthenticated(state.capabilities)
          reset()
          toast.success(
            state.role === 4 ? '欢迎回家，主人' : `欢迎回家，${state.name}!`
          )
          router.replace('/', { scroll: false })
          // 登录接口已给出 capabilities，未读/任务后台补齐
          void refreshAll()
        }
      })
    })
  }

  const onSubmit = handleSubmit(() => {
    if (!isPending) {
      onOpen()
    }
  })

  return (
    <form className="w-72" onSubmit={onSubmit} noValidate>
      {/* 表单代码保持不变 */}
      <Controller
        name="name"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            isRequired
            label="用户名或邮箱"
            type="text"
            variant="bordered"
            autoComplete="username"
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            className="mb-4"
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            isRequired
            label="密码"
            type="password"
            variant="bordered"
            isInvalid={!!errors.password}
            autoComplete="current-password"
            errorMessage={errors.password?.message}
            className="mb-4"
          />
        )}
      />
      <Button
        color="primary"
        className="w-full"
        type="submit"
        isDisabled={isPending}
        isLoading={isPending}
      >
        登录
      </Button>

      <KunCaptchaModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleCaptchaSuccess}
      />

      <KunTextDivider text="或" />

      <Button
        color="primary"
        variant="bordered"
        className="w-full mb-4"
        onPress={() => router.push('/auth/forgot')}
      >
        忘记密码
      </Button>

      <div className="flex items-center">
        <span className="mr-2">没有账号?</span>
        <Link href="register">注册账号</Link>
      </div>
    </form>
  )
}
