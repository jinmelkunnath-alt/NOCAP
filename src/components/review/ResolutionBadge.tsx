import { Bolt, ShieldCheck, Users } from 'lucide-react'
import type { ResolutionPath } from '../../types'
import { cn } from '../../utils/cn'

const COPY: Record<ResolutionPath, { label: string; icon: typeof Bolt; className: string }> = {
  FINGERPRINT_REUSE: {
    label: 'Fingerprint reuse',
    icon: Bolt,
    className: 'border-cyan/30 bg-cyan-dim text-cyan',
  },
  FAST_SINGLE_REVIEW: {
    label: 'Fast single review',
    icon: ShieldCheck,
    className: 'border-green/30 bg-green-dim text-green',
  },
  BRIDGING_VERIFICATION: {
    label: 'Bridging verification',
    icon: Users,
    className: 'border-orange/30 bg-orange-dim text-orange',
  },
}

export function ResolutionBadge({
  path,
  latency,
}: {
  path: ResolutionPath
  latency?: 'INSTANT' | 'FAST' | 'REVIEW REQUIRED'
}) {
  const meta = COPY[path]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
      {latency ? <span className="font-mono font-normal opacity-80">· {latency}</span> : null}
    </span>
  )
}
