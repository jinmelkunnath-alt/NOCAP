import { Link } from 'react-router-dom'
import type { UserProfile } from '../../types'
import { cn } from '../../utils/cn'

const PALETTE = ['#059669', '#0d9488', '#0f172a', '#d97706', '#475569', '#dc2626']

function colorFor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 2147483647
  return PALETTE[Math.abs(hash) % PALETTE.length] ?? '#059669'
}

function initials(user: UserProfile): string {
  const parts = user.displayName.trim().split(/\s+/)
  const letters = parts.slice(0, 2).map((part) => part[0] ?? '')
  return letters.join('').toUpperCase() || user.username.slice(0, 2).toUpperCase()
}

interface AvatarProps {
  user: UserProfile
  size?: 'sm' | 'md' | 'lg'
  linked?: boolean
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-16 w-16 text-lg',
}

export function Avatar({ user, size = 'md', linked = true, className }: AvatarProps) {
  const node = (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
        className,
      )}
      style={{ background: colorFor(user.id) }}
      aria-hidden="true"
    >
      {initials(user)}
    </span>
  )

  if (!linked) return node
  return (
    <Link to={`/profile/${user.username}`} aria-label={`${user.displayName} profile`}>
      {node}
    </Link>
  )
}
