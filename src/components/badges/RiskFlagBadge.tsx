import { Megaphone, Type, Unlink } from 'lucide-react'
import type { RiskFlag } from '../../types'
import { cn } from '../../utils/cn'

interface RiskFlagBadgeProps {
  flag: RiskFlag
  className?: string
}

const styles: Record<RiskFlag, string> = {
  Sensational: 'border-orange/40 bg-orange-dim text-orange',
  Shouting: 'border-amber/40 bg-amber-dim text-amber',
  Unsourced: 'border-red/40 bg-red-dim text-red',
}

const icons: Record<RiskFlag, typeof Megaphone> = {
  Sensational: Megaphone,
  Shouting: Type,
  Unsourced: Unlink,
}

export function RiskFlagBadge({ flag, className }: RiskFlagBadgeProps) {
  const Icon = icons[flag]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        styles[flag],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {flag}
    </span>
  )
}
