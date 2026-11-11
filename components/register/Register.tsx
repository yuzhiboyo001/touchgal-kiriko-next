'use client'

import { kunMoyuMoe } from '~/config/moyu-moe'
import { useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Checkbox, Input, Link } from '@heroui/react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/dropdown'
import { ChevronDown } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import { registerSchema } from '~/validations/auth'
import { useUserStore } from '~/store/userStore'
import { useSessionStore } from '~/store/sessionStore'
import { refreshAll } from '~/store/sync'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import toast from 'react-hot-toast'
import { EmailVerification } from '~/components/kun/verification-code/Code'
import { useRouter } from '@bprogress/next'
import { KunTextDivider } from '~/components/kun/TextDivider'
import { KUN_EMAIL_DOMAIN_WHITELIST } from '~/constants/email/whitelist'
import type { AuthUserState } from '~/types/api/session'

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterForm = () => {
  const setUser = useUserStore((state) => state.setUser)
  const router = useRouter()
  const [isAgree, setIsAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  const [emailLocal, setEmailLocal] = useState('')
  const [emailDomain, setEmailDomain] = useState(KUN_EMAIL_DOMAIN_WHITELIST[0])

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      code: '',
      password: ''
    }
  })

  const nameValue = useWatch({ control, name: 'name' })

  const fullEmail = useMemo(() => {
    const trimmed = emailLocal.trim()
    return trimmed ? `${trimmed}@${emailDomain}` : ''
  }, [emailLocal, emailDomain])

  const syncEmailField = (local: string, domain: string) => {
    setValue('email', local.trim() ? `${local.trim()}@${domain}` : '', {
      shouldValidate: true
    })
  }

  const handleRegister = async (data: RegisterFormData) => {
    if (!isAgree) {
      toast.error('请您勾选同意我们的用户协议')
      return
    }

    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)

    try {
      const res = await kunFetchPost<KunResponse<AuthUserState>>(
        '/auth/register',
        data
      )

      kunErrorHandler(res, async (value) => {
        setUser(value)
        useSessionStore.getState().markAuthenticated(value.capabilities)
        reset()
        setEmailLocal('')
        setEmailDomain(KUN_EMAIL_DOMAIN_WHITELIST[0])
        toast.success('注册成功!')
        router.push('/', { scroll: false })
        void refreshAll()
      })
    } catch {
      toast.error('注册失败, 请稍后重试')
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSubmit(handleRegister)(event)
  }

  return (
    <form
      className="flex flex-col space-y-4 w-80"
      onSubmit={handleFormSubmit}
      noValidate
    >
      <Controller
        name="name"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            isRequired
            label="用户名"
            type="name"
            variant="bordered"
            autoComplete="username"
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
          />
        )}
      />
      <div className="flex gap-2 items-start">
        <Input
          isRequired
          label="邮箱"
          type="text"
          variant="bordered"
          autoComplete="email"
          value={emailLocal}
          onValueChange={(value) => {
            setEmailLocal(value)
            syncEmailField(value, emailDomain)
          }}
          isInvalid={!!errors.email}
          errorMessage={errors.email?.message}
          className="flex-1 min-w-0"
        />
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="bordered"
              className="w-40 h-14 shrink-0 justify-between text-medium font-normal text-foreground"
              endContent={<ChevronDown className="size-4 text-default-500" />}
            >
              @{emailDomain}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="邮箱域名"
            selectionMode="single"
            selectedKeys={new Set([emailDomain])}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const [key] = Array.from(keys)
              if (typeof key === 'string') {
                setEmailDomain(key)
                syncEmailField(emailLocal, key)
              }
            }}
            className="max-h-72 overflow-y-auto"
          >
            {KUN_EMAIL_DOMAIN_WHITELIST.map((domain) => (
              <DropdownItem key={domain}>@{domain}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      <Controller
        name="code"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            isRequired
            label="验证码"
            type="text"
            variant="bordered"
            isInvalid={!!errors.code}
            errorMessage={errors.code?.message}
            autoComplete="one-time-code"
            endContent={
              <EmailVerification
                username={nameValue}
                email={fullEmail}
                type="register"
              />
            }
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
            autoComplete="current-password"
            isInvalid={!!errors.password}
            errorMessage={errors.password?.message}
          />
        )}
      />

      <div>
        <Checkbox isSelected={isAgree} onValueChange={setIsAgree}>
          <span>我同意</span>
        </Checkbox>
        <Link className="ml-1" href="/doc/notice/privacy">
          {kunMoyuMoe.titleShort} 用户协议
        </Link>
      </div>

      <Button
        color="primary"
        className="w-full"
        type="submit"
        isDisabled={loading}
        isLoading={loading}
      >
        注册
      </Button>

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
        <span className="mr-2">已经有账号了?</span>
        <Link href="/login">登录账号</Link>
      </div>
    </form>
  )
}
