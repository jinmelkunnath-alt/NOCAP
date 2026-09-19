import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSocial } from '../../context/SocialProvider'
import { useClaims } from '../../hooks/useClaims'
import { courtroomService } from '../../services/courtroomService'
import { riskService } from '../../services/riskService'
import { verificationService } from '../../services/verificationService'
import type { Claim } from '../../types'
import { Button } from '../ui/Button'
import { ForensicText } from '../risk/ForensicText'
import { RiskBreakdown } from '../risk/RiskBreakdown'
import { cn } from '../../utils/cn'
import { CommunityPulse } from './CommunityPulse'
import { CourtroomSummary } from './CourtroomSummary'
import { EvidencePreview } from './EvidencePreview'
import { HistoryPreview } from './HistoryPreview'
import { ResolutionPathVisual } from './ResolutionPathVisual'
import { ShareCardActions, ShareCardVisual } from './ShareCard'
import { WhyDrawer } from './WhyDrawer'

interface VerificationShieldProps {
  claim: Claim
  compact?: boolean
  showSummary?: boolean
}

const MARK: Record<Claim['verdict'], { symbol: string; label: string }> = {
  Unverified: { symbol: '⚠', label: 'Unverified' },
  'Verified True': { symbol: '✓', label: 'Verified True' },
  'Verified False': { symbol: '✕', label: 'Verified False' },
  Misleading: { symbol: '!', label: 'Misleading' },
}

const TONE: Record<Claim['verdict'], string> = {
  Unverified: 'border-amber/35 bg-amber-dim text-amber',
  'Verified True': 'border-green/35 bg-green-dim text-green',
  'Verified False': 'border-red/35 bg-red-dim text-red',
  Misleading: 'border-orange/35 bg-orange-dim text-orange',
}

export function VerificationShield({
  claim,
  compact = false,
  showSummary = false,
}: VerificationShieldProps) {
  const social = useSocial()
  const { claims } = useClaims()
  const [why, setWhy] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const reviews = useMemo(
    () => social.reviews.filter((item) => item.claimId === claim.id),
    [claim.id, social.reviews],
  )
  const path = verificationService.getResolutionPath(claim, claims, social.reviews)
  const summary = verificationService.getVerificationSummary(claim, claims, social.reviews)
  const session = courtroomService.latestFor(claim.id)
  const consensus = social.consensusFor(claim.id)
  const analysis = riskService.analysisFor(claim)
  const evidence = verificationService.getEvidenceSummary(claim)
  const steps = verificationService.getHistorySteps(claim, reviews)
  const poll = courtroomService.getPoll(claim.id)
  const pollVotes = poll ? courtroomService.pollVotes(poll.id) : []
  const mark = MARK[claim.verdict]
  const courtroomLabel = session ? 'Enter courtroom' : 'Start courtroom'

  return (
    <div>
      <div
        className={cn(
          'rounded-2xl border px-3 py-2',
          TONE[claim.verdict],
          claim.verdict !== 'Unverified' && 'shield-pulse',
        )}
        role="status"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            <span aria-hidden="true">{mark.symbol} </span>
            {mark.label}
          </p>
          <button
            type="button"
            className="text-[11px] font-medium underline-offset-2 hover:underline"
            onClick={() => setWhy(true)}
          >
            Why?
          </button>
        </div>
        {claim.verdict === 'Unverified' && (
          <p className={cn('mt-1', compact ? 'text-[11px]' : 'text-xs')}>
            Under Active Review. Do not share as fact.
          </p>
        )}
        {claim.verdict === 'Verified True' && (
          <p className={cn('mt-1', compact ? 'text-[11px]' : 'text-xs')}>
            NO CAP verification completed.
          </p>
        )}
        {claim.verdict === 'Verified False' && (
          <p className={cn('mt-1', compact ? 'text-[11px]' : 'text-xs')}>
            NO CAP verification completed.
          </p>
        )}
        {claim.verdict === 'Misleading' && (
          <p className={cn('mt-1', compact ? 'text-[11px]' : 'text-xs')}>
            The claim contains information that may be technically correct but lacks important
            context or could create a misleading impression.
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button to={`/claim/${claim.id}`} size="sm" variant="secondary">
            {claim.verdict === 'Unverified' ? 'View verification' : 'View verification'}
          </Button>
          {claim.verdict === 'Verified True' && (
            <button
              type="button"
              className="text-[11px] underline-offset-2 hover:underline"
              onClick={() => setWhy(true)}
            >
              How was this verified?
            </button>
          )}
          {claim.verdict === 'Verified False' && (
            <>
              {!compact && (
                <>
                  <Button to={`/claim/${claim.id}`} size="sm" variant="ghost">
                    View evidence
                  </Button>
                  <Button to={`/claim/${claim.id}`} size="sm" variant="ghost">
                    View verification history
                  </Button>
                </>
              )}
              <Button to="/reporting" size="sm" variant="ghost">
                Reporting desk
              </Button>
            </>
          )}
          {!compact && (
            <Button to={`/courtroom/${claim.id}`} size="sm" variant="ghost">
              {courtroomLabel}
            </Button>
          )}
          <button
            type="button"
            className="text-[11px] underline-offset-2 hover:underline"
            onClick={() => setShareOpen(true)}
          >
            Share shield
          </button>
        </div>
      </div>

      {showSummary && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-elevated/80 px-3 py-2">
            <ResolutionPathVisual path={path.resolutionPath} />
            <p className="mt-2 text-[11px] text-mute">{path.detail}</p>
          </div>
          <CourtroomSummary claimId={claim.id} session={session} />
        </div>
      )}

      <WhyDrawer title={mark.label} open={why} onClose={() => setWhy(false)}>
        <p className="text-xs text-mute">
          Status {claim.verdict}. Official NO CAP verification is separate from community votes
          and the advisory AI courtroom.
        </p>
        <div>
          <p className="label-kicker">Resolution</p>
          <div className="mt-2">
            <ResolutionPathVisual path={path.resolutionPath} />
          </div>
          <p className="mt-2 text-xs text-mute">{path.detail}</p>
        </div>
        <div>
          <p className="label-kicker">Reviewer participation</p>
          <p className="mt-1 font-mono text-sm text-ink">
            {path.completed} / {path.required} · {path.latency}
          </p>
        </div>
        <EvidencePreview claimId={claim.id} items={evidence} />
        <div>
          <p className="label-kicker">Risk signals</p>
          <p className="mt-1 font-mono text-sm text-ink">
            {claim.riskScore} / 100 · {claim.riskLevel.toUpperCase()}
          </p>
          <p className="mt-1 text-[11px] text-faint">
            This score represents observable risk signals. It does not represent truth probability,
            fake probability, or AI confidence.
          </p>
          <div className="mt-3">
            <RiskBreakdown analysis={analysis} />
          </div>
          <div className="mt-3">
            <ForensicText text={claim.text} analysis={analysis} />
          </div>
        </div>
        {claim.matchedClaimId && (
          <p className="text-xs text-mute">
            Fingerprint relationship: matched {claim.matchedClaimId}
            {typeof claim.similarityScore === 'number' ? ` · ${claim.similarityScore}%` : ''}.
            Similarity is retrieval, not proof.
          </p>
        )}
        <div>
          <p className="label-kicker">Review history</p>
          <div className="mt-2">
            <HistoryPreview steps={steps} />
          </div>
        </div>
        <CourtroomSummary claimId={claim.id} session={session} />
        <CommunityPulse consensus={consensus} poll={poll} pollVotes={pollVotes} />
        <Link to={`/claim/${claim.id}`} className="text-xs text-cyan hover:underline">
          Open the full record
        </Link>
      </WhyDrawer>

      <WhyDrawer title="Shareable verification shield" open={shareOpen} onClose={() => setShareOpen(false)}>
        <ShareCardVisual claim={claim} summary={summary} />
        <ShareCardActions
          text={verificationService.shareCopy(claim, claims, social.reviews)}
          onClose={() => setShareOpen(false)}
        />
      </WhyDrawer>
    </div>
  )
}
