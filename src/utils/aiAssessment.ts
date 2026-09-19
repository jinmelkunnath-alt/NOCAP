import { CHECKER_CONFIG } from '../config/checker'
import type { AiAssessment, Claim, RiskAnalysis } from '../types'
import type { FingerprintMatch } from '../services/fingerprintService'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function buildAiAssessment(
  analysis: RiskAnalysis,
  match: FingerprintMatch | null,
): AiAssessment {
  const found = Boolean(match && match.similarity >= CHECKER_CONFIG.foundSimilarity)
  const related = found ? match!.claim : null
  const official = related?.verdict ?? 'Unverified'
  const verification = official === 'Unverified' ? 'UNDER VERIFICATION' : 'VERIFIED'

  let label: AiAssessment['label'] = 'INCONCLUSIVE'
  if (official === 'Verified True') label = 'REAL'
  else if (official === 'Verified False') label = 'FAKE'
  else if (official === 'Misleading') label = 'INCONCLUSIVE'
  else if (!found) label = 'INCONCLUSIVE'
  else label = 'INCONCLUSIVE'

  const evidenceCount = related?.evidence.length ?? 0
  const signalCount =
    (found ? 2 : 0) +
    (official !== 'Unverified' ? 3 : 0) +
    (evidenceCount > 0 ? 2 : 0) +
    (analysis.flags.length > 0 ? 1 : 0) +
    (analysis.unsourced.detected ? 0 : 1)

  let aiConfidence = 28 + signalCount * 8
  if (!found) aiConfidence = Math.min(aiConfidence, 42)
  if (official === 'Unverified') aiConfidence = Math.min(aiConfidence, 68)
  aiConfidence = clamp(aiConfidence, 20, 86)

  const why = explanation(found, related, analysis, match)
  const evidenceNote = found
    ? related && related.evidence.length > 0
      ? `${related.evidence.length} stored evidence item(s) on the matched record.`
      : 'A related rumour is on file, but independent corroboration was not fetched.'
    : 'Insufficient evidence available in the NO CAP store for this wording.'

  const reasoningSteps: string[] = [
    `1. Claim parsed and normalized. Core query evaluated against known misinformation patterns.`,
    `2. Deterministic risk triage evaluated: ${analysis.riskLevel} risk with ${analysis.flags.length} observable flag(s) (${analysis.flags.join(', ') || 'none'}).`,
    found
      ? `3. Fingerprint ledger matched against existing claim record ${related?.id} (${match?.percent}% similarity).`
      : `3. Fingerprint search yielded no prior verified human fact-checking ledger entry.`,
    `4. Confidence score calibrated at ${aiConfidence}% based on verified evidence signals, source density, and certainty evaluation.`,
  ]

  const reasoningText = reasoningSteps.join('\n\n')

  return {
    label,
    verification,
    found,
    aiConfidence,
    why,
    matchedClaimId: related?.id ?? null,
    similarityPercent: match ? match.percent : null,
    evidenceNote,
    reasoningText,
    thinking: reasoningText,
    reasoningSteps,
  }
}

function explanation(
  found: boolean,
  related: Claim | null,
  analysis: RiskAnalysis,
  match: FingerprintMatch | null,
): string {
  if (!found || !related) {
    return 'NO CAP did not find a stored rumour close enough to this wording. There is not enough evidence here to treat the claim as established or disproven. This is an advisory AI assessment, not official verification.'
  }

  const sim = match ? `${match.percent}%` : 'related'
  if (related.verdict === 'Verified True') {
    return `A stored NO CAP record (${related.id}) matches this wording at ${sim}. Human verification already marked that record Verified True. The AI restates that ledger; it does not create a new official verdict.`
  }
  if (related.verdict === 'Verified False') {
    return `A stored NO CAP record (${related.id}) matches this wording at ${sim}. Human verification already marked that record Verified False. The AI restates that ledger; it does not create a new official verdict.`
  }
  if (related.verdict === 'Misleading') {
    return `A stored NO CAP record (${related.id}) matches this wording at ${sim}. Human verification marked it Misleading — technically mixed or missing context. The AI assessment stays inconclusive as an advisory summary.`
  }

  const flags = analysis.flags.length ? ` Observable risk signals: ${analysis.flags.join(', ')}.` : ''
  return `A related rumour is already in the community (${related.id}, ${sim} similar) and remains Unverified.${flags} Community discussion and risk signals are inputs, not proof. Official verification is still pending.`
}
