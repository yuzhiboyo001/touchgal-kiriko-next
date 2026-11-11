import { cn } from '~/utils/cn'

const ROLE_BADGES: Record<
  number,
  { label: string; className: string; title: string }
> = {
  1: {
    label: '萌新',
    title: '萌新',
    className:
      'border-default-200 bg-white/90 text-default-700 dark:border-default-600 dark:bg-default-100/80 dark:text-default-800'
  },
  2: {
    label: '创作者',
    title: '创作者',
    className:
      'border-purple-300/60 bg-purple-500/15 text-purple-600 dark:border-purple-400/40 dark:text-purple-300'
  },
  3: {
    label: '管理员',
    title: '管理员',
    className:
      'border-emerald-300/60 bg-emerald-500/15 text-emerald-600 dark:border-emerald-400/40 dark:text-emerald-300'
  },
  4: {
    label: 'Kiriko',
    title: 'Kiriko',
    className:
      'border-amber-300/70 bg-amber-400/20 text-amber-700 dark:border-amber-300/40 dark:text-amber-300'
  }
}

interface Props {
  role?: number | null
  className?: string
}

export const UserRoleBadge = ({ role, className }: Props) => {
  const badge = role ? ROLE_BADGES[role] : undefined
  if (!badge) return null

  return (
    <span
      title={badge.title}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap',
        badge.className,
        className
      )}
    >
      {badge.label}
    </span>
  )
}
