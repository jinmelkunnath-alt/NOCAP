import type {
  Claim,
  ConsensusState,
  ResolutionPath,
  Review,
  Verdict,
  VerificationPath,
} from '../types'

export interface PerspectiveSnapshot {
  perspectiveA: Verdict | 'pending'
  perspectiveB: Verdict | 'pending'
  completed: number
  consensusState: ConsensusState
  matching: boolean
}

function latestFor(
  reviews: Review[],
  claimId: string,
  perspective: 'A' | 'B',
): Review | undefined {
  return reviews
    .filter(
      (item) =>
        item.claimId === claimId &&
        item.perspective === perspective &&
        item.verdict !== 'Unverified' &&
        item.reviewerRole !== 'SYSTEM',
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
}

export function consensusForClaim(claim: Claim, reviews: Review[]): PerspectiveSnapshot {
  const a = latestFor(reviews, claim.id, 'A')
  const b = latestFor(reviews, claim.id, 'B')
  const perspectiveA: Verdict | 'pending' = a ? a.verdict : 'pending'
  const perspectiveB: Verdict | 'pending' = b ? b.verdict : 'pending'
  const completed = (a ? 1 : 0) + (b ? 1 : 0)

  if (claim.resolutionPath === 'FINGERPRINT_REUSE' || claim.consensusState === 'reused') {
    return {
      perspectiveA,
      perspectiveB,
      completed,
      consensusState: 'reused',
      matching: false,
    }
  }

  if (claim.riskLevel !== 'High') {
    const singleDone = claim.verdict !== 'Unverified'
    return {
      perspectiveA,
      perspectiveB,
      completed: singleDone ? 1 : 0,
      consensusState: singleDone ? 'single' : 'none',
      matching: false,
    }
  }

  if (a && b && a.verdict === b.verdict) {
    return { perspectiveA, perspectiveB, completed, consensusState: 'reached', matching: true }
  }
  if (a && b && a.verdict !== b.verdict) {
    return { perspectiveA, perspectiveB, completed, consensusState: 'conflict', matching: false }
  }
  if (completed === 1) {
    return { perspectiveA, perspectiveB, completed, consensusState: 'awaiting', matching: false }
  }
  return { perspectiveA, perspectiveB, completed, consensusState: 'none', matching: false }
}

export function deriveResolutionPath(claim: Claim): ResolutionPath {
  if (claim.resolutionPath) return claim.resolutionPath
  if (claim.potentialDuplicate && claim.verdict !== 'Unverified') return 'FINGERPRINT_REUSE'
  if (claim.riskLevel === 'High') return 'BRIDGING_VERIFICATION'
  return 'FAST_SINGLE_REVIEW'
}

export function verificationPath(
  claim: Claim,
  catalog: Claim[],
  reviews: Review[],
): VerificationPath {
  const matched = claim.matchedClaimId
    ? catalog.find((item) => item.id === claim.matchedClaimId)
    : undefined
  const path = deriveResolutionPath(claim)
  const snapshot = consensusForClaim(claim, reviews)

  if (path === 'FINGERPRINT_REUSE') {
    return {
      kind: 'fingerprint-reuse',
      required: 0,
      completed: 1,
      label: 'Fingerprint reuse',
      detail: matched
        ? `Previous verification found on ${matched.id}. Deterministic text similarity.`
        : 'Resolved from a strong verified fingerprint match.',
      resolutionPath: path,
      latency: 'INSTANT',
      consensusState: 'reused',
      perspectiveA: snapshot.perspectiveA,
      perspectiveB: snapshot.perspectiveB,
    }
  }

  if (path === 'BRIDGING_VERIFICATION') {
    const required = 2
    const done = snapshot.completed
    let detail = `${done} / ${required} required perspectives`
    if (snapshot.consensusState === 'conflict') {
      detail = 'Consensus not reached. Claim stays Unverified.'
    } else if (snapshot.consensusState === 'awaiting') {
      detail = `${done} / ${required} required perspectives · Awaiting second perspective`
    } else if (snapshot.consensusState === 'reached') {
      detail = `${done} / ${required} required perspectives`
    }
    return {
      kind: 'bridging-consensus',
      required,
      completed: done,
      label: 'Bridging verification',
      detail,
      resolutionPath: path,
      latency: 'REVIEW REQUIRED',
      consensusState: snapshot.consensusState,
      perspectiveA: snapshot.perspectiveA,
      perspectiveB: snapshot.perspectiveB,
    }
  }

  return {
    kind: 'single-reviewer',
    required: 1,
    completed: claim.verdict === 'Unverified' ? 0 : 1,
    label: 'Fast single review',
    detail:
      claim.verdict === 'Unverified' ? '0 / 1 required reviewers' : '1 / 1 required reviewers',
    resolutionPath: path,
    latency: claim.verdict === 'Unverified' ? 'FAST' : 'FAST',
    consensusState: snapshot.consensusState,
    perspectiveA: snapshot.perspectiveA,
    perspectiveB: snapshot.perspectiveB,
  }
}
