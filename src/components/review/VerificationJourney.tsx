import type { Claim, LedgerEntry, Review } from '../../types'
import { formatTimestamp } from '../../utils/format'
import { ledgerService } from '../../services/ledgerService'
import { deriveResolutionPath } from '../../utils/verificationPath'
import { cn } from '../../utils/cn'

export function VerificationJourney({
  claim,
  reviews,
}: {
  claim: Claim
  reviews: Review[]
}) {
  const stored = ledgerService.forClaim(claim.id)
  const entries = stored.length > 0 ? stored : synthesize(claim, reviews)

  return (
    <ol className="flex flex-col gap-0 border-l border-line pl-4">
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative pb-4 last:pb-0">
          <span
            className={cn(
              'absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full border-2 border-panel',
              index === entries.length - 1 ? 'bg-cyan' : 'bg-line-strong',
            )}
            aria-hidden="true"
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-ink">{labelFor(entry.kind)}</p>
          {entry.verdict && <p className="mt-0.5 text-sm text-ink">{entry.verdict}</p>}
          <p className="mt-1 text-sm text-mute">{entry.note}</p>
          <p className="mt-1 font-mono text-[11px] text-faint">
            <time dateTime={entry.timestamp}>{formatTimestamp(entry.timestamp)}</time>
            {entry.actorRole === 'REVIEWER' ? ' · reviewer' : ' · system'}
            {entry.perspective ? ` · perspective ${entry.perspective}` : ''}
          </p>
        </li>
      ))}
    </ol>
  )
}

function labelFor(kind: LedgerEntry['kind']): string {
  const map: Record<LedgerEntry['kind'], string> = {
    submitted: 'Submitted',
    risk_analysis: 'Risk analysis',
    fingerprint_check: 'Fingerprint check',
    routed: 'Verdict routing',
    fingerprint_reuse: 'Fingerprint reuse',
    reviewer_decision: 'Reviewer decision',
    consensus_reached: 'Consensus reached',
    consensus_not_reached: 'Consensus not reached',
    resolved: 'Resolved',
    reopened: 'Review reopened',
    additional_review: 'Additional review',
  }
  return map[kind]
}

function synthesize(claim: Claim, reviews: Review[]): LedgerEntry[] {
  const path = deriveResolutionPath(claim)
  const entries: LedgerEntry[] = [
    {
      id: `syn_${claim.id}_1`,
      claimId: claim.id,
      timestamp: claim.createdAt,
      kind: 'submitted',
      verdict: 'Unverified',
      actorId: 'system',
      actorRole: 'SYSTEM',
      note: 'Claim submitted',
    },
    {
      id: `syn_${claim.id}_2`,
      claimId: claim.id,
      timestamp: claim.createdAt,
      kind: 'risk_analysis',
      verdict: 'Unverified',
      actorId: 'system',
      actorRole: 'SYSTEM',
      note: `${claim.riskLevel} risk · ${claim.riskScore}`,
    },
    {
      id: `syn_${claim.id}_3`,
      claimId: claim.id,
      timestamp: claim.createdAt,
      kind: 'fingerprint_check',
      verdict: 'Unverified',
      actorId: 'system',
      actorRole: 'SYSTEM',
      note: claim.matchedClaimId
        ? `Match ${claim.matchedClaimId} · ${claim.similarityScore ?? 0}%`
        : 'No verified match',
    },
  ]
  for (const review of [...reviews].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )) {
    entries.push({
      id: `syn_${review.id}`,
      claimId: claim.id,
      timestamp: review.createdAt,
      kind: 'reviewer_decision',
      verdict: review.verdict,
      actorId: review.reviewerId,
      actorRole: review.reviewerRole ?? 'REVIEWER',
      perspective: review.perspective ?? null,
      note: review.note,
      resolutionPath: path,
    })
  }
  if (claim.verdict !== 'Unverified') {
    entries.push({
      id: `syn_${claim.id}_end`,
      claimId: claim.id,
      timestamp: claim.resolvedAt ?? claim.updatedAt,
      kind: 'resolved',
      verdict: claim.verdict,
      actorId: claim.reviewerId || 'system',
      actorRole: 'SYSTEM',
      note: `Published ${claim.verdict}`,
      resolutionPath: path,
    })
  }
  return entries
}
