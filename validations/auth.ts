// validations/auth.ts
import { z } from 'zod'
import {
  kunUsernameRegex,
  kunPasswordRegex,
  kunValidMailConfirmCodeRegex
} from '~/utils/validate'
import { isKunWhitelistedEmailDomain } from '~/constants/email/whitelist'
import { captchaVerifyTokenSchema } from './captcha'

const kunWhitelistedEmailDomainMessage =
  '暂不支持该邮箱服务商，请使用列表中的常见邮箱注册'

export const loginSchema = z.object({
  name: z
    .string()
    .trim()
    .email({ message: '请输入正确的邮箱格式或用户名' })
    .or(
      z.string().trim().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    ),
  password: z.string().trim().regex(kunPasswordRegex, {
    message: '请输入正确的密码格式'
  }),
  captcha: captchaVerifyTokenSchema
})

export const registerSchema = z
  .object({
    name: z.string().regex(kunUsernameRegex, {
      message: '非法的用户名，用户名为 1~17 位任意字符'
    }),
    email: z.string().email({ message: '请输入合法的邮箱格式' }),
    code: z.string().regex(kunValidMailConfirmCodeRegex, {
      message: '非法的邮箱验证码，验证码为 7 位数字和大小写字母组合'
    }),
    password: z.string().trim().regex(kunPasswordRegex, {
      message:
        '非法的密码格式，密码的长度为 6 到 20 位，必须包含至少一个英文字符和一个数字'
    })
  })
  .refine((data) => isKunWhitelistedEmailDomain(data.email), {
    path: ['email'],
    message: kunWhitelistedEmailDomainMessage
  })

export const sendRegisterEmailVerificationCodeSchema = z
  .object({
    name: z.string().regex(kunUsernameRegex, {
      message: '非法的用户名，用户名为 1~17 位任意字符'
    }),
    email: z.string().email({ message: '请输入合法的邮箱格式' }),
    captcha: captchaVerifyTokenSchema
  })
  .refine((data) => isKunWhitelistedEmailDomain(data.email), {
    path: ['email'],
    message: kunWhitelistedEmailDomainMessage
  })

export const disableEmailNoticeSchema = z.object({
  email: z.string().email({ message: '非法的邮箱格式' }),
  validateEmailCode: z.string().uuid({ message: '非法的邮箱验证码格式' })
})

export const captchaSchema = z.object({
  sessionId: z.string().trim().uuid({ message: '非法的 sessionId 格式' }),
  answer: z
    .number()
    .int()
    .min(0, { message: '非法的答案' })
    .max(2, { message: '非法的答案' })
})

export const verifyLogin2FASchema = z.object({
  token: z
    .string()
    .min(6, { message: '2FA 验证码必须为 6 位数字' })
    .max(6, { message: '2FA 验证码必须为 6 位数字' }),
  isBackupCode: z.boolean().optional().default(false)
})
