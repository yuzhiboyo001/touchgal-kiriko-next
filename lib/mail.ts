import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { KIRIKO_EMAIL_LOGO_CID } from '~/constants/email/branding'

interface SendMailInput {
  to: string
  subject: string
  html: string
  text: string
}

const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = process.env.SMTP_SECURE === 'true'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
  requireTLS: !smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    minVersion: 'TLSv1.2'
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100
})

export const sendMail = async ({ to, subject, html, text }: SendMailInput) => {
  const useSes = Boolean(
    process.env.AWS_SES_ACCESS_KEY_ID &&
    process.env.AWS_SES_SECRET_ACCESS_KEY &&
    process.env.AWS_SES_REGION &&
    process.env.AWS_SES_FROM_EMAIL
  )

  const fromEmail = useSes
    ? process.env.AWS_SES_FROM_EMAIL!
    : process.env.SMTP_FROM_EMAIL
  const fromName = useSes
    ? process.env.AWS_SES_FROM_NAME || 'Kiriko'
    : process.env.SMTP_FROM_NAME || 'Kiriko'

  if (useSes) {
    const ses = new SESClient({
      region: process.env.AWS_SES_REGION,
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!
      }
    })

    await ses.send(
      new SendEmailCommand({
        Source: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: html, Charset: 'UTF-8' },
            Text: { Data: text, Charset: 'UTF-8' }
          }
        },
        ConfigurationSetName: process.env.AWS_SES_CONFIGURATION_SET || undefined
      })
    )
    return
  }

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error('SMTP 配置不完整')
  }

  const logoPath = path.join(
    process.cwd(),
    'public',
    'email',
    'kiriko-logo.png'
  )
  const attachments =
    html.includes(`cid:${KIRIKO_EMAIL_LOGO_CID}`) && fs.existsSync(logoPath)
      ? [
          {
            filename: 'kiriko-logo.png',
            path: logoPath,
            cid: KIRIKO_EMAIL_LOGO_CID
          }
        ]
      : undefined

  await transporter.sendMail({
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    to,
    subject,
    html,
    text,
    attachments
  })
}
