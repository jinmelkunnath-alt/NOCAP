import type { Claim, RiskLevel } from '../types'

const RISK_TIER: Record<RiskLevel, number> = {
  High: 2,
  Medium: 1,
  Low: 0,
}

export function compareRiskWeightedRecency(a: Claim, b: Claim): number {
  const tier = RISK_TIER[b.riskLevel] - RISK_TIER[a.riskLevel]
  if (tier !== 0) return tier
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

export function sortRiskWeightedRecency(claims: Claim[]): Claim[] {
  return [...claims].sort(compareRiskWeightedRecency)
}

export function riskTier(level: RiskLevel): number {
  return RISK_TIER[level]
}
