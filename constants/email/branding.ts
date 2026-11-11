// 邮件 Logo 使用 CID 内嵌，不依赖 QQ/Gmail 是否允许加载远程图片。
// 真正的附件由 lib/mail.ts 在发送时从 public/email/kiriko-logo.png 读取。
export const KIRIKO_EMAIL_LOGO_CID = 'kiriko-logo@kiriko.ink'

export const KIRIKO_EMAIL_LOGO_URL =
  process.env.KIRIKO_EMAIL_LOGO_URL || `cid:${KIRIKO_EMAIL_LOGO_CID}`
