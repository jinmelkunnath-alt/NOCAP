import type {
  Category,
  Claim,
  ClaimStats,
  ClaimUpdates,
  CreateClaimInput,
  Verdict,
} from '../types'
import { createId } from '../utils/format'
import { communityService } from './communityService'
import { emitClaimsChanged } from './dataEvents'
import { fingerprintService } from './fingerprintService'
import { ledgerService } from './ledgerService'
import { notificationService } from './notificationService'
import { riskService } from './riskService'
import { sessionService } from './sessionService'
import { socialService } from './socialService'
import { storageService } from './storageService'

function emptyStats(): ClaimStats {
  return {
    total: 0,
    unverified: 0,
    highRisk: 0,
    reviewed: 0,
    flagged: 0,
    potentialDuplicates: 0,
    relatedSubmissions: 0,
    communityVotes: 0,
    byRisk: { Low: 0, Medium: 0, High: 0 },
    byVerdict: {
      Unverified: 0,
      'Verified True': 0,
      'Verified False': 0,
      Misleading: 0,
    },
    byPlatform: { WhatsApp: 0, X: 0, Instagram: 0, Reddit: 0, Other: 0 },
    byCategory: {
      Politics: 0,
      Health: 0,
      Finance: 0,
      Technology: 0,
      Campus: 0,
      Entertainment: 0,
      Other: 0,
    },
  }
}

async function computeStats(claims: Claim[]): Promise<ClaimStats> {
  const stats = emptyStats()
  stats.total = claims.length
  stats.communityVotes = await communityService.getTotalVotes()

  for (const claim of claims) {
    stats.byRisk[claim.riskLevel] += 1
    stats.byVerdict[claim.verdict] += 1
    stats.byPlatform[claim.platform] += 1
    stats.byCategory[claim.category] += 1
    if (claim.verdict === 'Unverified') stats.unverified += 1
    else stats.reviewed += 1
    if (claim.riskLevel === 'High') stats.highRisk += 1
    if (claim.flags.length > 0) stats.flagged += 1
    if (claim.potentialDuplicate) stats.potentialDuplicates += 1
    stats.relatedSubmissions += claim.similarSubmissionCount ?? 0
  }

  return stats
}

function resolveRootId(start: Claim, claims: Claim[]): string {
  const byId = new Map(claims.map((item) => [item.id, item]))
  const seen = new Set<string>()
  let current: Claim | undefined = start
  while (current?.matchedClaimId && !seen.has(current.id)) {
    seen.add(current.id)
    current = byId.get(current.matchedClaimId)
  }
  return current?.id ?? start.id
}

export const claimService = {
  getClaims(): Promise<Claim[]> {
    return Promise.resolve(storageService.getStoredClaims())
  },

  getClaimById(id: string): Promise<Claim | null> {
    const claim = storageService.getStoredClaims().find((item) => item.id === id) ?? null
    return Promise.resolve(claim)
  },

  getClaimsByStatus(status: Verdict): Promise<Claim[]> {
    return Promise.resolve(
      storageService.getStoredClaims().filter((claim) => claim.verdict === status),
    )
  },

  getClaimsByCategory(category: Category): Promise<Claim[]> {
    return Promise.resolve(
      storageService.getStoredClaims().filter((claim) => claim.category === category),
    )
  },

  async createClaim(input: CreateClaimInput): Promise<Claim> {
    const now = new Date().toISOString()
    const analysis = await riskService.analyzeClaim(input.text, input.sourceUrl)
    const existing = storageService.getStoredClaims()
    const match = fingerprintService.findBestMatch(input.text, existing)
    const similarCount = fingerprintService.countSimilar(input.text, existing)
    const strongVerified = Boolean(match && match.label === 'strong' && match.claim.verdict !== 'Unverified')
    const matched = strongVerified ? match : null

    const claim: Claim = {
      id: createId('clm'),
      text: input.text.trim(),
      sourceUrl: input.sourceUrl.trim(),
      platform: input.platform,
      category: input.category,
      flags: analysis.flags,
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore,
      verdict: matched ? matched.claim.verdict : 'Unverified',
      reviewerNote: matched
        ? `Fingerprint reuse of ${matched.claim.id} (${matched.percent}% similarity). Previous verdict ${matched.claim.verdict}. Deterministic text similarity — not an AI verdict.`
        : '',
      reviewerId: matched ? 'system' : '',
      evidence: matched ? matched.claim.evidence.map((item) => ({ ...item, id: createId('ev') })) : [],
      createdAt: now,
      updatedAt: now,
      locked: false,
      confidence: null,
      analysis,
      fingerprint: fingerprintService.fingerprint(input.text),
      matchedClaimId: match?.claim.id ?? null,
      similarityScore: match ? match.percent : null,
      potentialDuplicate: match?.label === 'strong',
      similarSubmissionCount: similarCount,
      authorId: input.authorId ?? sessionService.getCurrentUserId(),
      uploadType: input.uploadType ?? 'user',
      originType: input.originType ?? 'USER',
      originalText: input.originalText?.trim() || input.text.trim(),
      enhancedByAI: Boolean(input.enhancedByAI),
      clusterId: input.clusterId,
      independentCheckCount: input.independentCheckCount ?? 0,
      communityAnalysisStatus: 'none',
      resolutionPath: matched
        ? 'FINGERPRINT_REUSE'
        : analysis.riskLevel === 'High'
          ? 'BRIDGING_VERIFICATION'
          : 'FAST_SINGLE_REVIEW',
      consensusState: matched ? 'reused' : 'none',
      resolvedAt: matched ? now : null,
      candidateSources: [],
    }

    const rootId = match ? resolveRootId(match.claim, existing) : null
    const nextExisting = rootId
      ? existing.map((item) =>
          item.id === rootId
            ? { ...item, similarSubmissionCount: (item.similarSubmissionCount ?? 0) + 1 }
            : item,
        )
      : existing

    storageService.saveClaims([claim, ...nextExisting])
    socialService.recordSubmit(claim.id)

    ledgerService.append({
      claimId: claim.id,
      kind: 'submitted',
      note: 'Claim submitted',
      verdict: 'Unverified',
      timestamp: now,
    })
    ledgerService.append({
      claimId: claim.id,
      kind: 'risk_analysis',
      note: `${analysis.riskLevel.toUpperCase()} RISK · ${analysis.riskScore} · ${analysis.flags.join(', ') || 'no flags'}`,
      verdict: 'Unverified',
      timestamp: now,
    })
    ledgerService.append({
      claimId: claim.id,
      kind: 'fingerprint_check',
      note: match
        ? `${match.label === 'strong' ? 'Close variant detected' : 'Potentially related'} · ${match.percent}% · ${match.claim.id}`
        : 'No verified match',
      verdict: 'Unverified',
      timestamp: now,
    })

    if (matched) {
      storageService.saveReviews([
        {
          id: createId('rev'),
          claimId: claim.id,
          reviewerId: 'system',
          verdict: matched.claim.verdict,
          note: claim.reviewerNote,
          evidence: claim.evidence,
          createdAt: now,
          reviewerRole: 'SYSTEM',
          perspective: null,
        },
        ...storageService.getStoredReviews(),
      ])
      ledgerService.append({
        claimId: claim.id,
        kind: 'fingerprint_reuse',
        note: `Strong verified match. Verdict reused from ${matched.claim.id}. Instant resolution — no reviewer queue.`,
        verdict: matched.claim.verdict,
        resolutionPath: 'FINGERPRINT_REUSE',
        timestamp: now,
      })
      ledgerService.append({
        claimId: claim.id,
        kind: 'resolved',
        note: 'Instant resolution via fingerprint reuse.',
        verdict: matched.claim.verdict,
        resolutionPath: 'FINGERPRINT_REUSE',
        timestamp: now,
      })
      notificationService.push({
        userId: claim.authorId ?? sessionService.getCurrentUserId(),
        claimId: claim.id,
        title: 'Your claim received a verification update.',
        body: `Instant fingerprint reuse: ${matched.claim.verdict} from ${matched.claim.id} (${matched.percent}% similar).`,
      })
    } else {
      ledgerService.append({
        claimId: claim.id,
        kind: 'routed',
        note:
          claim.resolutionPath === 'BRIDGING_VERIFICATION'
            ? 'High-risk novel claim routed to bridging consensus.'
            : 'Low/medium novel claim routed to fast single review.',
        verdict: 'Unverified',
        resolutionPath: claim.resolutionPath,
        timestamp: now,
      })
      notificationService.push({
        userId: claim.authorId ?? sessionService.getCurrentUserId(),
        claimId: claim.id,
        title: 'Your submitted claim is now under review.',
        body:
          claim.resolutionPath === 'BRIDGING_VERIFICATION'
            ? 'High risk. Bridging consensus required. Status remains Unverified.'
            : 'Queued for a single reviewer. Status remains Unverified.',
      })
    }

    emitClaimsChanged()
    return claim
  },

  updateClaim(id: string, updates: ClaimUpdates): Promise<Claim> {
    const claims = storageService.getStoredClaims()
    const index = claims.findIndex((item) => item.id === id)
    if (index === -1) {
      return Promise.reject(new Error(`Claim ${id} was not found.`))
    }

    const current = claims[index]
    if (!current) {
      return Promise.reject(new Error(`Claim ${id} was not found.`))
    }

    const updated: Claim = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }

    const next = claims.map((item, i) => (i === index ? updated : item))
    storageService.saveClaims(next)
    emitClaimsChanged()
    return Promise.resolve(updated)
  },

  getStats(): Promise<ClaimStats> {
    return computeStats(storageService.getStoredClaims())
  },
}
