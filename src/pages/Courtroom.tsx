import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArgumentCard } from '../components/courtroom/ArgumentCard'
import { EvidenceBoard } from '../components/courtroom/EvidenceBoard'
import { JudgePanel } from '../components/courtroom/JudgePanel'
import { Pipeline } from '../components/courtroom/Pipeline'
import { PollPanel } from '../components/courtroom/PollPanel'
import { ThreeSignals } from '../components/courtroom/ThreeSignals'
import { VerificationShield } from '../components/shield/VerificationShield'
import { ClaimMetadata } from '../components/claim/ClaimMetadata'
import { BridgingStatus } from '../components/review/BridgingStatus'
import { RelatedClaim } from '../components/risk/RelatedClaim'
import { ForensicText } from '../components/risk/ForensicText'
import { RiskBreakdown } from '../components/risk/RiskBreakdown'
import { CommentSection } from '../components/social/CommentSection'
import { VoteBar } from '../components/social/VoteBar'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSocial } from '../context/SocialProvider'
import { useClaim } from '../hooks/useClaim'
import { useClaims } from '../hooks/useClaims'
import { useCourtroom } from '../hooks/useCourtroom'
import { courtroomService } from '../services/courtroomService'
import { riskService } from '../services/riskService'
import { formatTimestamp } from '../utils/format'
import { deriveResolutionPath } from '../utils/verificationPath'

export function CourtroomPage() {
  const { claimId } = useParams()
  const { claim, loading, error } = useClaim(claimId)
  const { claims } = useClaims()
  const social = useSocial()
  const courtroom = useCourtroom(claimId)
  const [hearingId, setHearingId] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!claim) return
    if (claim.uploadType === 'ai' && courtroom.sessions.length === 0) {
      courtroomService.ensureSession(claim.id)
    }
  }, [claim, courtroom.sessions.length])

  useEffect(() => {
    if (courtroom.latest && !hearingId) setHearingId(courtroom.latest.id)
  }, [courtroom.latest, hearingId])

  const session = useMemo(() => {
    if (hearingId) {
      return courtroom.sessions.find((item) => item.id === hearingId) ?? courtroom.latest
    }
    return courtroom.latest
  }, [courtroom.latest, courtroom.sessions, hearingId])

  if (loading) return <LoadingState label="Loading courtroom" />

  if (!claim) {
    return (
      <div>
        <ErrorState
          title="Claim not found"
          message={error ?? `There is no claim with ID “${claimId ?? ''}”.`}
          action={
            <Button to="/" variant="secondary" size="sm">
              Back to feed
            </Button>
          }
        />
      </div>
    )
  }

  const record = claim
  const analysis = riskService.analysisFor(record)
  const related = record.matchedClaimId
    ? claims.find((item) => item.id === record.matchedClaimId)
    : undefined
  const consensus = social.consensusFor(record.id)
  const currentVote = social.voteFor(record.id)
  const claimReviews = social.reviews.filter((item) => item.claimId === record.id)
  const bridging = deriveResolutionPath(record) === 'BRIDGING_VERIFICATION'
  const isAuthor = record.authorId === social.currentUser.id
  const showHearing = started || courtroom.sessions.length > 0

  function beginHearing() {
    setRunning(true)
    try {
      const next = courtroom.latest ?? courtroomService.createHearing(record.id)
      setHearingId(next.id)
      setStarted(true)
    } finally {
      setRunning(false)
    }
  }

  function runNewHearing() {
    setRunning(true)
    try {
      const next = courtroomService.createHearing(record.id)
      setHearingId(next.id)
      setStarted(true)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button to={`/claim/${claim.id}`} variant="secondary" size="sm">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Verification record
        </Button>
        <Button to="/" variant="ghost" size="sm">
          Feed
        </Button>
      </div>

      <header className="glass-card float-up border-emerald-200/60 bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 p-6 sm:p-7 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-full px-2.5 py-0.5">
            EVIDENCE WORKSPACE · ADVISORY AI
          </span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          NO <span className="text-[#EF3340]">CAP</span> Courtroom
        </h1>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
          Structured argumentation and evidence analysis. The AI Judge offers provisional deliberation assistance; official verdicts remain certified by human reviewers.
        </p>
        <div className="mt-5">
          <Pipeline active={showHearing && session ? 'AI Judge' : 'Claim'} />
        </div>
      </header>

      <div className="mt-5">
        <VerificationShield claim={record} compact />
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <p className="label-kicker text-red">Under Examination</p>
            <p className="mt-2 text-base font-semibold leading-relaxed text-slate-900">{claim.text}</p>
            {claim.sourceUrl.trim() ? (
              <a
                href={claim.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block truncate text-xs text-emerald-700 hover:underline"
              >
                {claim.sourceUrl}
              </a>
            ) : (
              <p className="mt-1 text-xs text-slate-400">No external source URL attached.</p>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <ClaimMetadata claim={claim} />
          <p className="mt-3 text-[11px] text-slate-400 font-mono">
            Official ledger verdict: <strong className="text-slate-700">{claim.verdict}</strong> · Triage risk score: {claim.riskScore}/100
          </p>
          {!showHearing && (
            <div className="mt-4">
              <Button type="button" onClick={beginHearing} loading={running} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                Begin Argumentation Hearing
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {showHearing && session && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-mute">
              Hearing #{session.hearingNumber}
              <span className="ml-2 font-mono text-faint">
                <time dateTime={session.createdAt}>{formatTimestamp(session.createdAt)}</time>
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {courtroom.sessions.length > 1 && (
                <label className="flex items-center gap-2 text-xs text-mute">
                  Prior hearings
                  <select
                    className="h-8 rounded-xl border border-line bg-panel px-2 text-xs text-ink"
                    value={session.id}
                    onChange={(event) => setHearingId(event.target.value)}
                  >
                    {courtroom.sessions.map((item) => (
                      <option key={item.id} value={item.id}>
                        #{item.hearingNumber} · {item.judge.leaning}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Button type="button" size="sm" variant="secondary" loading={running} onClick={runNewHearing}>
                Run new hearing
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-faint">
            New hearings append. Prior sessions stay on the record.
          </p>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium text-ink">Forensic scan</h2>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <ForensicText text={claim.text} analysis={analysis} />
              <RiskBreakdown analysis={analysis} />
              <p className="text-[11px] text-faint">
                Same Phase 3 rule engine as the rest of NO CAP. Not an AI truth score.
              </p>
            </CardBody>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <ArgumentCard argument={session.prosecutor} />
            <ArgumentCard argument={session.defender} />
          </div>

          <EvidenceBoard claimId={claim.id} items={courtroom.board} />

          <JudgePanel ruling={session.judge} />

          <ThreeSignals claim={claim} session={session} consensus={consensus} />

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium text-ink">Community votes</h2>
            </CardHeader>
            <CardBody>
              <VoteBar claimId={claim.id} consensus={consensus} current={currentVote?.type ?? null} />
            </CardBody>
          </Card>

          <PollPanel
            claimId={claim.id}
            poll={courtroom.poll}
            votes={courtroom.pollVotes}
            myVote={courtroom.myVote}
            isAuthor={isAuthor}
          />

          {bridging && <BridgingStatus claim={claim} reviews={claimReviews} />}

          {claim.matchedClaimId && (
            <RelatedClaim
              matchedClaimId={claim.matchedClaimId}
              similarityScore={claim.similarityScore ?? 0}
              potentialDuplicate={Boolean(claim.potentialDuplicate)}
            />
          )}
          {related && (
            <p className="text-xs text-mute">
              Related claim {related.id} is stored as {related.verdict}. Similarity is not identity.
            </p>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium text-ink">Discussion</h2>
            </CardHeader>
            <CardBody>
              <CommentSection claimId={claim.id} />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
