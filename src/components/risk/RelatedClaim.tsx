import { useClaim } from '../../hooks/useClaim'
import { formatTimestamp } from '../../utils/format'
import { StatusBadge } from '../badges/StatusBadge'
import { Button } from '../ui/Button'
import { LoadingState } from '../ui/LoadingState'

interface RelatedClaimProps {
  matchedClaimId: string
  similarityScore: number
  potentialDuplicate: boolean
}

export function RelatedClaim({
  matchedClaimId,
  similarityScore,
  potentialDuplicate,
}: RelatedClaimProps) {
  const { claim, loading } = useClaim(matchedClaimId)

  if (loading) return <LoadingState label="Loading related claim" className="py-8" />
  if (!claim) return null

  const reviewed = claim.verdict !== 'Unverified'

  return (
    <div className="rounded-2xl border border-cyan/30 bg-cyan-dim p-4">
      <p className="label-kicker text-cyan">
        {potentialDuplicate ? 'Close variant detected' : 'Potentially related claim'}
      </p>
      <p className="mt-2 text-sm text-ink">
        This claim appears similar to a previously {reviewed ? 'reviewed' : 'submitted'} claim. Text
        similarity does not assign a verdict.
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="label-kicker">Similarity</dt>
          <dd className="mt-1 font-mono text-ink">{similarityScore}%</dd>
        </div>
        <div>
          <dt className="label-kicker">Previous verdict</dt>
          <dd className="mt-1">
            <StatusBadge verdict={claim.verdict} />
          </dd>
        </div>
        <div>
          <dt className="label-kicker">{reviewed ? 'Reviewed' : 'Submitted'}</dt>
          <dd className="mt-1 font-mono text-xs text-mute">
            <time dateTime={claim.updatedAt}>{formatTimestamp(claim.updatedAt)}</time>
          </dd>
        </div>
      </dl>
      {reviewed && (
        <p className="mt-3 text-xs text-mute">
          Previous verification found. A reviewer must still decide whether this submission should
          reference that review.
        </p>
      )}
      <div className="mt-3">
        <Button to={`/claim/${claim.id}`} size="sm" variant="secondary">
          {reviewed ? 'View previous review' : 'View original claim'}
        </Button>
      </div>
    </div>
  )
}
