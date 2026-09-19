import { ArrowLeft, Sparkles } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { ClaimMetadata } from '../components/claim/ClaimMetadata'
import { ContributedEvidence } from '../components/courtroom/ContributedEvidence'
import { EvidenceList } from '../components/evidence/EvidenceList'
import { CommunityPulse } from '../components/shield/CommunityPulse'
import { DiscussionGlance } from '../components/shield/DiscussionGlance'
import { EvidencePreview } from '../components/shield/EvidencePreview'
import { HistoryPreview } from '../components/shield/HistoryPreview'
import { VerificationSummary } from '../components/shield/VerificationSummary'
import { CommentSection } from '../components/social/CommentSection'
import { RumourPostCard } from '../components/social/RumourPostCard'
import { RelatedClaim } from '../components/risk/RelatedClaim'
import { ForensicText } from '../components/risk/ForensicText'
import { RiskBreakdown } from '../components/risk/RiskBreakdown'
import { BridgingStatus } from '../components/review/BridgingStatus'
import { FingerprintReuseCard } from '../components/review/FingerprintReuseCard'
import { ResolutionBadge } from '../components/review/ResolutionBadge'
import { ReviewCard } from '../components/review/ReviewCard'
import { VerificationJourney } from '../components/review/VerificationJourney'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSocial } from '../context/SocialProvider'
import { useClaim } from '../hooks/useClaim'
import { useClaims } from '../hooks/useClaims'
import { courtroomService } from '../services/courtroomService'
import { riskService } from '../services/riskService'
import { verificationService } from '../services/verificationService'
import { communityAnalysisService } from '../services/communityAnalysisService'
import { CommunityAiCard } from '../components/checker/CommunityAiCard'
import { PollPanel } from '../components/courtroom/PollPanel'
import { formatTimestamp } from '../utils/format'
import { formatDuration } from '../utils/formatDuration'
import { deriveResolutionPath, verificationPath } from '../utils/verificationPath'

export function ClaimDetailPage() {
  const { id } = useParams()
  const { claim, loading, error } = useClaim(id)
  const { claims } = useClaims()
  const social = useSocial()

  if (loading) return <LoadingState label="Loading claim record" />

  if (!claim) {
    return (
      <div>
        <ErrorState
          title="Claim not found"
          message={error ?? `There is no claim with ID “${id ?? ''}”.`}
          action={
            <Button to="/feed" variant="secondary" size="sm">
              Back to feed
            </Button>
          }
        />
      </div>
    )
  }

  const analysis = riskService.analysisFor(claim)
  const similarCount = claim.similarSubmissionCount ?? 0
  const showRelated = Boolean(claim.matchedClaimId) && (claim.similarityScore ?? 0) > 0
  const author = claim.authorId ? social.userById.get(claim.authorId) : undefined
  const related = claim.matchedClaimId ? claims.find((item) => item.id === claim.matchedClaimId) : undefined
  const path = verificationPath(claim, claims, social.reviews)
  const consensus = social.consensusFor(claim.id)
  const poll = courtroomService.getPoll(claim.id)
  const pollVotes = poll ? courtroomService.pollVotes(poll.id) : []
  const claimReviews = social.reviews
    .filter((item) => item.claimId === claim.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const resolvedIn =
    claim.resolvedAt || claim.verdict !== 'Unverified'
      ? formatDuration(claim.createdAt, claim.resolvedAt ?? claim.updatedAt)
      : null
  const resolution = deriveResolutionPath(claim)
  const communityAi = communityAnalysisService.forClaim(claim.id)
  const analysisProgress = communityAnalysisService.progress(claim.id)
  const isAuthor = claim.authorId === social.currentUser.id
  const myPollVote = poll ? courtroomService.myPollVote(poll.id) : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
        <Button to="/feed" variant="secondary" size="sm">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to feed
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Dossier
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-700">
            {claim.id}
          </span>
        </div>
      </div>

      <RumourPostCard claim={claim} author={author} relatedClaim={related ?? null} />

      <div className="mt-6 flex flex-col gap-6">
        {communityAi ? (
          <CommunityAiCard analysis={communityAi} />
        ) : (
          <aside className="glass-card p-5 border-line/70">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                AI Community Synthesis
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Collecting Evidence
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              Community Synthesis Threshold In Progress
            </p>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              {analysisProgress.uniqueUsers} of {analysisProgress.needed} contributors recorded so far. Votes, substantive comments, and poll participation build the evidentiary corpus.
            </p>
            {analysisProgress.responseCount > 0 && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void communityAnalysisService.triggerServerSynthesize(claim.id)
                  }}
                  className="rounded-full text-xs font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                  Synthesize Community Evidence Now
                </Button>
              </div>
            )}
          </aside>
        )}

        <VerificationSummary
          summary={verificationService.getVerificationSummary(claim, claims, social.reviews)}
        />

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Compact history</h2>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <HistoryPreview steps={verificationService.getHistorySteps(claim, claimReviews)} />
            <EvidencePreview
              claimId={claim.id}
              items={verificationService.getEvidenceSummary(claim)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Community pulse</h2>
          </CardHeader>
          <CardBody>
            <CommunityPulse consensus={consensus} poll={poll} pollVotes={pollVotes} />
          </CardBody>
        </Card>

        <PollPanel
          claimId={claim.id}
          poll={poll}
          votes={pollVotes}
          myVote={myPollVote}
          isAuthor={isAuthor}
        />

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Community vs verification</h2>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label-kicker">Community</p>
              <p className="mt-2 text-sm text-mute">What people think. Not the official verdict.</p>
              {consensus.total === 0 ? (
                <p className="mt-2 text-sm text-faint">No community participation recorded yet.</p>
              ) : (
                <p className="mt-2 font-mono text-sm text-ink">
                  {consensus.total} votes
                  <br />
                  {Math.round((consensus.agree / consensus.total) * 100)}% Agree ·{' '}
                  {Math.round((consensus.disagree / consensus.total) * 100)}% Disagree ·{' '}
                  {Math.round((consensus.unsure / consensus.total) * 100)}% Unsure
                </p>
              )}
            </div>
            <div>
              <p className="label-kicker">NO CAP verification</p>
              <p className="mt-2 text-lg font-semibold text-ink">{claim.verdict}</p>
              <div className="mt-2">
                <ResolutionBadge path={path.resolutionPath} latency={path.latency} />
              </div>
              <p className="mt-2 text-sm text-mute">{path.detail}</p>
              {resolvedIn && (
                <p className="mt-2 font-mono text-[11px] text-faint">Resolved in {resolvedIn}</p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Risk analysis</h2>
          </CardHeader>
          <CardBody>
            <RiskBreakdown analysis={analysis} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Forensic text</h2>
          </CardHeader>
          <CardBody>
            <ForensicText text={claim.text} analysis={analysis} />
            <p className="mt-3 text-[11px] text-faint">
              Highlighting: sensational triggers (red) and shouting tokens (amber). Derived from
              analysis matches, not hardcoded positions.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Fingerprint / related claims</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <p className="text-sm text-mute">
              Similar submissions: <span className="font-mono text-ink">{similarCount}</span>
            </p>
            {showRelated && claim.matchedClaimId ? (
              <RelatedClaim
                matchedClaimId={claim.matchedClaimId}
                similarityScore={claim.similarityScore ?? 0}
                potentialDuplicate={Boolean(claim.potentialDuplicate)}
              />
            ) : (
              <p className="text-sm text-faint">No close variant was attached at submission time.</p>
            )}
          </CardBody>
        </Card>

        {resolution === 'FINGERPRINT_REUSE' && (
          <FingerprintReuseCard claim={claim} previous={related ?? null} />
        )}
        {resolution === 'BRIDGING_VERIFICATION' && (
          <BridgingStatus claim={claim} reviews={claimReviews} />
        )}

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Verification journey</h2>
          </CardHeader>
          <CardBody>
            <VerificationJourney claim={claim} reviews={claimReviews} />
            <p className="mt-4 text-[11px] text-faint">
              AI never autonomously declares True, False, or Misleading. The ledger is append-only.
            </p>
            <div className="mt-3">
              <ReviewCard claim={claim} />
            </div>
            <Button to="/review" size="sm" variant="secondary" className="mt-3">
              Open review desk
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Review history</h2>
          </CardHeader>
          <CardBody>
            {claimReviews.length === 0 ? (
              <p className="text-sm text-faint">No published reviews yet.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {claimReviews.map((review) => (
                  <li key={review.id} className="rounded-2xl bg-elevated px-3 py-2">
                    <p className="text-xs font-medium text-ink">{review.verdict}</p>
                    <p className="mt-1 text-sm text-mute">{review.note}</p>
                    <p className="mt-1 font-mono text-[11px] text-faint">
                      {review.reviewerId}
                      {review.perspective ? ` · perspective ${review.perspective}` : ''} ·{' '}
                      <time dateTime={review.createdAt}>{formatTimestamp(review.createdAt)}</time>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Metadata</h2>
          </CardHeader>
          <CardBody>
            <ClaimMetadata claim={claim} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Evidence</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <EvidenceList evidence={claim.evidence} />
            <ContributedEvidence claimId={claim.id} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Timeline</h2>
          </CardHeader>
          <CardBody>
            <ol className="flex flex-col gap-3 border-l border-line pl-4">
              <li>
                <p className="text-xs font-medium text-ink">Submitted</p>
                <p className="font-mono text-[11px] text-mute">
                  <time dateTime={claim.createdAt}>{formatTimestamp(claim.createdAt)}</time>
                </p>
              </li>
              <li>
                <p className="text-xs font-medium text-ink">Risk analysis recorded</p>
                <p className="text-xs text-mute">
                  {claim.riskLevel} risk · score {claim.riskScore} · {claim.flags.length} flag
                  {claim.flags.length === 1 ? '' : 's'}
                </p>
              </li>
              {claim.verdict !== 'Unverified' && (
                <li>
                  <p className="text-xs font-medium text-ink">Verdict published — {claim.verdict}</p>
                  <p className="font-mono text-[11px] text-mute">
                    <time dateTime={claim.updatedAt}>{formatTimestamp(claim.updatedAt)}</time>
                    {claim.reviewerId ? ` · ${claim.reviewerId}` : ''}
                  </p>
                </li>
              )}
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-ink">Comments</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <DiscussionGlance claimId={claim.id} />
            <CommentSection claimId={claim.id} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
