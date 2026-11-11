import { z } from 'zod'

export const manageUpdateUserSchema = z
  .object({
    uid: z.coerce.number().min(1).max(9999999),
    name: z
      .string()
      .trim()
      .min(1, { message: '用户名长度至少为 1 个字符' })
      .max(17, { message: '用户名长度不能超过 17 个字符' }),
    bio: z.string().trim().max(107, { message: '个人简介不能超过 107 个字符' }),
    status: z.coerce.number().min(0).max(2),
    banReason: z
      .string()
      .trim()
      .max(200, { message: '封禁原因不能超过 200 个字符' })
      .optional()
  })
  .strict()

export const manageDeleteUserSchema = z
  .object({
    uid: z.coerce.number().min(1).max(9999999),
    confirmName: z.string().trim().min(1).max(17)
  })
  .strict()
