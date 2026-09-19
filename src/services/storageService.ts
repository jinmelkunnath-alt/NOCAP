import { SEED_CLAIMS, SEED_REVIEWS } from '../data/seed'
import {
  CATEGORIES,
  COMMUNITY_ANALYSIS_STATES,
  CONSENSUS_STATES,
  ORIGIN_TYPES,
  PERSPECTIVES,
  PLATFORMS,
  RESOLUTION_PATHS,
  RISK_FLAGS,
  RISK_LEVELS,
  UPLOAD_TYPES,
  VERDICTS,
  type Claim,
  type ConsensusState,
  type Evidence,
  type Perspective,
  type ResolutionPath,
  type Review,
  type RiskAnalysis,
  type RiskFlag,
  type TextSpan,
  type UploadType,
} from '../types'
import { claimSocialDefaults } from './socialStorage'

export const STORAGE_KEYS = {
  claims: 'truthlens_claims',
  reviews: 'truthlens_reviews',
} as const

let claimsCache: Claim[] | null = null
let reviewsCache: Review[] | null = null
let hydrated = false

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const probe = '__truthlens_probe'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function readRaw(key: string): string | null {
  if (!isStorageAvailable()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, value: string): boolean {
  if (!isStorageAvailable()) return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function parseJson(raw: string | null): unknown {
  if (raw === null || raw.trim() === '') return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

function isInList<T extends string>(value: unknown, list: readonly T[]): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false
  return !Number.isNaN(new Date(value).getTime())
}

function normalizeEvidence(value: unknown): Evidence | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const url = asString(raw.url).trim()
  if (!url && !asString(raw.id)) return null

  const description = asString(raw.description) || asString(raw.note) || undefined
  const title = asString(raw.title) || undefined

  return {
    id: asString(raw.id) || `ev_${Math.random().toString(36).slice(2, 10)}`,
    url,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
  }
}

function normalizeSpan(value: unknown): TextSpan | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const start = asFiniteNumber(raw.start)
  const end = asFiniteNumber(raw.end)
  if (start === null || end === null || end < start) return null
  return { start, end, text: asString(raw.text) }
}

function normalizeAnalysis(value: unknown): RiskAnalysis | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const flags = Array.isArray(raw.flags)
    ? raw.flags.filter((flag): flag is RiskFlag => isInList(flag, RISK_FLAGS))
    : []
  if (!isInList(raw.riskLevel, RISK_LEVELS)) return undefined

  const sensationalRaw = raw.sensational && typeof raw.sensational === 'object'
    ? (raw.sensational as Record<string, unknown>)
    : {}
  const shoutingRaw = raw.shouting && typeof raw.shouting === 'object'
    ? (raw.shouting as Record<string, unknown>)
    : {}
  const unsourcedRaw = raw.unsourced && typeof raw.unsourced === 'object'
    ? (raw.unsourced as Record<string, unknown>)
    : {}

  const matches = Array.isArray(sensationalRaw.matches)
    ? sensationalRaw.matches.filter((item): item is string => typeof item === 'string')
    : []
  const spans = Array.isArray(sensationalRaw.spans)
    ? sensationalRaw.spans.map(normalizeSpan).filter((item): item is TextSpan => item !== null)
    : []

  return {
    flags,
    riskLevel: raw.riskLevel,
    riskScore: asFiniteNumber(raw.riskScore) ?? 0,
    sensational: {
      detected: asBoolean(sensationalRaw.detected, flags.includes('Sensational')),
      matches,
      spans,
    },
    shouting: {
      detected: asBoolean(shoutingRaw.detected, flags.includes('Shouting')),
      uppercasePercentage: asFiniteNumber(shoutingRaw.uppercasePercentage) ?? 0,
    },
    unsourced: {
      detected: asBoolean(unsourcedRaw.detected, flags.includes('Unsourced')),
    },
    explanation: Array.isArray(raw.explanation)
      ? raw.explanation.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

export function normalizeClaim(value: unknown): Claim | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>

  const id = asString(raw.id).trim()
  const text = asString(raw.text).trim()
  if (!id || !text) return null
  if (!isInList(raw.platform, PLATFORMS)) return null
  if (!isInList(raw.category, CATEGORIES)) return null
  if (!isInList(raw.riskLevel, RISK_LEVELS)) return null
  if (!isInList(raw.verdict, VERDICTS)) return null
  if (!isIsoDate(raw.createdAt) || !isIsoDate(raw.updatedAt)) return null

  const flags = Array.isArray(raw.flags)
    ? raw.flags.filter((flag): flag is RiskFlag => isInList(flag, RISK_FLAGS))
    : []

  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.map(normalizeEvidence).filter((item): item is Evidence => item !== null)
    : []

  const confidenceValue = asFiniteNumber(raw.confidence)
  const analysis = normalizeAnalysis(raw.analysis)
  const similarityScore = asFiniteNumber(raw.similarityScore)
  const similarSubmissionCount = asFiniteNumber(raw.similarSubmissionCount) ?? 0
  const matchedClaimId = typeof raw.matchedClaimId === 'string' ? raw.matchedClaimId : null

  return {
    id,
    text,
    sourceUrl: asString(raw.sourceUrl),
    platform: raw.platform,
    category: raw.category,
    flags,
    riskLevel: raw.riskLevel,
    riskScore: asFiniteNumber(raw.riskScore) ?? 0,
    verdict: raw.verdict,
    reviewerNote: asString(raw.reviewerNote),
    reviewerId: asString(raw.reviewerId),
    evidence,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    locked: asBoolean(raw.locked, false),
    confidence: confidenceValue,
    ...(analysis ? { analysis } : {}),
    fingerprint: asString(raw.fingerprint) || undefined,
    matchedClaimId,
    similarityScore,
    potentialDuplicate: asBoolean(raw.potentialDuplicate, false),
    similarSubmissionCount,
    authorId: asString(raw.authorId) || claimSocialDefaults(id).authorId,
    uploadType: isInList(raw.uploadType, UPLOAD_TYPES)
      ? (raw.uploadType as UploadType)
      : claimSocialDefaults(id).uploadType,
    originType: isInList(raw.originType, ORIGIN_TYPES) ? raw.originType : 'USER',
    originalText: asString(raw.originalText) || text,
    enhancedByAI: asBoolean(raw.enhancedByAI, false),
    clusterId: asString(raw.clusterId) || undefined,
    independentCheckCount: asFiniteNumber(raw.independentCheckCount) ?? 0,
    communityAnalysisStatus: isInList(raw.communityAnalysisStatus, COMMUNITY_ANALYSIS_STATES)
      ? raw.communityAnalysisStatus
      : 'none',
    resolutionPath: isInList(raw.resolutionPath, RESOLUTION_PATHS)
      ? (raw.resolutionPath as ResolutionPath)
      : null,
    consensusState: isInList(raw.consensusState, CONSENSUS_STATES)
      ? (raw.consensusState as ConsensusState)
      : null,
    resolvedAt: isIsoDate(raw.resolvedAt) ? raw.resolvedAt : null,
    candidateSources: Array.isArray(raw.candidateSources)
      ? raw.candidateSources.map(normalizeEvidence).filter((item): item is Evidence => item !== null)
      : [],
  }
}

export function normalizeReview(value: unknown): Review | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>

  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  if (!id || !claimId) return null
  if (!isInList(raw.verdict, VERDICTS)) return null
  if (!isIsoDate(raw.createdAt)) return null

  const note = asString(raw.note) || asString(raw.reviewerNote)
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.map(normalizeEvidence).filter((item): item is Evidence => item !== null)
    : []

  const confidence = asFiniteNumber(raw.confidence)

  return {
    id,
    claimId,
    reviewerId: asString(raw.reviewerId),
    verdict: raw.verdict,
    note,
    ...(confidence !== null ? { confidence } : {}),
    evidence,
    createdAt: raw.createdAt,
    reviewerRole: raw.reviewerRole === 'SYSTEM' ? 'SYSTEM' : 'REVIEWER',
    perspective: isInList(raw.perspective, PERSPECTIVES) ? (raw.perspective as Perspective) : null,
  }
}

function normalizeClaimList(value: unknown): Claim[] | null {
  if (value === null) return null
  if (!Array.isArray(value)) return []
  return value.map(normalizeClaim).filter((item): item is Claim => item !== null)
}

function normalizeReviewList(value: unknown): Review[] | null {
  if (value === null) return null
  if (!Array.isArray(value)) return []
  return value.map(normalizeReview).filter((item): item is Review => item !== null)
}

function withSocial(claim: Claim): Claim {
  const defaults = claimSocialDefaults(claim.id)
  return {
    ...claim,
    authorId: claim.authorId ?? defaults.authorId,
    uploadType: claim.uploadType ?? defaults.uploadType,
  }
}

function seedDemoData(): void {
  claimsCache = clone(SEED_CLAIMS).map(withSocial)
  reviewsCache = clone(SEED_REVIEWS)
  writeRaw(STORAGE_KEYS.claims, JSON.stringify(claimsCache))
  writeRaw(STORAGE_KEYS.reviews, JSON.stringify(reviewsCache))
}

function mergeMissingSeed(existing: Claim[], existingReviews: Review[]): { claims: Claim[]; reviews: Review[]; wrote: boolean } {
  const claimIds = new Set(existing.map((item) => item.id))
  const reviewIds = new Set(existingReviews.map((item) => item.id))
  const missingClaims = SEED_CLAIMS.filter((item) => !claimIds.has(item.id))
  const missingReviews = SEED_REVIEWS.filter((item) => !reviewIds.has(item.id))

  if (missingClaims.length === 0 && missingReviews.length === 0) {
    return { claims: existing, reviews: existingReviews, wrote: false }
  }

  let claims = existing
  if (missingClaims.length) {
    const extra = new Map<string, number>()
    for (const item of missingClaims) {
      if (item.matchedClaimId) {
        extra.set(item.matchedClaimId, (extra.get(item.matchedClaimId) ?? 0) + 1)
      }
    }
    claims = existing.map((item) => {
      const bump = extra.get(item.id)
      if (!bump) return item
      return { ...item, similarSubmissionCount: (item.similarSubmissionCount ?? 0) + bump }
    })
    claims = [...claims, ...missingClaims.map(withSocial)]
  }

  return {
    claims,
    reviews: missingReviews.length ? [...existingReviews, ...missingReviews] : existingReviews,
    wrote: true,
  }
}

function hydrate(): void {
  if (hydrated && claimsCache && reviewsCache) return
  hydrated = true

  const claimsParsed = parseJson(readRaw(STORAGE_KEYS.claims))
  const reviewsParsed = parseJson(readRaw(STORAGE_KEYS.reviews))

  const claims = claimsParsed === undefined ? [] : normalizeClaimList(claimsParsed)
  const reviews = reviewsParsed === undefined ? [] : normalizeReviewList(reviewsParsed)

  const claimsMissing = claims === null
  const claimsEmpty = Array.isArray(claims) && claims.length === 0

  if (claimsMissing || claimsEmpty) {
    seedDemoData()
    return
  }

  const merged = mergeMissingSeed(claims, reviews ?? [])
  claimsCache = merged.claims
  reviewsCache = merged.reviews

  if (merged.wrote || reviewsParsed === undefined) {
    writeRaw(STORAGE_KEYS.claims, JSON.stringify(claimsCache))
    writeRaw(STORAGE_KEYS.reviews, JSON.stringify(reviewsCache))
  }
}

export function getStoredClaims(): Claim[] {
  hydrate()
  return clone(claimsCache ?? [])
}

export function saveClaims(claims: Claim[]): void {
  claimsCache = clone(claims)
  hydrated = true
  writeRaw(STORAGE_KEYS.claims, JSON.stringify(claimsCache))
}

export function getStoredReviews(): Review[] {
  hydrate()
  return clone(reviewsCache ?? [])
}

export function saveReviews(reviews: Review[]): void {
  reviewsCache = clone(reviews)
  hydrated = true
  writeRaw(STORAGE_KEYS.reviews, JSON.stringify(reviewsCache))
}

export const storageService = {
  getStoredClaims,
  saveClaims,
  getStoredReviews,
  saveReviews,
}
