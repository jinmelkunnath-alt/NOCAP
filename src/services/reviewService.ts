import type { Claim, CreateReviewInput, Perspective, Review } from '../types'
import { createId } from '../utils/format'
import { consensusForClaim, deriveResolutionPath } from '../utils/verificationPath'
import { claimService } from './claimService'
import { emitClaimsChanged } from './dataEvents'
import { ledgerService } from './ledgerService'
import { notificationService } from './notificationService'
import { reportingService } from './reportingService'
import { sessionService } from './sessionService'
import { storageService } from './storageService'

function evidenceFrom(input: CreateReviewInput['evidence']) {
  return input
    .filter((item) => item.url.trim().length > 0)
    .map((item) => ({
      id: createId('ev'),
      url: item.url.trim(),
      ...(item.title?.trim() ? { title: item.title.trim() } : {}),
      ...(item.description?.trim() ? { description: item.description.trim() } : {}),
    }))
}

function notifyAuthor(claim: Claim, title: string, body: string) {
  if (!claim.authorId) return
  notificationService.push({ userId: claim.authorId, claimId: claim.id, title, body })
}

export const reviewService = {
  getReviews(): Promise<Review[]> {
    return Promise.resolve(storageService.getStoredReviews())
  },

  getReviewsForClaim(claimId: string): Promise<Review[]> {
    return Promise.resolve(
      storageService.getStoredReviews().filter((review) => review.claimId === claimId),
    )
  },

  async createReview(input: CreateReviewInput): Promise<Review> {
    const claim = await claimService.getClaimById(input.claimId)
    if (!claim) {
      throw new Error(`Claim ${input.claimId} was not found.`)
    }

    const desk = sessionService.getDeskReviewer()
    const reviewerId = input.reviewerId || desk.id
    const perspective: Perspective | null = desk.perspective ?? null
    const now = new Date().toISOString()
    const evidence = evidenceFrom(input.evidence)
    const path = deriveResolutionPath(claim)
    const note = input.note.trim()
    if (note.length < 12) {
      throw new Error('Add a reviewer note of at least 12 characters.')
    }

    const review: Review = {
      id: createId('rev'),
      claimId: input.claimId,
      reviewerId,
      verdict: input.verdict,
      note,
      confidence: input.confidence,
      evidence,
      createdAt: now,
      reviewerRole: 'REVIEWER',
      perspective,
    }

    const reviews = storageService.getStoredReviews()
    storageService.saveReviews([review, ...reviews])

    ledgerService.append({
      claimId: claim.id,
      kind: 'reviewer_decision',
      note: `${desk.displayName}${perspective ? ` (Perspective ${perspective})` : ''}: ${input.verdict}. ${note}`,
      actorId: reviewerId,
      actorRole: 'REVIEWER',
      perspective,
      verdict: input.verdict,
      resolutionPath: path,
      timestamp: now,
    })

    if (input.verdict === 'Unverified') {
      emitClaimsChanged()
      return review
    }

    if (path === 'FAST_SINGLE_REVIEW') {
      await claimService.updateClaim(claim.id, {
        verdict: input.verdict,
        reviewerNote: note,
        reviewerId,
        evidence: evidence.length ? evidence : claim.evidence,
        confidence: input.confidence ?? null,
        resolutionPath: 'FAST_SINGLE_REVIEW',
        consensusState: 'single',
        resolvedAt: now,
      })
      ledgerService.append({
        claimId: claim.id,
        kind: 'resolved',
        note: 'Resolved by fast single review.',
        actorId: reviewerId,
        actorRole: 'REVIEWER',
        perspective,
        verdict: input.verdict,
        resolutionPath: 'FAST_SINGLE_REVIEW',
        timestamp: now,
      })
      notifyAuthor(
        claim,
        'Your claim received a verification update.',
        `NO CAP published ${input.verdict} via fast single review.`,
      )
      emitClaimsChanged()
      return review
    }

    const snapshot = consensusForClaim(claim, [review, ...reviews])

    if (snapshot.consensusState === 'reached' && snapshot.matching) {
      await claimService.updateClaim(claim.id, {
        verdict: input.verdict,
        reviewerNote: note,
        reviewerId,
        evidence: evidence.length ? evidence : claim.evidence,
        confidence: input.confidence ?? null,
        resolutionPath: 'BRIDGING_VERIFICATION',
        consensusState: 'reached',
        resolvedAt: now,
      })
      ledgerService.append({
        claimId: claim.id,
        kind: 'consensus_reached',
        note: 'Perspective A and Perspective B approved the same verdict.',
        actorId: reviewerId,
        actorRole: 'REVIEWER',
        perspective,
        verdict: input.verdict,
        resolutionPath: 'BRIDGING_VERIFICATION',
        timestamp: now,
      })
      ledgerService.append({
        claimId: claim.id,
        kind: 'resolved',
        note: 'Bridging consensus reached.',
        actorId: reviewerId,
        actorRole: 'REVIEWER',
        perspective,
        verdict: input.verdict,
        resolutionPath: 'BRIDGING_VERIFICATION',
        timestamp: now,
      })
      notifyAuthor(
        claim,
        'Consensus has been reached.',
        `NO CAP published ${input.verdict} after two independent perspectives agreed.`,
      )
    } else if (snapshot.consensusState === 'conflict') {
      await claimService.updateClaim(claim.id, {
        verdict: 'Unverified',
        reviewerNote: note,
        reviewerId,
        evidence: evidence.length ? [...claim.evidence, ...evidence] : claim.evidence,
        confidence: input.confidence ?? claim.confidence,
        resolutionPath: 'BRIDGING_VERIFICATION',
        consensusState: 'conflict',
        resolvedAt: null,
      })
      ledgerService.append({
        claimId: claim.id,
        kind: 'consensus_not_reached',
        note: `Perspective A: ${snapshot.perspectiveA}. Perspective B: ${snapshot.perspectiveB}. No automatic winner.`,
        actorId: reviewerId,
        actorRole: 'REVIEWER',
        perspective,
        verdict: 'Unverified',
        resolutionPath: 'BRIDGING_VERIFICATION',
        timestamp: now,
      })
      ledgerService.append({
        claimId: claim.id,
        kind: 'additional_review',
        note: 'Routed to additional review. Claim stays Unverified.',
        actorId: 'system',
        actorRole: 'SYSTEM',
        verdict: 'Unverified',
        resolutionPath: 'BRIDGING_VERIFICATION',
        timestamp: now,
      })
      notifyAuthor(
        claim,
        'Your claim remains unverified because reviewer perspectives disagree.',
        'NO CAP does not pick a winner. Additional review is required.',
      )
    } else {
      await claimService.updateClaim(claim.id, {
        verdict: 'Unverified',
        reviewerNote: note,
        reviewerId,
        evidence: evidence.length ? [...claim.evidence, ...evidence] : claim.evidence,
        confidence: input.confidence ?? claim.confidence,
        resolutionPath: 'BRIDGING_VERIFICATION',
        consensusState: 'awaiting',
        resolvedAt: null,
      })
      notifyAuthor(
        claim,
        'Your submitted claim is now under review.',
        `${snapshot.completed} / 2 required perspectives. Official status remains Unverified.`,
      )
    }

    emitClaimsChanged()
    return review
  },

  async reopen(claimId: string, note: string): Promise<Claim> {
    const claim = await claimService.getClaimById(claimId)
    if (!claim) throw new Error(`Claim ${claimId} was not found.`)
    if (claim.verdict === 'Unverified' && claim.consensusState !== 'conflict') {
      throw new Error('Only resolved claims can be reopened.')
    }
    const desk = sessionService.getDeskReviewer()
    const now = new Date().toISOString()
    const trimmed = note.trim() || 'Review reopened for additional examination.'
    const path = claim.riskLevel === 'High' ? 'BRIDGING_VERIFICATION' : 'FAST_SINGLE_REVIEW'

    ledgerService.append({
      claimId,
      kind: 'reopened',
      note: trimmed,
      actorId: desk.id,
      actorRole: 'REVIEWER',
      perspective: desk.perspective ?? null,
      verdict: 'Unverified',
      resolutionPath: path,
      timestamp: now,
    })

    const updated = await claimService.updateClaim(claimId, {
      verdict: 'Unverified',
      resolutionPath: path,
      consensusState: 'none',
      resolvedAt: null,
      reviewerNote: trimmed,
      reviewerId: desk.id,
    })
    notifyAuthor(
      claim,
      'Your claim received a verification update.',
      'A reviewer reopened this record. It is Unverified until a new resolution is published.',
    )
    reportingService.flagRevalidation(claimId)
    emitClaimsChanged()
    return updated
  },
}
