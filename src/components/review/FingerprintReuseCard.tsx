import { Bolt } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Claim } from '../../types'
import { StatusBadge } from '../badges/StatusBadge'
import { ResolutionBadge } from './ResolutionBadge'

export function FingerprintReuseCard({
  claim,
  previous,
}: {
  claim: Claim
  previous?: Claim | null
}) {
  return (
    <div className="rounded-2xl border border-cyan/30 bg-cyan-dim p-4">
      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-cyan">
        <Bolt className="h-3.5 w-3.5" aria-hidden="true" />
        Instant resolution
      </p>
      <p className="mt-2 text-sm font-medium text-ink">Close variant detected</p>
      <p className="mt-1 font-mono text-sm text-ink">
        Similarity: {claim.similarityScore ?? 0}%
      </p>
      {previous && (
        <div className="mt-3 text-sm">
          <p className="text-mute">Previous verified claim</p>
          <Link to={`/claim/${previous.id}`} className="mt-1 block text-cyan hover:underline">
            {previous.text}
          </Link>
          <div className="mt-2">
            <StatusBadge verdict={previous.verdict} />
          </div>
        </div>
      )}
      <div className="mt-3">
        <ResolutionBadge path="FINGERPRINT_REUSE" latency="INSTANT" />
      </div>
      <p className="mt-3 text-[11px] text-mute">
        No reviewer bottleneck. The desk matched this text to an existing verified claim using
        deterministic similarity (threshold 85%). This is not an AI verdict.
      </p>
    </div>
  )
}
