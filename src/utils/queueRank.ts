import type { Claim, ConsensusState, Review } from '../types'
import { consensusForClaim } from './verificationPath'

function ageHours(iso: string, now: number): number {
  return Math.max(0, (now - new Date(iso).getTime()) / 3_600_000)
}

export function queueRank(claim: Claim, reviews: Review[], now = Date.now()): number {
  const consensus = consensusForClaim(claim, reviews)
  const awaitingMissing =
    claim.riskLevel === 'High' &&
    claim.verdict === 'Unverified' &&
    (consensus.consensusState === 'awaiting' || consensus.completed === 1)
  const highNovel = claim.riskLevel === 'High' && claim.verdict === 'Unverified'
  const older = ageHours(claim.createdAt, now)

  if (awaitingMissing) return 4000 + older
  if (highNovel) return 3000 + older
  if (claim.verdict === 'Unverified') return 1000 + older
  return older
}

export function sortReviewQueue(claims: Claim[], reviews: Review[]): Claim[] {
  return [...claims].sort((a, b) => queueRank(b, reviews) - queueRank(a, reviews))
}

export function isOpenQueueItem(claim: Claim): boolean {
  if (claim.verdict !== 'Unverified') return false
  if (claim.resolutionPath === 'FINGERPRINT_REUSE') return false
  return true
}

export function needsPerspective(
  claim: Claim,
  reviews: Review[],
  perspective: 'A' | 'B' | null,
): boolean {
  if (!perspective) return true
  const consensus = consensusForClaim(claim, reviews)
  if (claim.riskLevel !== 'High' || claim.resolutionPath === 'FAST_SINGLE_REVIEW') return true
  const latest = perspective === 'A' ? consensus.perspectiveA : consensus.perspectiveB
  return latest === 'pending'
}

export type { ConsensusState }
