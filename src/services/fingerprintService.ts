import { SIMILARITY_THRESHOLDS } from '../config/intelligence'
import type { Claim } from '../types'
import {
  calculateClaimSimilarity,
  fingerprintClaim,
  similarityLabel,
  similarityPercent,
} from '../utils/fingerprint'

export interface FingerprintMatch {
  claim: Claim
  similarity: number
  percent: number
  label: 'potential' | 'strong'
}

function isReviewed(claim: Claim): boolean {
  return claim.verdict !== 'Unverified'
}

export const fingerprintService = {
  fingerprint(text: string): string {
    return fingerprintClaim(text)
  },

  similarity(a: string, b: string): number {
    return calculateClaimSimilarity(a, b)
  },

  findBestMatch(text: string, claims: Claim[], excludeId?: string): FingerprintMatch | null {
    const candidates = claims.filter((claim) => claim.id !== excludeId)
    if (candidates.length === 0) return null

    let bestReviewed: FingerprintMatch | null = null
    let bestAny: FingerprintMatch | null = null

    for (const claim of candidates) {
      const similarity = calculateClaimSimilarity(text, claim.text)
      const label = similarityLabel(similarity)
      if (label === 'none') continue

      const current: FingerprintMatch = {
        claim,
        similarity,
        percent: similarityPercent(similarity),
        label,
      }

      if (!bestAny || current.similarity > bestAny.similarity) bestAny = current
      if (isReviewed(claim) && (!bestReviewed || current.similarity > bestReviewed.similarity)) {
        bestReviewed = current
      }
    }

    return bestReviewed ?? bestAny
  },

  countSimilar(text: string, claims: Claim[], excludeId?: string): number {
    return claims.filter((claim) => {
      if (claim.id === excludeId) return false
      return calculateClaimSimilarity(text, claim.text) >= SIMILARITY_THRESHOLDS.potential
    }).length
  },
}
