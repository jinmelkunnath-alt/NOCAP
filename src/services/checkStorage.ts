import { SEED_ANALYSIS, SEED_CHECKS } from '../data/checkSeed'
import type { AiAssessment, AiLabel, AiVerificationState, CommunityAiAnalysis, RumourCheck } from '../types'
import { AI_LABELS, AI_VERIFICATION_STATES } from '../types'

export const CHECK_KEYS = {
  checks: 'truthlens_rumour_checks',
  analysis: 'truthlens_community_analysis',
} as const

let checksCache: RumourCheck[] | null = null
let analysisCache: CommunityAiAnalysis[] | null = null
let hydrated = false

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const probe = '__truthlens_check_probe'
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

function writeRaw(key: string, value: string): void {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* quota */
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

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(new Date(value).getTime())
}

function isInList<T extends string>(value: unknown, list: readonly T[]): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

function normalizeAssessment(value: unknown): AiAssessment | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (!isInList(raw.label, AI_LABELS)) return null
  if (!isInList(raw.verification, AI_VERIFICATION_STATES)) return null
  const confidence = typeof raw.aiConfidence === 'number' && Number.isFinite(raw.aiConfidence) ? raw.aiConfidence : 0
  return {
    label: raw.label as AiLabel,
    verification: raw.verification as AiVerificationState,
    found: raw.found === true,
    aiConfidence: Math.max(0, Math.min(100, Math.round(confidence))),
    why: asString(raw.why),
    matchedClaimId: asString(raw.matchedClaimId).trim() || null,
    similarityPercent:
      typeof raw.similarityPercent === 'number' && Number.isFinite(raw.similarityPercent)
        ? raw.similarityPercent
        : null,
    evidenceNote: asString(raw.evidenceNote),
  }
}

function normalizeCheck(value: unknown): RumourCheck | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const userId = asString(raw.userId).trim()
  const originalText = asString(raw.originalText).trim()
  const fingerprint = asString(raw.fingerprint).trim()
  const clusterId = asString(raw.clusterId).trim()
  const result = normalizeAssessment(raw.result)
  if (!id || !userId || !originalText || !fingerprint || !clusterId || !result || !isIsoDate(raw.createdAt)) {
    return null
  }
  return {
    id,
    userId,
    originalText,
    fingerprint,
    clusterId,
    createdAt: raw.createdAt,
    postedClaimId: asString(raw.postedClaimId).trim() || null,
    result,
  }
}

function normalizeAnalysis(value: unknown): CommunityAiAnalysis | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  if (!id || !claimId || !isIsoDate(raw.createdAt)) return null
  if (!isInList(raw.label, AI_LABELS)) return null
  if (!isInList(raw.verification, AI_VERIFICATION_STATES)) return null
  const confidence = typeof raw.aiConfidence === 'number' && Number.isFinite(raw.aiConfidence) ? raw.aiConfidence : 0
  const responseCount = typeof raw.responseCount === 'number' ? raw.responseCount : 0
  const uniqueUsers = typeof raw.uniqueUsers === 'number' ? raw.uniqueUsers : 0
  return {
    id,
    claimId,
    createdAt: raw.createdAt,
    responseCount,
    uniqueUsers,
    label: raw.label as AiLabel,
    verification: raw.verification as AiVerificationState,
    aiConfidence: Math.max(0, Math.min(100, Math.round(confidence))),
    why: asString(raw.why),
  }
}

function listOrEmpty<T>(parsed: unknown, normalize: (value: unknown) => T | null): T[] {
  if (parsed === null || parsed === undefined) return []
  if (!Array.isArray(parsed)) return []
  return parsed.map(normalize).filter((item): item is T => item !== null)
}

function mergeById<T extends { id: string }>(existing: T[], seed: T[]): T[] {
  const ids = new Set(existing.map((item) => item.id))
  const missing = seed.filter((item) => !ids.has(item.id))
  return missing.length ? [...existing, ...missing] : existing
}

function hydrate(): void {
  if (hydrated && checksCache && analysisCache) return
  hydrated = true
  const checksParsed = parseJson(readRaw(CHECK_KEYS.checks))
  const analysisParsed = parseJson(readRaw(CHECK_KEYS.analysis))
  const checks = checksParsed === undefined ? [] : listOrEmpty(checksParsed, normalizeCheck)
  const analysis = analysisParsed === undefined ? [] : listOrEmpty(analysisParsed, normalizeAnalysis)
  if (checksParsed === undefined && analysisParsed === undefined) {
    checksCache = clone(SEED_CHECKS)
    analysisCache = clone(SEED_ANALYSIS)
    writeRaw(CHECK_KEYS.checks, JSON.stringify(checksCache))
    writeRaw(CHECK_KEYS.analysis, JSON.stringify(analysisCache))
    return
  }
  checksCache = mergeById(checks, SEED_CHECKS)
  analysisCache = mergeById(analysis, SEED_ANALYSIS)
  writeRaw(CHECK_KEYS.checks, JSON.stringify(checksCache))
  writeRaw(CHECK_KEYS.analysis, JSON.stringify(analysisCache))
}

export const checkStorage = {
  getChecks(): RumourCheck[] {
    hydrate()
    return clone(checksCache ?? [])
  },
  saveChecks(items: RumourCheck[]): void {
    checksCache = clone(items)
    hydrated = true
    writeRaw(CHECK_KEYS.checks, JSON.stringify(checksCache))
  },
  getAnalysis(): CommunityAiAnalysis[] {
    hydrate()
    return clone(analysisCache ?? [])
  },
  saveAnalysis(items: CommunityAiAnalysis[]): void {
    analysisCache = clone(items)
    hydrated = true
    writeRaw(CHECK_KEYS.analysis, JSON.stringify(analysisCache))
  },
}
