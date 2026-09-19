import { AlertTriangle, BadgeCheck, CircleHelp, XCircle } from 'lucide-react'
import type { Verdict } from '../../types'
import { cn } from '../../utils/cn'

interface StatusBadgeProps {
  verdict: Verdict
  className?: string
}

const styles: Record<Verdict, string> = {
  Unverified: 'border-amber/30 bg-amber-dim text-amber',
  'Verified True': 'border-green/30 bg-green-dim text-green',
  'Verified False': 'border-red/30 bg-red-dim text-red',
  Misleading: 'border-orange/30 bg-orange-dim text-orange',
}

const icons: Record<Verdict, typeof CircleHelp> = {
  Unverified: CircleHelp,
  'Verified True': BadgeCheck,
  'Verified False': XCircle,
  Misleading: AlertTriangle,
}

export function StatusBadge({ verdict, className }: StatusBadgeProps) {
  const Icon = icons[verdict]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        styles[verdict],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {verdict}
    </span>
  )
}
