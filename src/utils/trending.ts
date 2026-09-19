import type { Claim, EngagementEvent, EngagementMetrics } from '../types'

export function recencyWeight(iso: string, now = Date.now()): number {
  const ageHours = Math.max(0, (now - new Date(iso).getTime()) / 3_600_000)
  return 48 / (48 + ageHours)
}

export function engagementTotal(metrics: EngagementMetrics): number {
  return metrics.votes + metrics.comments + metrics.shares + metrics.saves
}

export function trendingScore(
  claim: Claim,
  metrics: EngagementMetrics,
  events: EngagementEvent[],
  now = Date.now(),
): number {
  const attention =
    metrics.votes * 2 + metrics.comments * 3 + metrics.shares * 2 + metrics.saves * 1.5
  const sixHours = now - 6 * 3_600_000
  const velocity = events.filter((item) => {
    if (item.claimId !== claim.id) return false
    const time = new Date(item.createdAt).getTime()
    return Number.isFinite(time) && time >= sixHours
  }).length
  return attention + velocity * 8 + recencyWeight(claim.createdAt, now) * 20
}

export function forYouScore(
  claim: Claim,
  metrics: EngagementMetrics,
  following: Set<string>,
  now = Date.now(),
): number {
  const followBoost = claim.authorId && following.has(claim.authorId) ? 40 : 0
  const attention = engagementTotal(metrics)
  return followBoost + attention * 0.8 + recencyWeight(claim.createdAt, now) * 30
}

export function compareTrending(
  a: Claim,
  b: Claim,
  scoreOf: (claim: Claim) => number,
): number {
  const delta = scoreOf(b) - scoreOf(a)
  if (delta !== 0) return delta
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}
