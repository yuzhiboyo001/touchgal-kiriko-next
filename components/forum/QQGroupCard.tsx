import Image from 'next/image'
import { MessageCircle } from 'lucide-react'

export const QQGroupCard = () => {
  return (
    <section
      id="qq-group"
      className="mt-5 w-full max-w-sm rounded-2xl border border-pink-200/60 bg-pink-50/60 p-4 text-center shadow-sm dark:border-pink-400/20 dark:bg-pink-950/20 sm:p-5"
    >
      <div className="mb-2 flex items-center justify-center gap-2">
        <MessageCircle className="size-4 text-pink-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-default-700 dark:text-default-200 tracking-widest">
          官方交流群
        </h2>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-default-500">
        欢迎加入官方交流群，来和其他 Galgame 爱好者聊聊吧！
      </p>

      <div className="mx-auto w-fit overflow-hidden rounded-xl bg-white p-2 shadow-sm">
        <Image
          src="/qq-group.jpg"
          alt="Kiriko QQ 官方交流群二维码"
          width={300}
          height={260}
          unoptimized
          className="h-auto w-75"
        />
      </div>

      <p className="mt-2.5 text-[11px] text-default-400">打开 QQ 扫码</p>
    </section>
  )
}
