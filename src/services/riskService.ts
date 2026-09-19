import type { Claim, RiskAnalysis } from '../types'
import { analyzeClaimText } from '../utils/riskEngine'

export const riskService = {
  analyzeClaim(text: string, sourceUrl: string): Promise<RiskAnalysis> {
    return Promise.resolve(analyzeClaimText(text, sourceUrl))
  },

  analyzeClaimSync(text: string, sourceUrl: string): RiskAnalysis {
    return analyzeClaimText(text, sourceUrl)
  },

  analysisFor(claim: Claim): RiskAnalysis {
    if (claim.analysis && Array.isArray(claim.analysis.flags)) {
      return claim.analysis
    }
    return analyzeClaimText(claim.text, claim.sourceUrl)
  },
}
