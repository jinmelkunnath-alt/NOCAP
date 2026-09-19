import { Flame } from 'lucide-react'
import type { RumourVelocity } from '../../types'
import { cn } from '../../utils/cn'

export function VelocityBadge({ velocity }: { velocity: RumourVelocity }) {
  const active = velocity.label === 'rapid' || velocity.label === 'active'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        active
          ? 'border-orange/30 bg-orange-dim text-orange'
          : 'border-line bg-elevated text-faint',
      )}
    >
      {active ? <Flame className="h-3 w-3" aria-hidden="true" /> : null}
      {velocity.label === 'rapid'
        ? 'Rapidly spreading'
        : velocity.label === 'active'
          ? `+${velocity.interactions} in ${velocity.windowMinutes}m`
          : 'Not enough activity data'}
    </span>
  )
}
