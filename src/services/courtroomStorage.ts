import type {
  ClaimPoll,
  CourtEvidence,
  CourtEvidenceStatus,
  CourtEvidenceType,
  CourtroomLeaning,
  CourtroomSession,
  PollVote,
} from '../types'
import {
  COURT_EVIDENCE_STATUSES,
  COURT_EVIDENCE_TYPES,
  COURTROOM_LEANINGS,
} from '../types'

export const COURTROOM_KEYS = {
  sessions: 'truthlens_courtrooms',
  evidence: 'truthlens_court_evidence',
  polls: 'truthlens_polls',
  pollVotes: 'truthlens_poll_votes',
} as const

let sessionsCache: CourtroomSession[] | null = null
let evidenceCache: CourtEvidence[] | null = null
let pollsCache: ClaimPoll[] | null = null
let pollVotesCache: PollVote[] | null = null
let hydrated = false

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const probe = '__truthlens_court_probe'
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
  if (typeof value === 'string' && value.trim() !== '') {
    return !Number.isNaN(new Date(value).getTime())
  }
  return false
}

function isInList<T extends string>(value: unknown, list: readonly T[]): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

function normalizeArgument(value: unknown, role: 'prosecutor' | 'defender') {
  if (!value || typeof value !== 'object') {
    return {
      role,
      argument: ['Insufficient evidence available for this argument.'],
      evidence: ['Insufficient evidence available.'],
      reasoning: ['No stored claim material was available to structure this role.'],
      limitations: ['This is a demo adapter. It cannot invent missing sources.'],
    }
  }
  const raw = value as Record<string, unknown>
  return {
    role,
    argument: asStringList(raw.argument).length
      ? asStringList(raw.argument)
      : ['Insufficient evidence available for this argument.'],
    evidence: asStringList(raw.evidence).length
      ? asStringList(raw.evidence)
      : ['Insufficient evidence available.'],
    reasoning: asStringList(raw.reasoning).length
      ? asStringList(raw.reasoning)
      : ['No stored reasoning was recorded.'],
    limitations: asStringList(raw.limitations).length
      ? asStringList(raw.limitations)
      : ['This is a demo adapter. It cannot invent missing sources.'],
  }
}

function normalizeSession(value: unknown): CourtroomSession | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  if (!id || !claimId) return null
  const judgeRaw =
    raw.judge && typeof raw.judge === 'object' ? (raw.judge as Record<string, unknown>) : {}
  const leaning: CourtroomLeaning = isInList(judgeRaw.leaning, COURTROOM_LEANINGS)
    ? judgeRaw.leaning
    : 'INSUFFICIENT EVIDENCE'
  const snapshot =
    raw.communitySnapshot && typeof raw.communitySnapshot === 'object'
      ? (raw.communitySnapshot as Record<string, unknown>)
      : {}
  const confidence = Number(judgeRaw.assessmentConfidence)
  return {
    id,
    claimId,
    hearingNumber: Number.isFinite(Number(raw.hearingNumber))
      ? Math.max(1, Math.floor(Number(raw.hearingNumber)))
      : 1,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    prosecutor: normalizeArgument(raw.prosecutor, 'prosecutor'),
    defender: normalizeArgument(raw.defender, 'defender'),
    judge: {
      leaning,
      rationale:
        asString(judgeRaw.rationale).trim() ||
        'Insufficient evidence available for an advisory assessment.',
      supporting: asStringList(judgeRaw.supporting),
      counterpoints: asStringList(judgeRaw.counterpoints),
      evidenceGaps: asStringList(judgeRaw.evidenceGaps).length
        ? asStringList(judgeRaw.evidenceGaps)
        : ['Insufficient evidence available.'],
      assessmentConfidence:
        Number.isFinite(confidence) ? Math.max(0, Math.min(100, Math.round(confidence))) : 0,
    },
    evidenceIds: asStringList(raw.evidenceIds),
    communitySnapshot: {
      agree: Number.isFinite(Number(snapshot.agree)) ? Number(snapshot.agree) : 0,
      disagree: Number.isFinite(Number(snapshot.disagree)) ? Number(snapshot.disagree) : 0,
      unsure: Number.isFinite(Number(snapshot.unsure)) ? Number(snapshot.unsure) : 0,
      total: Number.isFinite(Number(snapshot.total)) ? Number(snapshot.total) : 0,
    },
    demo: raw.demo !== false,
  }
}

function normalizeEvidence(value: unknown): CourtEvidence | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  const title = asString(raw.title).trim()
  if (!id || !claimId || !title) return null
  const type: CourtEvidenceType = isInList(raw.type, COURT_EVIDENCE_TYPES)
    ? raw.type
    : 'USER_CONTRIBUTION'
  const status: CourtEvidenceStatus = isInList(raw.status, COURT_EVIDENCE_STATUSES)
    ? raw.status
    : 'needs-human-review'
  const url = asString(raw.url).trim()
  const authorId = asString(raw.authorId).trim()
  return {
    id,
    claimId,
    type,
    title,
    reference: asString(raw.reference).trim() || title,
    explanation: asString(raw.explanation).trim() || 'No explanation recorded.',
    status,
    url: url || undefined,
    authorId: authorId || undefined,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
  }
}

function normalizePoll(value: unknown): ClaimPoll | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  const question = asString(raw.question).trim()
  const authorId = asString(raw.authorId).trim()
  if (!id || !claimId || !question || !authorId) return null
  const options = asStringList(raw.options)
  if (options.length < 2) return null
  return {
    id,
    claimId,
    question,
    options,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    authorId,
  }
}

function normalizePollVote(value: unknown): PollVote | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const pollId = asString(raw.pollId).trim()
  const userId = asString(raw.userId).trim()
  const optionIndex = Number(raw.optionIndex)
  if (!id || !pollId || !userId || !Number.isInteger(optionIndex) || optionIndex < 0) return null
  return {
    id,
    pollId,
    userId,
    optionIndex,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
  }
}

function listOrEmpty<T>(parsed: unknown, normalize: (value: unknown) => T | null): T[] {
  if (parsed === null || parsed === undefined) return []
  if (!Array.isArray(parsed)) return []
  return parsed.map(normalize).filter((item): item is T => item !== null)
}

function persist(): void {
  writeRaw(COURTROOM_KEYS.sessions, JSON.stringify(sessionsCache ?? []))
  writeRaw(COURTROOM_KEYS.evidence, JSON.stringify(evidenceCache ?? []))
  writeRaw(COURTROOM_KEYS.polls, JSON.stringify(pollsCache ?? []))
  writeRaw(COURTROOM_KEYS.pollVotes, JSON.stringify(pollVotesCache ?? []))
}

function hydrate(): void {
  if (hydrated && sessionsCache && evidenceCache && pollsCache && pollVotesCache) return
  hydrated = true
  sessionsCache = listOrEmpty(parseJson(readRaw(COURTROOM_KEYS.sessions)), normalizeSession)
  evidenceCache = listOrEmpty(parseJson(readRaw(COURTROOM_KEYS.evidence)), normalizeEvidence)
  pollsCache = listOrEmpty(parseJson(readRaw(COURTROOM_KEYS.polls)), normalizePoll)
  pollVotesCache = listOrEmpty(parseJson(readRaw(COURTROOM_KEYS.pollVotes)), normalizePollVote)
}

export const courtroomStorage = {
  getSessions(): CourtroomSession[] {
    hydrate()
    return clone(sessionsCache ?? [])
  },
  saveSessions(items: CourtroomSession[]): void {
    sessionsCache = clone(items)
    hydrated = true
    writeRaw(COURTROOM_KEYS.sessions, JSON.stringify(sessionsCache))
  },
  getEvidence(): CourtEvidence[] {
    hydrate()
    return clone(evidenceCache ?? [])
  },
  saveEvidence(items: CourtEvidence[]): void {
    evidenceCache = clone(items)
    hydrated = true
    writeRaw(COURTROOM_KEYS.evidence, JSON.stringify(evidenceCache))
  },
  getPolls(): ClaimPoll[] {
    hydrate()
    return clone(pollsCache ?? [])
  },
  savePolls(items: ClaimPoll[]): void {
    pollsCache = clone(items)
    hydrated = true
    writeRaw(COURTROOM_KEYS.polls, JSON.stringify(pollsCache))
  },
  getPollVotes(): PollVote[] {
    hydrate()
    return clone(pollVotesCache ?? [])
  },
  savePollVotes(items: PollVote[]): void {
    pollVotesCache = clone(items)
    hydrated = true
    writeRaw(COURTROOM_KEYS.pollVotes, JSON.stringify(pollVotesCache))
  },
  persistAll(): void {
    hydrate()
    persist()
  },
}
