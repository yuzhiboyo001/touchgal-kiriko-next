import { NavbarBrand } from '@heroui/navbar'
import { kunMoyuMoe } from '~/config/moyu-moe'
import Image from 'next/image'
import Link from 'next/link'

export const KunTopBarBrand = () => {
  return (
    <NavbarBrand className="hidden sm:flex">
      <Link className="flex items-center gap-3" href="/">
        {/* Logo 图片 */}
        <Image
          src="/logo.webp"
          alt=""
          width={57}
          height={57}
          priority
          className="shrink-0"
        />

        <div className="flex items-center gap-3">
          <span className="text-lg text-red-400/80 select-none dark:text-red-400/60">
            ✦
          </span>
          <span className="text-xl font-bold tracking-wider text-black font-ja-serif dark:text-white">
            {kunMoyuMoe.creator.name}
          </span>
          <span className="text-lg text-blue-400/80 select-none dark:text-blue-400/60">
            ✦
          </span>
        </div>
      </Link>
    </NavbarBrand>
  )
}
