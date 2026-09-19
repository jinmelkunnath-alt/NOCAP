import type {
  Claim,
  CommunityConsensus,
  CourtArgument,
  CourtEvidence,
  CourtroomLeaning,
  JudgeRuling,
  Review,
  RiskAnalysis,
} from '../types'
import { riskService } from './riskService'

export interface CourtroomContext {
  claim: Claim
  analysis: RiskAnalysis
  related: Claim | null
  reviews: Review[]
  evidence: CourtEvidence[]
  consensus: CommunityConsensus
}

const INSUFFICIENT = 'Insufficient evidence available.'

function flagList(claim: Claim): string {
  return claim.flags.length ? claim.flags.join(', ') : 'none recorded'
}

function hasUrl(claim: Claim): boolean {
  return claim.sourceUrl.trim().length > 0
}

function reviewerNotes(reviews: Review[]): string[] {
  return reviews
    .map((item) => item.note.trim())
    .filter((note) => note.length > 0)
}

export function buildCourtroomContext(
  claim: Claim,
  related: Claim | null,
  reviews: Review[],
  evidence: CourtEvidence[],
  consensus: CommunityConsensus,
): CourtroomContext {
  return {
    claim,
    analysis: riskService.analysisFor(claim),
    related,
    reviews,
    evidence,
    consensus,
  }
}

export function generateProsecutorArgument(ctx: CourtroomContext): CourtArgument {
  const { claim, analysis, related, reviews, evidence, consensus } = ctx
  const argument: string[] = []
  const evidenceLines: string[] = []
  const reasoning: string[] = []
  const limitations: string[] = []

  argument.push(
    'The stored record does not establish this claim as a verified fact. Treat it as an assertion until human verification says otherwise.',
  )

  if (analysis.sensational.detected) {
    argument.push(
      `Sensational phrasing is recorded in the forensic scan: ${analysis.sensational.matches
        .map((item) => `"${item}"`)
        .join(', ')}. That is a triage signal, not proof the claim is false.`,
    )
  }
  if (analysis.shouting.detected) {
    argument.push(
      `Shouting tokens were detected (${Math.round(analysis.shouting.uppercasePercentage)}% uppercase). Emphasis is not evidence.`,
    )
  }
  if (analysis.unsourced.detected || !hasUrl(claim)) {
    argument.push('No valid source URL is stored on this claim. Unsourced assertions cannot carry the burden of proof.')
  }
  if (claim.verdict === 'Verified False' || claim.verdict === 'Misleading') {
    argument.push(
      `NO CAP already recorded an official status of ${claim.verdict}. This courtroom does not re-issue that status; it only notes the ledger.`,
    )
  }
  if (related && (related.verdict === 'Verified False' || related.verdict === 'Misleading')) {
    argument.push(
      `A related stored claim (${related.id}) carries status ${related.verdict}. Similarity is not identity, but it is a caution.`,
    )
  }
  if (consensus.total > 0 && consensus.disagree > consensus.agree) {
    argument.push(
      `Community votes currently lean Disagree (${consensus.disagree} of ${consensus.total}). Votes are not a verdict.`,
    )
  }

  if (hasUrl(claim)) {
    evidenceLines.push(`Submitted source field: ${claim.sourceUrl.trim()} — presence of a URL is not independent corroboration.`)
  } else {
    evidenceLines.push(INSUFFICIENT)
  }

  if (claim.evidence.length > 0) {
    for (const item of claim.evidence) {
      evidenceLines.push(
        `Reviewer-supplied item “${item.title}”${item.url ? ` (${item.url})` : ''} — listed on the claim, not independently checked here.`,
      )
    }
  }
  const userItems = evidence.filter((item) => item.type === 'USER_CONTRIBUTION')
  if (userItems.length > 0) {
    evidenceLines.push(
      `${userItems.length} user-contributed item(s) are on the evidence board and still marked needs-human-review.`,
    )
  }
  if (related) {
    evidenceLines.push(
      `Related claim ${related.id} (similarity ${claim.similarityScore ?? 'n/a'}%): “${related.text.slice(0, 140)}”`,
    )
  }

  reasoning.push(`Risk triage on this record is ${claim.riskLevel} (${claim.riskScore}/100). Risk is not a fake-probability.`)
  reasoning.push(`Recorded flags: ${flagList(claim)}.`)
  reasoning.push(`Official NO CAP status remains ${claim.verdict}. The prosecutor role cannot change it.`)
  if (reviews.length === 0) {
    reasoning.push('No human review notes are stored yet.')
  } else {
    reasoning.push(`${reviews.length} review note(s) exist on the ledger; they are human records, not AI findings.`)
  }

  limitations.push('DEMO AI COURTROOM. Arguments are assembled from stored claim fields only.')
  limitations.push('No live search, no invented studies, quotes, statistics, or named experts.')
  if (!hasUrl(claim) && claim.evidence.length === 0 && evidence.length === 0) {
    limitations.push(INSUFFICIENT)
  }

  return { role: 'prosecutor', argument, evidence: evidenceLines, reasoning, limitations }
}

export function generateDefenderArgument(ctx: CourtroomContext): CourtArgument {
  const { claim, analysis, related, reviews, evidence, consensus } = ctx
  const argument: string[] = []
  const evidenceLines: string[] = []
  const reasoning: string[] = []
  const limitations: string[] = []

  argument.push(
    'Absence of corroboration is not the same as a completed false finding. The stored record may still be incomplete rather than disproven.',
  )

  if (hasUrl(claim)) {
    argument.push(`A source URL is stored: ${claim.sourceUrl.trim()}. It has not been independently fetched in this demo.`)
  } else {
    argument.push('No source URL is stored. The defender cannot invent one. The claim may still be checkable if a source is later attached.')
  }

  if (!analysis.sensational.detected && !analysis.shouting.detected) {
    argument.push('The forensic scan did not flag sensational trigger phrases or shouting tokens on this text.')
  }
  if (claim.verdict === 'Verified True') {
    argument.push(
      'NO CAP already recorded Verified True on this claim. That is a human/ledger status. This courtroom does not copy it as an AI verdict.',
    )
  }
  if (related && related.verdict === 'Verified True') {
    argument.push(
      `Related claim ${related.id} is stored as Verified True. A close variant is not automatically true, but the prior record exists.`,
    )
  }
  const notes = reviewerNotes(reviews)
  if (notes.length > 0) {
    argument.push(`Human reviewer notes are on file (${notes.length}). They remain reviewer work, not AI proof.`)
  }
  if (consensus.total > 0 && consensus.agree >= consensus.disagree) {
    argument.push(
      `Community votes currently lean Agree or tied (${consensus.agree} agree / ${consensus.disagree} disagree of ${consensus.total}). Votes are not a verdict.`,
    )
  }
  if ((claim.candidateSources?.length ?? 0) > 0) {
    argument.push(
      `${claim.candidateSources?.length} candidate source URL(s) were stored at intake. They still require human review.`,
    )
  }

  if (hasUrl(claim)) {
    evidenceLines.push(`Stored source URL: ${claim.sourceUrl.trim()}`)
  }
  if (claim.candidateSources) {
    for (const item of claim.candidateSources) {
      evidenceLines.push(
        `Candidate source (unverified): ${item.title || 'Untitled'}${item.url ? ` — ${item.url}` : ''}`,
      )
    }
  }
  for (const item of claim.evidence) {
    evidenceLines.push(
      `Reviewer-supplied: ${item.title}${item.url ? ` — ${item.url}` : ''}${item.description ? ` — ${item.description}` : ''}`,
    )
  }
  for (const item of evidence) {
    evidenceLines.push(`${item.type}: ${item.title} — ${item.reference}`)
  }
  if (evidenceLines.length === 0) {
    evidenceLines.push(INSUFFICIENT)
  }

  reasoning.push(`Category ${claim.category}, platform ${claim.platform}, upload type ${claim.uploadType}.`)
  reasoning.push(`Fingerprint ${claim.fingerprint}. Matching is a retrieval aid, not proof of truth.`)
  if (claim.matchedClaimId) {
    reasoning.push(`Matched claim id ${claim.matchedClaimId} at similarity ${claim.similarityScore ?? 0}%.`)
  }
  reasoning.push('The defender role states the strongest support that can be drawn from stored fields, including honest gaps.')

  limitations.push('DEMO AI COURTROOM. No external pages were fetched. URLs are listed only if already stored.')
  limitations.push('User-contributed evidence is not treated as verified.')
  if (evidenceLines.includes(INSUFFICIENT)) {
    limitations.push(INSUFFICIENT)
  }

  return { role: 'defender', argument, evidence: evidenceLines, reasoning, limitations }
}

export function generateJudgeAssessment(ctx: CourtroomContext): JudgeRuling {
  const { claim, analysis, related, reviews, evidence, consensus } = ctx
  const supporting: string[] = []
  const counterpoints: string[] = []
  const evidenceGaps: string[] = []

  if (hasUrl(claim)) supporting.push(`A source URL is stored: ${claim.sourceUrl.trim()}.`)
  if (!analysis.sensational.detected) supporting.push('No sensational trigger phrases were matched.')
  if (!analysis.shouting.detected) supporting.push('Shouting was not detected under the 50% uppercase rule.')
  if (claim.verdict === 'Verified True') {
    supporting.push(`Official ledger status is Verified True (human/fingerprint path — not an AI ruling).`)
  }
  if (related && related.verdict === 'Verified True') {
    supporting.push(`Related claim ${related.id} is stored as Verified True.`)
  }
  if (claim.evidence.length > 0) {
    supporting.push(`${claim.evidence.length} reviewer-supplied evidence item(s) are attached to the claim.`)
  }
  if (reviews.length > 0) supporting.push(`${reviews.length} human review record(s) exist.`)

  if (analysis.sensational.detected) {
    counterpoints.push(`Sensational matches: ${analysis.sensational.matches.map((item) => `"${item}"`).join(', ')}.`)
  }
  if (analysis.shouting.detected) {
    counterpoints.push(`Shouting detected at ${Math.round(analysis.shouting.uppercasePercentage)}% uppercase.`)
  }
  if (analysis.unsourced.detected || !hasUrl(claim)) {
    counterpoints.push('No valid source URL is stored.')
  }
  if (claim.verdict === 'Verified False' || claim.verdict === 'Misleading') {
    counterpoints.push(`Official ledger status is ${claim.verdict}.`)
  }
  if (related && (related.verdict === 'Verified False' || related.verdict === 'Misleading')) {
    counterpoints.push(`Related claim ${related.id} is stored as ${related.verdict}.`)
  }
  if (claim.riskLevel === 'High') {
    counterpoints.push(`Triage risk level is ${claim.riskLevel} (score ${claim.riskScore}). Risk is not P(false).`)
  }
  if (consensus.total > 0) {
    counterpoints.push(
      `Community snapshot: ${consensus.agree} agree, ${consensus.disagree} disagree, ${consensus.unsure} unsure of ${consensus.total}. Not a verdict.`,
    )
  }

  if (!hasUrl(claim)) evidenceGaps.push('No source URL on the claim.')
  if (claim.evidence.length === 0) evidenceGaps.push('No reviewer-supplied evidence items on the claim.')
  if (evidence.filter((item) => item.type === 'USER_CONTRIBUTION').length === 0) {
    evidenceGaps.push('No user-contributed courtroom evidence yet.')
  }
  if (reviews.length === 0) evidenceGaps.push('No human review notes stored.')
  if (evidenceGaps.length === 0) evidenceGaps.push('Primary fields are present; independent corroboration was still not fetched.')

  const sourced = hasUrl(claim) || claim.evidence.length > 0
  const hostileLedger =
    claim.verdict === 'Verified False' ||
    claim.verdict === 'Misleading' ||
    (related && (related.verdict === 'Verified False' || related.verdict === 'Misleading') && (claim.similarityScore ?? 0) >= 70)
  const friendlyLedger =
    claim.verdict === 'Verified True' ||
    (related && related.verdict === 'Verified True' && (claim.similarityScore ?? 0) >= 85)
  const noisy = analysis.sensational.detected || analysis.shouting.detected
  const thin = !sourced && reviews.length === 0

  let leaning: CourtroomLeaning
  if (thin && noisy) {
    leaning = 'POTENTIALLY MISLEADING'
  } else if (thin && !friendlyLedger) {
    leaning = 'INSUFFICIENT EVIDENCE'
  } else if (hostileLedger && !friendlyLedger) {
    leaning = claim.verdict === 'Misleading' || related?.verdict === 'Misleading' ? 'POTENTIALLY MISLEADING' : 'LEANING FALSE'
  } else if (friendlyLedger && sourced && !noisy) {
    leaning = 'LEANING TRUE'
  } else if (friendlyLedger) {
    leaning = 'LEANING TRUE'
  } else if (noisy && !sourced) {
    leaning = 'POTENTIALLY MISLEADING'
  } else if (sourced && !noisy && claim.riskLevel === 'Low') {
    leaning = 'LEANING TRUE'
  } else if (sourced && noisy) {
    leaning = 'POTENTIALLY MISLEADING'
  } else {
    leaning = 'INSUFFICIENT EVIDENCE'
  }

  const signalCount =
    (hasUrl(claim) ? 1 : 0) +
    (claim.evidence.length > 0 ? 1 : 0) +
    (reviews.length > 0 ? 1 : 0) +
    (related ? 1 : 0) +
    (claim.flags.length > 0 ? 1 : 0) +
    (consensus.total > 0 ? 1 : 0)
  const assessmentConfidence = Math.max(20, Math.min(85, 25 + signalCount * 10))

  const rationale = [
    `Advisory leaning ${leaning} is assembled from stored fields on ${claim.id}.`,
    `It is not an official NO CAP verdict. Official status remains ${claim.verdict}.`,
    thin
      ? INSUFFICIENT
      : `Stored signals used: source URL ${hasUrl(claim) ? 'present' : 'absent'}, ${claim.evidence.length} claim evidence item(s), ${reviews.length} review(s), related ${related ? related.id : 'none'}.`,
  ].join(' ')

  return {
    leaning,
    rationale,
    supporting: supporting.length ? supporting : [INSUFFICIENT],
    counterpoints: counterpoints.length ? counterpoints : ['No stored counterpoints beyond the absence of corroboration.'],
    evidenceGaps,
    assessmentConfidence,
  }
}

export const aiCourtroomService = {
  analyzeClaim(claim: Claim): RiskAnalysis {
    return riskService.analysisFor(claim)
  },
  generateProsecutorArgument,
  generateDefenderArgument,
  generateJudgeAssessment,
  buildContext: buildCourtroomContext,
}
