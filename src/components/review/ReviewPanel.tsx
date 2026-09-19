import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ContributedEvidence } from '../courtroom/ContributedEvidence'
import { PrepareIncidentButton } from '../reporting/PrepareIncidentButton'
import { useSocial } from '../../context/SocialProvider'
import { reviewService } from '../../services/reviewService'
import { riskService } from '../../services/riskService'
import { sessionService } from '../../services/sessionService'
import type { Claim, Review, Verdict } from '../../types'
import { deriveResolutionPath, verificationPath } from '../../utils/verificationPath'
import { CategoryBadge } from '../badges/CategoryBadge'
import { PlatformBadge } from '../badges/PlatformBadge'
import { RiskBadge } from '../badges/RiskBadge'
import { RiskFlagBadge } from '../badges/RiskFlagBadge'
import { ForensicText } from '../risk/ForensicText'
import { RelatedClaim } from '../risk/RelatedClaim'
import { RiskBreakdown } from '../risk/RiskBreakdown'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { BridgingStatus } from './BridgingStatus'
import { FingerprintReuseCard } from './FingerprintReuseCard'
import { ResolutionBadge } from './ResolutionBadge'

interface ReviewPanelProps {
  claim: Claim
  reviews: Review[]
  catalog: Claim[]
  onPublished?: (claimId: string) => void
}

const VERDICT_OPTIONS: Array<{ value: Verdict; hint: string }> = [
  { value: 'Verified True', hint: 'The claim is accurate as stated.' },
  { value: 'Verified False', hint: 'The claim is factually false.' },
  { value: 'Misleading', hint: 'The claim mixes facts with distortion.' },
  { value: 'Unverified', hint: 'Keep unverified — not a resolution.' },
]

export function ReviewPanel({ claim, reviews, catalog, onPublished }: ReviewPanelProps) {
  const social = useSocial()
  const desk = sessionService.getDeskReviewer()
  const analysis = riskService.analysisFor(claim)
  const path = verificationPath(claim, catalog, reviews)
  const related = claim.matchedClaimId
    ? catalog.find((item) => item.id === claim.matchedClaimId)
    : undefined
  const comments = social.commentsFor(claim.id)
  const evidenceComments = comments.filter((item) => item.type === 'EVIDENCE')
  const consensus = social.consensusFor(claim.id)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [note, setNote] = useState('')
  const [certainty, setCertainty] = useState(80)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceTitle, setEvidenceTitle] = useState('')
  const [evidenceNote, setEvidenceNote] = useState('')
  const [reopenNote, setReopenNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolved = claim.verdict !== 'Unverified'
  const reuse = deriveResolutionPath(claim) === 'FINGERPRINT_REUSE'
  const bridging = deriveResolutionPath(claim) === 'BRIDGING_VERIFICATION'

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!verdict) {
      setError('Select a verdict before submitting.')
      return
    }
    if (note.trim().length < 12) {
      setError('Add a reviewer note of at least 12 characters.')
      return
    }
    setSubmitting(true)
    try {
      await reviewService.createReview({
        claimId: claim.id,
        reviewerId: desk.id,
        note,
        verdict,
        confidence: certainty,
        evidence: evidenceUrl.trim()
          ? [{ url: evidenceUrl, title: evidenceTitle, description: evidenceNote }]
          : [],
      })
      onPublished?.(claim.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReopen() {
    setError(null)
    setSubmitting(true)
    try {
      await reviewService.reopen(claim.id, reopenNote)
      onPublished?.(claim.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reopen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="label-kicker">Claim under review</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{claim.text}</p>
        {claim.sourceUrl ? (
          <a href={claim.sourceUrl} className="mt-2 block truncate text-xs text-cyan" target="_blank" rel="noreferrer">
            {claim.sourceUrl}
          </a>
        ) : (
          <p className="mt-2 text-xs text-faint">No source URL</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <RiskBadge level={claim.riskLevel} score={claim.riskScore} />
          <PlatformBadge platform={claim.platform} />
          <CategoryBadge category={claim.category} />
          {claim.flags.map((flag) => (
            <RiskFlagBadge key={flag} flag={flag} />
          ))}
          <ResolutionBadge path={path.resolutionPath} latency={path.latency} />
        </div>
        <p className="mt-2 text-xs text-mute">
          Reviewing as {desk.displayName}
          {desk.perspective ? ` · Perspective ${desk.perspective}` : ''}
        </p>
      </div>

      {reuse && <FingerprintReuseCard claim={claim} previous={related ?? null} />}
      {bridging && <BridgingStatus claim={claim} reviews={reviews} />}

      <div>
        <p className="label-kicker">Risk analysis</p>
        <div className="mt-2">
          <RiskBreakdown analysis={analysis} />
        </div>
      </div>

      <div>
        <p className="label-kicker">Forensic text</p>
        <div className="mt-2">
          <ForensicText text={claim.text} analysis={analysis} />
        </div>
      </div>

      {claim.matchedClaimId && (
        <RelatedClaim
          matchedClaimId={claim.matchedClaimId}
          similarityScore={claim.similarityScore ?? 0}
          potentialDuplicate={Boolean(claim.potentialDuplicate)}
        />
      )}

      <div>
        <p className="label-kicker">Community context</p>
        <p className="mt-1 text-[11px] text-faint">Context only — not authoritative evidence and not the official verdict.</p>
        <p className="mt-2 text-sm text-ink">
          {consensus.total} votes · {consensus.total === 0 ? 'no participation yet' : `${Math.round((consensus.agree / consensus.total) * 100)}% Agree`}
        </p>
        <p className="mt-1 text-xs text-mute">{comments.length} comments · {evidenceComments.length} marked evidence</p>
        {comments.slice(0, 3).map((item) => (
          <p key={item.id} className="mt-2 text-xs text-mute">
            <span className="font-semibold text-ink">[{item.type}]</span> {item.text}
          </p>
        ))}
      </div>

      {(claim.candidateSources?.length ?? 0) > 0 && (
        <div>
          <p className="label-kicker">Candidate sources</p>
          <p className="mt-1 text-[11px] text-faint">Inspected by reviewers. Never auto-converted into a verdict.</p>
          <ul className="mt-2 flex flex-col gap-2">
            {claim.candidateSources?.map((item) => (
              <li key={item.id} className="rounded-xl border border-dashed border-line px-3 py-2 text-xs">
                <p className="font-semibold uppercase tracking-wider text-orange">Candidate source</p>
                <p className="mt-1 text-ink">{item.title}</p>
                <a href={item.url} className="text-cyan" target="_blank" rel="noreferrer">
                  {item.url}
                </a>
                {item.description && <p className="mt-1 text-mute">{item.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {claim.evidence.length > 0 && (
        <div>
          <p className="label-kicker">Attached evidence</p>
          <ul className="mt-2 flex flex-col gap-1 text-xs">
            {claim.evidence.map((item) => (
              <li key={item.id}>
                <a href={item.url} className="text-cyan" target="_blank" rel="noreferrer">
                  {item.title || item.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ContributedEvidence claimId={claim.id} />

      <Link to={`/courtroom/${claim.id}`} className="text-xs text-cyan hover:underline">
        Enter NO CAP Courtroom
      </Link>

      {resolved ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">
            Current official verdict: <span className="font-semibold">{claim.verdict}</span>
          </p>
          <Textarea
            id="reopen-note"
            name="reopenNote"
            label="Reopen note"
            value={reopenNote}
            onChange={(event) => setReopenNote(event.target.value)}
            rows={3}
            placeholder="Why this record should be examined again."
          />
          {error && (
            <p className="rounded-xl border border-red/40 bg-red-dim px-3 py-2 text-sm text-red" role="alert">
              {error}
            </p>
          )}
          <Button type="button" variant="secondary" loading={submitting} onClick={() => void handleReopen()}>
            Reopen / review again
          </Button>
          <Button to={`/claim/${claim.id}`} size="sm" variant="ghost">
            Open public record
          </Button>
          <PrepareIncidentButton claim={claim} />
        </div>
      ) : reuse ? (
        <p className="text-sm text-mute">
          This record was resolved by fingerprint reuse. Reopen it from Recently resolved if new information appears.
        </p>
      ) : (
        <form onSubmit={handlePublish} className="flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-mute">Verdict</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {VERDICT_OPTIONS.map((option) => {
                const selected = verdict === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVerdict(option.value)}
                    aria-pressed={selected}
                    className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                      selected
                        ? option.value === 'Verified True'
                          ? 'border-green bg-green-dim text-green'
                          : option.value === 'Verified False'
                            ? 'border-red bg-red-dim text-red'
                            : option.value === 'Misleading'
                              ? 'border-orange bg-orange-dim text-orange'
                              : 'border-line bg-elevated text-ink'
                        : 'border-line bg-elevated text-ink hover:bg-hover'
                    }`}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wider">
                      {option.value === 'Unverified' ? 'Keep unverified' : option.value}
                    </span>
                    <span className="mt-1 block text-[11px] text-mute">{option.hint}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Textarea
            id="reviewer-note"
            name="reviewerNote"
            label="Review note"
            hint="Required. Explain the human decision. Shown on the public record."
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            required
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-mute">
              Reviewer certainty <span className="font-mono text-ink">{certainty}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={certainty}
              onChange={(event) => setCertainty(Number(event.target.value))}
              className="w-full accent-cyan"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={certainty}
            />
            <span className="text-[11px] text-faint">Human-entered metadata. Not AI confidence.</span>
          </label>

          <fieldset className="grid gap-3">
            <legend className="text-xs font-medium text-mute">Evidence</legend>
            <p className="text-[11px] text-faint">URLs are not automatically treated as proof.</p>
            <Input
              id="evidence-url"
              name="evidenceUrl"
              type="url"
              label="Evidence URL"
              placeholder="https://"
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
            />
            <Input
              id="evidence-title"
              name="evidenceTitle"
              label="Evidence title"
              placeholder="Source name"
              value={evidenceTitle}
              onChange={(event) => setEvidenceTitle(event.target.value)}
            />
            <Input
              id="evidence-note"
              name="evidenceNote"
              label="Why relevant"
              placeholder="How this source addresses the claim"
              value={evidenceNote}
              onChange={(event) => setEvidenceNote(event.target.value)}
            />
          </fieldset>

          {error && (
            <p className="rounded-xl border border-red/40 bg-red-dim px-3 py-2 text-sm text-red" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" loading={submitting} disabled={submitting}>
            {submitting ? 'Submitting' : 'Submit review'}
          </Button>
          <Link to={`/claim/${claim.id}`} className="text-xs text-cyan hover:underline">
            Open public record
          </Link>
        </form>
      )}
    </div>
  )
}
