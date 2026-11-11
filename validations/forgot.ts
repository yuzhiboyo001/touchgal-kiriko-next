import { z } from 'zod'
import {
  kunUsernameRegex,
  kunPasswordRegex,
  kunValidMailConfirmCodeRegex
} from '~/utils/validate'
import { captchaVerifyTokenSchema } from './captcha'

export const stepOneSchema = z.object({
  name: z
    .string()
    .trim()
    .email({ message: '请输入正确的邮箱格式或用户名' })
    .or(
      z.string().trim().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    ),
  captcha: captchaVerifyTokenSchema
})

export const stepTwoSchema = z.object({
  name: z
    .string()
    .trim()
    .email({ message: '请输入正确的邮箱格式或用户名' })
    .or(
      z.string().trim().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    ),
  verificationCode: z
    .string()
    .regex(kunValidMailConfirmCodeRegex, { message: '邮箱验证码格式无效' }),
  newPassword: z.string().regex(kunPasswordRegex, {
    message: '请输入正确的密码格式'
  }),
  confirmPassword: z.string().regex(kunPasswordRegex, {
    message: '请输入正确的密码格式'
  })
})
