import { CHECKER_CONFIG } from '../config/checker'
import type { CommunityAiAnalysis } from '../types'
import { createId } from '../utils/format'
import { checkStorage } from './checkStorage'
import { courtroomStorage } from './courtroomStorage'
import { emitSocialChanged } from './dataEvents'
import { socialStorage } from './socialStorage'
import { storageService } from './storageService'

function meaningfulCount(claimId: string): { responseCount: number; uniqueUsers: number } {
  const users = new Set<string>()
  let responseCount = 0
  const seenText = new Set<string>()

  for (const vote of socialStorage.getVotes()) {
    if (vote.claimId !== claimId) continue
    users.add(vote.userId)
    responseCount += 1
  }

  for (const comment of socialStorage.getComments()) {
    if (comment.claimId !== claimId) continue
    if (comment.text.trim().length < CHECKER_CONFIG.minMeaningfulCommentLength) continue
    const key = `${comment.authorId}:${comment.text.trim().toLowerCase()}`
    if (seenText.has(key)) continue
    seenText.add(key)
    users.add(comment.authorId)
    responseCount += 1
  }

  const poll = courtroomStorage.getPolls().find((item) => item.claimId === claimId)
  if (poll) {
    for (const vote of courtroomStorage.getPollVotes()) {
      if (vote.pollId !== poll.id) continue
      users.add(vote.userId)
      responseCount += 1
    }
  }

  return { responseCount, uniqueUsers: users.size }
}

function buildWhy(claimId: string, uniqueUsers: number, responseCount: number): CommunityAiAnalysis {
  const claim = storageService.getStoredClaims().find((item) => item.id === claimId)
  const votes = socialStorage.getVotes().filter((item) => item.claimId === claimId)
  const agree = votes.filter((item) => item.type === 'agree').length
  const disagree = votes.filter((item) => item.type === 'disagree').length
  const official = claim?.verdict ?? 'Unverified'
  const verification = official === 'Unverified' ? 'UNDER VERIFICATION' : 'VERIFIED'

  let label: CommunityAiAnalysis['label'] = 'INCONCLUSIVE'
  if (official === 'Verified True') label = 'REAL'
  else if (official === 'Verified False') label = 'FAKE'
  else if (official === 'Misleading') label = 'INCONCLUSIVE'
  else if (
    (claim?.flags.length ?? 0) >= 2 &&
    disagree > agree &&
    (claim?.evidence.length ?? 0) === 0
  ) {
    label = 'FAKE'
  }

  const confidenceBase =
    official !== 'Unverified' ? 70 : 40 + Math.min(20, uniqueUsers) + (claim?.flags.length ?? 0) * 4
  const aiConfidence = Math.max(24, Math.min(official === 'Unverified' ? 72 : 86, Math.round(confidenceBase)))

  let why: string
  if (official === 'Verified False') {
    why = `Human verification already marked this record Verified False. ${uniqueUsers} people contributed ${responseCount} meaningful responses. The AI restates the stored ledger; it does not replace the official verdict.`
  } else if (official === 'Verified True') {
    why = `Human verification already marked this record Verified True. Community responses are supporting context only. The AI restates the stored ledger; it does not replace the official verdict.`
  } else if (label === 'FAKE') {
    why = `The available evidence and community discussion indicate that the claim is unsupported. Most community responses currently question the claim, but community consensus alone does not establish factual truth.`
  } else {
    why = `${uniqueUsers} people contributed ${responseCount} meaningful responses. Community opinion is mixed or incomplete, and stored evidence is not enough to treat the claim as established. Official verification is still pending.`
  }

  return {
    id: createId('caa'),
    claimId,
    createdAt: new Date().toISOString(),
    responseCount,
    uniqueUsers,
    label,
    verification,
    aiConfidence,
    why,
  }
}

let synthesizingClaimIds = new Set<string>()

export const communityAnalysisService = {
  forClaim(claimId: string): CommunityAiAnalysis | null {
    return checkStorage.getAnalysis().find((item) => item.claimId === claimId) ?? null
  },

  progress(claimId: string): {
    responseCount: number
    uniqueUsers: number
    needed: number
    ready: boolean
  } {
    const counts = meaningfulCount(claimId)
    const needed = CHECKER_CONFIG.communityAnalysisMinResponses
    return {
      ...counts,
      needed,
      ready: Boolean(this.forClaim(claimId)) || counts.uniqueUsers >= needed || counts.responseCount >= 10,
    }
  },

  async triggerServerSynthesize(claimId: string): Promise<CommunityAiAnalysis | null> {
    if (synthesizingClaimIds.has(claimId)) return this.forClaim(claimId)
    synthesizingClaimIds.add(claimId)

    const claim = storageService.getStoredClaims().find((item) => item.id === claimId)
    if (!claim) {
      synthesizingClaimIds.delete(claimId)
      return null
    }

    const counts = meaningfulCount(claimId)
    const comments = socialStorage.getComments().filter((c) => c.claimId === claimId)
    const votes = socialStorage.getVotes().filter((v) => v.claimId === claimId)
    const agree = votes.filter((v) => v.type === 'agree').length
    const disagree = votes.filter((v) => v.type === 'disagree').length
    const poll = courtroomStorage.getPolls().find((p) => p.claimId === claimId)
    const pollVotes = poll ? courtroomStorage.getPollVotes().filter((pv) => pv.pollId === poll.id) : []

    const pollResults: Record<string, number> = {}
    if (poll) {
      poll.options.forEach((opt, idx) => {
        pollResults[opt] = pollVotes.filter((pv) => pv.optionIndex === idx).length
      })
    }


    try {
      const res = await fetch('/api/ai/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: claim.text,
          comments: comments.map((c) => ({ text: c.text })),
          pollResults,
          votes: { agree, disagree },
          existingEvidence: claim.evidence,
          risk: { riskLevel: claim.riskLevel, flags: claim.flags },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const official = claim.verdict ?? 'Unverified'
        const isVerified = official !== 'Unverified'
        const analysis: CommunityAiAnalysis = {
          id: createId('caa'),
          claimId,
          createdAt: new Date().toISOString(),
          responseCount: counts.responseCount,
          uniqueUsers: counts.uniqueUsers,
          label: (['REAL', 'FAKE', 'INCONCLUSIVE'].includes(data.classification)
            ? data.classification
            : 'INCONCLUSIVE') as CommunityAiAnalysis['label'],
          verification: isVerified ? 'VERIFIED' : 'UNDER VERIFICATION',
          aiConfidence: typeof data.confidence === 'number' ? data.confidence : 50,
          why: data.communitySummary || data.summary || buildWhy(claimId, counts.uniqueUsers, counts.responseCount).why,
        }
        checkStorage.saveAnalysis([analysis, ...checkStorage.getAnalysis().filter((a) => a.claimId !== claimId)])
        const claims = storageService.getStoredClaims()
        storageService.saveClaims(
          claims.map((item) =>
            item.id === claimId ? { ...item, communityAnalysisStatus: 'ready' } : item,
          ),
        )
        emitSocialChanged()
        synthesizingClaimIds.delete(claimId)
        return analysis
      }
    } catch (err) {
      console.warn('Server AI synthesize failed, falling back to local heuristics:', err)
    }

    const fallback = buildWhy(claimId, counts.uniqueUsers, counts.responseCount)
    checkStorage.saveAnalysis([fallback, ...checkStorage.getAnalysis().filter((a) => a.claimId !== claimId)])
    const claims = storageService.getStoredClaims()
    storageService.saveClaims(
      claims.map((item) =>
        item.id === claimId ? { ...item, communityAnalysisStatus: 'ready' } : item,
      ),
    )
    emitSocialChanged()
    synthesizingClaimIds.delete(claimId)
    return fallback
  },

  maybeAnalyze(claimId: string): CommunityAiAnalysis | null {
    const counts = meaningfulCount(claimId)
    // Trigger at 10-12 responses or configured threshold
    if (counts.uniqueUsers < CHECKER_CONFIG.communityAnalysisMinResponses && counts.responseCount < 10) {
      return this.forClaim(claimId)
    }
    const existing = this.forClaim(claimId)
    if (existing) return existing

    // Save initial structure and trigger background AI synthesis
    const next = buildWhy(claimId, counts.uniqueUsers, counts.responseCount)
    checkStorage.saveAnalysis([next, ...checkStorage.getAnalysis()])
    const claims = storageService.getStoredClaims()
    storageService.saveClaims(
      claims.map((item) =>
        item.id === claimId ? { ...item, communityAnalysisStatus: 'ready' } : item,
      ),
    )
    emitSocialChanged()
    void this.triggerServerSynthesize(claimId)
    return next
  },
}
