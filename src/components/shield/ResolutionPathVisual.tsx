import { Bolt, ShieldCheck, Users } from 'lucide-react'
import type { ResolutionPath } from '../../types'

const COPY: Record<
  ResolutionPath,
  { kicker: string; title: string; icon: typeof Bolt }
> = {
  FINGERPRINT_REUSE: { kicker: 'Instant', title: 'Fingerprint reuse', icon: Bolt },
  FAST_SINGLE_REVIEW: { kicker: 'Fast', title: 'Single reviewer', icon: ShieldCheck },
  BRIDGING_VERIFICATION: { kicker: 'Bridging', title: '2 perspectives required', icon: Users },
}

export function ResolutionPathVisual({ path }: { path: ResolutionPath }) {
  const meta = COPY[path]
  const Icon = meta.icon
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl border border-line bg-elevated px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-cyan" aria-hidden="true" />
      <span>
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-cyan">
          {meta.kicker}
        </span>
        <span className="block text-xs text-ink">{meta.title}</span>
      </span>
    </span>
  )
}
