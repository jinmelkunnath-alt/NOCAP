import { ACHIEVEMENTS } from '../data/achievements'
import { REVIEWER_USER } from '../data/users'
import type {
  AchievementDef,
  Claim,
  EarnedAchievement,
  HonorBreakdown,
  Review,
  UserProfile,
} from '../types'
import { courtroomStorage } from './courtroomStorage'
import { socialService } from './socialService'
import { storageService } from './storageService'

function reviewsForUser(userId: string, reviews: Review[]): Review[] {
  return reviews.filter((item) => {
    const mapped = REVIEWER_USER[item.reviewerId] ?? item.reviewerId
    return mapped === userId || item.reviewerId === userId
  })
}

export function honorForUser(
  user: UserProfile,
  claims = storageService.getStoredClaims(),
  reviews = storageService.getStoredReviews(),
): HonorBreakdown {
  const mine = reviewsForUser(user.id, reviews)
  const evidenceCount = mine.reduce((sum, item) => sum + item.evidence.length, 0)
  const courtEvidence = courtroomStorage
    .getEvidence()
    .filter((item) => item.authorId === user.id).length
  const comments = socialService.getComments().filter((item) => item.authorId === user.id)
  const helpful = comments.reduce((sum, item) => sum + item.helpfulBy.length, 0)
  const constructive = comments.filter(
    (item) => item.type === 'EVIDENCE' || item.type === 'CORRECTION',
  ).length
  const votes = socialService.getVotes().filter((item) => item.userId === user.id).length
  const authored = claims.filter((item) => item.authorId === user.id).length

  const verificationContributions = mine.length * 40
  const evidenceContributions = (evidenceCount + courtEvidence) * 17
  const helpfulReports = helpful * 8
  const constructiveParticipation =
    constructive * 12 + comments.length * 5 + votes * 2 + authored * 6

  return {
    verificationContributions,
    evidenceContributions,
    helpfulReports,
    constructiveParticipation,
    total:
      verificationContributions +
      evidenceContributions +
      helpfulReports +
      constructiveParticipation,
  }
}

export function achievementsForUser(
  user: UserProfile,
  claims: Claim[] = storageService.getStoredClaims(),
  reviews: Review[] = storageService.getStoredReviews(),
): AchievementDef[] {
  const mine = reviewsForUser(user.id, reviews)
  const comments = socialService.getComments().filter((item) => item.authorId === user.id)
  const authored = claims.filter((item) => item.authorId === user.id)
  const variants = authored.filter((item) => item.potentialDuplicate || (item.similarityScore ?? 0) >= 70)
  const metricsHot = authored.some((item) => {
    const m = socialService.metricsFor(item.id)
    return m.votes + m.comments + m.shares + m.saves >= 8
  })
  const tenureDays =
    (Date.now() - new Date(user.joinedAt).getTime()) / (1000 * 60 * 60 * 24)
  const constructive = comments.some(
    (item) => item.type === 'EVIDENCE' || item.type === 'CORRECTION',
  )

  const unlocked = new Set<string>()
  if (mine.length >= 1) unlocked.add('first-investigator')
  if (mine.length >= 10) unlocked.add('truth-seeker')
  if (mine.length >= 25) unlocked.add('fact-guardian')
  if (variants.length >= 2) unlocked.add('sharp-eye')
  if (constructive) unlocked.add('bridge-builder')
  if (comments.length >= 5 || comments.reduce((sum, item) => sum + item.helpfulBy.length, 0) >= 4) {
    unlocked.add('community-voice')
  }
  if (metricsHot || authored.length >= 3) unlocked.add('rumour-tracker')
  if (tenureDays >= 180) unlocked.add('truthlens-veteran')

  return ACHIEVEMENTS.filter((item) => unlocked.has(item.id))
}

function nthDate<T>(items: T[], n: number, stamp: (item: T) => string): string | null {
  if (items.length < n) return null
  const sorted = [...items].sort(
    (a, b) => new Date(stamp(a)).getTime() - new Date(stamp(b)).getTime(),
  )
  const hit = sorted[n - 1]
  return hit ? stamp(hit) : null
}

export function achievementsEarned(
  user: UserProfile,
  claims: Claim[] = storageService.getStoredClaims(),
  reviews: Review[] = storageService.getStoredReviews(),
): EarnedAchievement[] {
  const mine = reviewsForUser(user.id, reviews).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  const comments = socialService
    .getComments()
    .filter((item) => item.authorId === user.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const authored = claims
    .filter((item) => item.authorId === user.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const variants = authored.filter(
    (item) => item.potentialDuplicate || (item.similarityScore ?? 0) >= 70,
  )
  const constructive = comments.filter(
    (item) => item.type === 'EVIDENCE' || item.type === 'CORRECTION',
  )
  const helpfulTotal = comments.reduce((sum, item) => sum + item.helpfulBy.length, 0)
  const hot = authored.find((item) => {
    const metrics = socialService.metricsFor(item.id)
    return metrics.votes + metrics.comments + metrics.shares + metrics.saves >= 8
  })
  const tenureDays =
    (Date.now() - new Date(user.joinedAt).getTime()) / (1000 * 60 * 60 * 24)

  const dates: Record<string, string | null> = {
    'first-investigator': nthDate(mine, 1, (item) => item.createdAt),
    'truth-seeker': nthDate(mine, 10, (item) => item.createdAt),
    'fact-guardian': nthDate(mine, 25, (item) => item.createdAt),
    'sharp-eye': nthDate(variants, 2, (item) => item.createdAt),
    'bridge-builder': nthDate(constructive, 1, (item) => item.createdAt),
    'community-voice':
      comments.length >= 5 || helpfulTotal >= 4 ? (comments[4]?.createdAt ?? comments[0]?.createdAt ?? null) : null,
    'rumour-tracker': hot?.createdAt ?? (authored.length >= 3 ? authored[2]?.createdAt ?? null : null),
    'truthlens-veteran': tenureDays >= 180 ? user.joinedAt : null,
  }

  return ACHIEVEMENTS.filter((item) => dates[item.id]).map((item) => ({
    ...item,
    earnedAt: dates[item.id] ?? null,
  }))
}

export function contributionLines(
  user: UserProfile,
  claims: Claim[] = storageService.getStoredClaims(),
  reviews: Review[] = storageService.getStoredReviews(),
): string[] {
  const mine = reviewsForUser(user.id, reviews)
  const comments = socialService.getComments().filter((item) => item.authorId === user.id)
  const courtEvidence = courtroomStorage
    .getEvidence()
    .filter((item) => item.authorId === user.id).length
  const evidence = mine.reduce((sum, item) => sum + item.evidence.length, 0) + courtEvidence
  const helpful = comments.filter((item) => item.helpfulBy.length > 0).length
  const submitted = claims.filter((item) => item.authorId === user.id).length
  const lines: string[] = []
  if (mine.length > 0) lines.push(`+ Verification contribution · ${mine.length}`)
  if (evidence > 0) lines.push(`+ Evidence contribution · ${evidence}`)
  if (helpful > 0) lines.push(`+ Helpful discussion · ${helpful}`)
  if (comments.length > 0) lines.push(`+ Community discussion · ${comments.length}`)
  if (submitted > 0) lines.push(`+ Claims submitted · ${submitted}`)
  return lines
}

export const honorService = {
  honorForUser,
  achievementsForUser,
  achievementsEarned,
  contributionLines,
  definitions: ACHIEVEMENTS,
}
