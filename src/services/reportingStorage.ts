import type {
  CommunityReport,
  CommunityReportReason,
  IncidentAuditEvent,
  IncidentReport,
  IncidentStatus,
  ModerationAction,
  ModerationStatus,
} from '../types'
import { COMMUNITY_REPORT_REASONS, INCIDENT_STATUSES, MODERATION_STATUSES } from '../types'

export const REPORTING_KEYS = {
  incidents: 'truthlens_incident_reports',
  community: 'truthlens_community_reports',
  actions: 'truthlens_moderation_actions',
} as const

let incidentsCache: IncidentReport[] | null = null
let communityCache: CommunityReport[] | null = null
let actionsCache: ModerationAction[] | null = null
let hydrated = false

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const probe = '__truthlens_report_probe'
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

function normalizeAudit(value: unknown): IncidentAuditEvent | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const actorId = asString(raw.actorId).trim()
  if (!id || !actorId || !isIsoDate(raw.at)) return null
  const kind = asString(raw.kind)
  if (
    kind !== 'created' &&
    kind !== 'reviewed' &&
    kind !== 'authorized' &&
    kind !== 'generated' &&
    kind !== 'revalidation-flagged'
  ) {
    return null
  }
  return { id, at: raw.at, kind, actorId, note: asString(raw.note) }
}

function normalizeIncident(value: unknown): IncidentReport | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const incidentId = asString(raw.incidentId).trim()
  const claimId = asString(raw.claimId).trim()
  const createdBy = asString(raw.createdBy).trim()
  if (!id || !incidentId || !claimId || !createdBy) return null
  const status: IncidentStatus = isInList(raw.status, INCIDENT_STATUSES) ? raw.status : 'DRAFT'
  const snapshot = raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : null
  if (!snapshot) return null
  const audit = Array.isArray(raw.audit)
    ? raw.audit.map(normalizeAudit).filter((item): item is IncidentAuditEvent => item !== null)
    : []
  return {
    id,
    incidentId,
    claimId,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    createdBy,
    status,
    snapshot: snapshot as IncidentReport['snapshot'],
    notes: asString(raw.notes),
    authorizedAt: isIsoDate(raw.authorizedAt) ? raw.authorizedAt : null,
    authorizedBy: asString(raw.authorizedBy).trim() || null,
    generatedAt: isIsoDate(raw.generatedAt) ? raw.generatedAt : null,
    needsRevalidation: raw.needsRevalidation === true,
    audit,
  }
}

function normalizeCommunity(value: unknown): CommunityReport | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  const reporterId = asString(raw.reporterId).trim()
  if (!id || !claimId || !reporterId) return null
  if (!isInList(raw.reason, COMMUNITY_REPORT_REASONS)) return null
  const status: ModerationStatus = isInList(raw.status, MODERATION_STATUSES) ? raw.status : 'OPEN'
  return {
    id,
    claimId,
    commentId: asString(raw.commentId).trim() || null,
    reporterId,
    reason: raw.reason as CommunityReportReason,
    detail: asString(raw.detail),
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    status,
    target: raw.target === 'comment' ? 'comment' : 'claim',
  }
}

function normalizeAction(value: unknown): ModerationAction | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const reportId = asString(raw.reportId).trim()
  const actorId = asString(raw.actorId).trim()
  const action = asString(raw.action)
  if (!id || !reportId || !actorId) return null
  if (
    action !== 'reviewing' &&
    action !== 'dismiss' &&
    action !== 'send-to-review' &&
    action !== 'resolve'
  ) {
    return null
  }
  return {
    id,
    reportId,
    actorId,
    action,
    note: asString(raw.note),
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
  }
}

function listOrEmpty<T>(parsed: unknown, normalize: (value: unknown) => T | null): T[] {
  if (parsed === null || parsed === undefined) return []
  if (!Array.isArray(parsed)) return []
  return parsed.map(normalize).filter((item): item is T => item !== null)
}

function hydrate(): void {
  if (hydrated && incidentsCache && communityCache && actionsCache) return
  hydrated = true
  incidentsCache = listOrEmpty(parseJson(readRaw(REPORTING_KEYS.incidents)), normalizeIncident)
  communityCache = listOrEmpty(parseJson(readRaw(REPORTING_KEYS.community)), normalizeCommunity)
  actionsCache = listOrEmpty(parseJson(readRaw(REPORTING_KEYS.actions)), normalizeAction)
}

export const reportingStorage = {
  getIncidents(): IncidentReport[] {
    hydrate()
    return clone(incidentsCache ?? [])
  },
  saveIncidents(items: IncidentReport[]): void {
    incidentsCache = clone(items)
    hydrated = true
    writeRaw(REPORTING_KEYS.incidents, JSON.stringify(incidentsCache))
  },
  getCommunityReports(): CommunityReport[] {
    hydrate()
    return clone(communityCache ?? [])
  },
  saveCommunityReports(items: CommunityReport[]): void {
    communityCache = clone(items)
    hydrated = true
    writeRaw(REPORTING_KEYS.community, JSON.stringify(communityCache))
  },
  getActions(): ModerationAction[] {
    hydrate()
    return clone(actionsCache ?? [])
  },
  saveActions(items: ModerationAction[]): void {
    actionsCache = clone(items)
    hydrated = true
    writeRaw(REPORTING_KEYS.actions, JSON.stringify(actionsCache))
  },
}
