import { cn } from '~/utils/cn'

interface Props {
  nameplate?: string | null
  active?: boolean
  className?: string
}

export const UserNameplateBadge = ({
  nameplate,
  active = true,
  className
}: Props) => {
  if (nameplate !== 'supporter' || !active) {
    return null
  }

  return (
    <span
      title="Kiriko 支持者"
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-pink-300/60 bg-pink-500/15 px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap text-pink-600 dark:border-pink-400/40 dark:text-pink-300',
        className
      )}
    >
      Kiriko 支持者
    </span>
  )
}
