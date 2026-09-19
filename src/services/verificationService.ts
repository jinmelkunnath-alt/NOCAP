import type {
  Claim,
  CommunityConsensus,
  EvidencePreviewItem,
  HistoryStep,
  Review,
  VerificationPath,
  VerificationSummary,
} from '../types'
import { courtroomService } from './courtroomService'
import { riskService } from './riskService'
import { socialService } from './socialService'
import { verificationPath } from '../utils/verificationPath'

export function getResolutionPath(
  claim: Claim,
  catalog: Claim[],
  reviews: Review[],
): VerificationPath {
  return verificationPath(claim, catalog, reviews)
}

export function getCommunitySummary(claimId: string): CommunityConsensus {
  return socialService.getConsensus(claimId)
}

export function getEvidenceSummary(claim: Claim): EvidencePreviewItem[] {
  const userEvidence = courtroomService.userEvidenceFor(claim.id)
  return [
    {
      id: 'source',
      label: 'Source URL',
      present: claim.sourceUrl.trim().length > 0,
    },
    {
      id: 'reviewer-evidence',
      label: 'Reviewer-supplied evidence',
      present: claim.evidence.length > 0,
    },
    {
      id: 'reviewer-note',
      label: 'Reviewer note',
      present: claim.reviewerNote.trim().length > 0,
    },
    {
      id: 'related',
      label: 'Related claim history',
      present: Boolean(claim.matchedClaimId),
    },
    {
      id: 'community-evidence',
      label: 'Community evidence (unverified)',
      present: userEvidence.length > 0,
    },
  ]
}

export function getHistorySteps(claim: Claim, reviews: Review[]): HistoryStep[] {
  const path = claim.resolutionPath
  const resolved = claim.verdict !== 'Unverified'
  const humanReviews = reviews.filter((item) => item.reviewerRole !== 'SYSTEM')
  const reviewed = humanReviews.length > 0 || (resolved && path !== 'FINGERPRINT_REUSE')

  if (path === 'FINGERPRINT_REUSE') {
    return [
      { id: 'submitted', label: 'Submitted', done: true },
      { id: 'match', label: 'Fingerprint match', done: true },
      { id: 'reused', label: 'Previous verification reused', done: true },
      { id: 'status', label: resolved ? claim.verdict : 'Unverified', done: resolved },
    ]
  }

  if (path === 'BRIDGING_VERIFICATION') {
    return [
      { id: 'submitted', label: 'Submitted', done: true },
      { id: 'risk', label: 'Risk analyzed', done: true },
      { id: 'reviewed', label: 'Reviewed', done: reviewed },
      {
        id: 'consensus',
        label: claim.consensusState === 'conflict' ? 'Consensus not reached' : 'Consensus reached',
        done: claim.consensusState === 'reached' && resolved,
      },
      { id: 'status', label: resolved ? claim.verdict : 'Unverified', done: resolved },
    ]
  }

  return [
    { id: 'submitted', label: 'Submitted', done: true },
    { id: 'risk', label: 'Risk analyzed', done: true },
    { id: 'reviewed', label: 'Reviewed', done: reviewed || resolved },
    { id: 'status', label: resolved ? claim.verdict : 'Unverified', done: resolved },
  ]
}

export function getVerificationSummary(
  claim: Claim,
  catalog: Claim[],
  reviews: Review[],
): VerificationSummary {
  const path = verificationPath(claim, catalog, reviews)
  const consensus = socialService.getConsensus(claim.id)
  const session = courtroomService.latestFor(claim.id)
  const claimReviews = reviews.filter((item) => item.claimId === claim.id)
  return {
    claimId: claim.id,
    verdict: claim.verdict,
    resolutionPath: path.resolutionPath,
    latency: path.latency,
    required: path.required,
    completed: path.completed,
    communityVotes: consensus.total,
    communityAgree: consensus.agree,
    communityDisagree: consensus.disagree,
    communityUnsure: consensus.unsure,
    courtroomLeaning: session?.judge.leaning ?? null,
    courtroomHearing: session?.hearingNumber ?? null,
    riskLevel: claim.riskLevel,
    riskScore: claim.riskScore,
    flags: claim.flags,
    evidenceCount: claim.evidence.length,
    reviewCount: claimReviews.length,
    hasCourtroom: Boolean(session),
  }
}

export function shareCopy(claim: Claim, catalog: Claim[], reviews: Review[]): string {
  const path = verificationPath(claim, catalog, reviews)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://truthlens.local'
  const lines = [
    'NO CAP',
    claim.verdict.toUpperCase(),
    `"${claim.text}"`,
    `Resolution: ${path.label}`,
    claim.verdict === 'Unverified'
      ? 'Under Active Review. Do not share as fact.'
      : 'NO CAP verification completed.',
    `Open in NO CAP: ${origin}/claim/${claim.id}`,
  ]
  return lines.join('\n')
}

export const verificationService = {
  getVerificationSummary,
  getResolutionPath,
  getCommunitySummary,
  getEvidenceSummary,
  getHistorySteps,
  shareCopy,
  analysisFor: riskService.analysisFor,
}
