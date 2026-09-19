import type { Claim, ClaimFilters } from '../types'
import { compareRiskWeightedRecency } from './ranking'

export function claimMatchesFilters(claim: Claim, filters: ClaimFilters): boolean {
  const query = filters.search.trim().toLowerCase()
  const matchesSearch =
    query.length === 0 ||
    claim.text.toLowerCase().includes(query) ||
    claim.id.toLowerCase().includes(query) ||
    claim.platform.toLowerCase().includes(query) ||
    claim.category.toLowerCase().includes(query) ||
    claim.verdict.toLowerCase().includes(query)
  const matchesCategory = filters.category === 'All' || claim.category === filters.category
  const matchesVerdict = filters.verdict === 'All' || claim.verdict === filters.verdict
  const matchesRisk = filters.risk === 'All' || claim.riskLevel === filters.risk
  const matchesPlatform = filters.platform === 'All' || claim.platform === filters.platform
  return matchesSearch && matchesCategory && matchesVerdict && matchesRisk && matchesPlatform
}

export function applyClaimFilters(claims: Claim[], filters: ClaimFilters): Claim[] {
  const filtered = claims.filter((claim) => claimMatchesFilters(claim, filters))

  const sorted = [...filtered].sort((a, b) => {
    if (filters.sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    if (filters.sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (filters.sort === 'highestRisk') {
      if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (filters.sort === 'lowestRisk') {
      if (a.riskScore !== b.riskScore) return a.riskScore - b.riskScore
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return compareRiskWeightedRecency(a, b)
  })

  return sorted
}

export function defaultFilters(): ClaimFilters {
  return {
    search: '',
    category: 'All',
    verdict: 'All',
    risk: 'All',
    platform: 'All',
    sort: 'riskWeighted',
  }
}

export function filtersAreActive(filters: ClaimFilters): boolean {
  const defaults = defaultFilters()
  return (
    filters.search.trim() !== defaults.search ||
    filters.category !== defaults.category ||
    filters.verdict !== defaults.verdict ||
    filters.risk !== defaults.risk ||
    filters.platform !== defaults.platform ||
    filters.sort !== defaults.sort
  )
}

export const SORT_LABELS: Record<ClaimFilters['sort'], string> = {
  riskWeighted: 'Risk-Weighted Recency',
  newest: 'Newest',
  oldest: 'Oldest',
  highestRisk: 'Highest Risk',
  lowestRisk: 'Lowest Risk',
}
