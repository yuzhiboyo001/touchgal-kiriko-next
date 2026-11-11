// components/kun/auth/captcha.d.ts

export interface CaptchaData {
  sessionId: string
  questionId: string
  question: string
  options: string[]
  category: 'general'
}

export interface CaptchaVerifyRequest {
  sessionId: string
  answer: number
}

export interface CaptchaVerifyResponse {
  success: boolean
  message: string
}
