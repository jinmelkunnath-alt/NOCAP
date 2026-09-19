import { CHECKER_CONFIG } from '../config/checker'
import { stripQuestionWrapper } from '../utils/enhanceText'
import { enhanceClaimText } from '../utils/enhanceText'
import { fingerprintClaim, calculateClaimSimilarity } from '../utils/fingerprint'
import type { Claim } from '../types'
import { checkStorage } from './checkStorage'
import { claimService } from './claimService'
import { storageService } from './storageService'

export const TRUTHLENS_AI_USER_ID = 'usr_truthlens_ai'

export function clusterIdFor(text: string): string {
  const fp = fingerprintClaim(stripQuestionWrapper(text))
  return fp ? `cluster_${fp.replace(/\s+/g, '_').slice(0, 48)}` : `cluster_${fp || 'empty'}`
}

function similarTo(text: string, other: string): boolean {
  return calculateClaimSimilarity(stripQuestionWrapper(text), stripQuestionWrapper(other)) >=
    CHECKER_CONFIG.foundSimilarity
}

export const discoveryService = {
  independentUsersFor(text: string): string[] {
    const users = new Set<string>()
    for (const check of checkStorage.getChecks()) {
      if (similarTo(text, check.originalText)) users.add(check.userId)
    }
    return [...users]
  },

  existingAiRumour(text: string): Claim | null {
    return (
      storageService.getStoredClaims().find((claim) => {
        if (claim.originType !== 'AI') return false
        return similarTo(text, claim.text)
      }) ?? null
    )
  },

  async considerCluster(text: string): Promise<Claim | null> {
    const existing = this.existingAiRumour(text)
    const users = this.independentUsersFor(text)
    if (existing) {
      if ((existing.independentCheckCount ?? 0) !== users.length) {
        await claimService.updateClaim(existing.id, { independentCheckCount: users.length })
      }
      return existing
    }
    if (users.length < CHECKER_CONFIG.aiRumourIndependentUsers) return null

    const clean = enhanceClaimText(text).replace(/^Rumour:\s*/i, 'Rumour detected across multiple independent user checks: ')
    const created = await claimService.createClaim({
      text: clean,
      sourceUrl: '',
      platform: 'Other',
      category: 'Campus',
      originType: 'AI',
      uploadType: 'ai',
      authorId: TRUTHLENS_AI_USER_ID,
      originalText: text,
      enhancedByAI: true,
      clusterId: clusterIdFor(text),
      independentCheckCount: users.length,
    })
    return created
  },
}
