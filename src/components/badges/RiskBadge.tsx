import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import type { RiskLevel } from '../../types'
import { cn } from '../../utils/cn'

interface RiskBadgeProps {
  level: RiskLevel
  score?: number
  className?: string
}

const styles: Record<RiskLevel, string> = {
  Low: 'border-green/40 bg-green-dim text-green',
  Medium: 'border-orange/40 bg-orange-dim text-orange',
  High: 'border-red/40 bg-red-dim text-red',
}

const icons: Record<RiskLevel, typeof ShieldAlert> = {
  Low: ShieldCheck,
  Medium: ShieldQuestion,
  High: ShieldAlert,
}

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  const Icon = icons[level]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        styles[level],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {level} risk
      {typeof score === 'number' ? (
        <span className="font-mono font-normal opacity-80">{score}</span>
      ) : null}
    </span>
  )
}
