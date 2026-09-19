import type { Claim } from '../../types'
import { formatTimestamp } from '../../utils/format'
import { StatusBadge } from '../badges/StatusBadge'

interface ReviewCardProps {
  claim: Claim
}

export function ReviewCard({ claim }: ReviewCardProps) {
  if (claim.verdict === 'Unverified') {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-mute">
        This claim is still unverified. A reviewer has not published a verdict.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge verdict={claim.verdict} />
        {claim.confidence !== null && (
          <span className="font-mono text-xs text-mute">Confidence {claim.confidence}%</span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-ink">{claim.reviewerNote}</p>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="label-kicker">Reviewer</dt>
          <dd className="mt-1 font-mono text-mute">{claim.reviewerId || '—'}</dd>
        </div>
        <div>
          <dt className="label-kicker">Reviewed</dt>
          <dd className="mt-1 text-mute">
            <time dateTime={claim.updatedAt}>{formatTimestamp(claim.updatedAt)}</time>
          </dd>
        </div>
      </dl>
    </div>
  )
}
