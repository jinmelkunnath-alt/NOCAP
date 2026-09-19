import { GitBranch, Link2, Unlink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Claim } from '../../types'
import { formatRelative } from '../../utils/format'
import { CategoryBadge } from '../badges/CategoryBadge'
import { PlatformBadge } from '../badges/PlatformBadge'
import { RiskBadge } from '../badges/RiskBadge'
import { RiskFlagBadge } from '../badges/RiskFlagBadge'
import { VerificationShield } from '../shield/VerificationShield'

interface ClaimCardProps {
  claim: Claim
  compact?: boolean
  relatedClaim?: Claim | null
}

export function ClaimCard({ claim, compact = false, relatedClaim = null }: ClaimCardProps) {
  const related = claim.similarSubmissionCount ?? 0
  const sourced = claim.sourceUrl.trim().length > 0 && !claim.flags.includes('Unsourced')
  const variantLabel = claim.potentialDuplicate
    ? 'Close Variant Detected'
    : claim.matchedClaimId
      ? 'Potentially Related Claim'
      : null

  return (
    <article className="glass-card float-up min-w-0 p-4">
      <div className="mb-3">
        <VerificationShield claim={claim} compact />
      </div>
      <Link to={`/claim/${claim.id}`} className="block transition-colors hover:bg-elevated/40">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <RiskBadge level={claim.riskLevel} score={claim.riskScore} />
        </div>

        <p className="text-sm leading-relaxed text-ink">{claim.text}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] text-mute">
            {claim.riskLevel.toUpperCase()} RISK · {claim.riskScore}
          </span>
          {claim.flags.length === 0 ? (
            <span className="text-[10px] uppercase tracking-wider text-faint">No risk flags</span>
          ) : (
            claim.flags.map((flag) => <RiskFlagBadge key={flag} flag={flag} />)
          )}
        </div>

        {!compact && (
          <p className="mt-1 text-[10px] text-faint">
            Rule-based triage score based on observable signals.
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-mute">
          <PlatformBadge platform={claim.platform} />
          <CategoryBadge category={claim.category} />
          <span className="inline-flex items-center gap-1 text-faint">
            {sourced ? (
              <Link2 className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Unlink className="h-3 w-3" aria-hidden="true" />
            )}
            {sourced ? 'Sourced' : 'No source'}
          </span>
          <span className="ml-auto font-mono text-[10px] text-faint">
            <time dateTime={claim.createdAt}>{formatRelative(claim.createdAt)}</time>
          </span>
        </div>

        {(variantLabel || related > 0) && (
          <div className="mt-3 flex flex-col gap-1.5 text-[11px]">
            {variantLabel && (
              <span className="glass-pill w-fit px-2 py-0.5 font-medium text-cyan">
                {variantLabel}
                {typeof claim.similarityScore === 'number' ? ` · ${claim.similarityScore}%` : ''}
              </span>
            )}
            {relatedClaim && (
              <span className="text-mute">
                Previous verification: {relatedClaim.verdict}
                <span className="ml-1 font-mono text-faint">{relatedClaim.id}</span>
              </span>
            )}
            {related > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-cyan">
                <GitBranch className="h-3 w-3" aria-hidden="true" />
                {related} similar submission{related === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}
      </Link>
    </article>
  )
}
