import { SEED_LEDGER } from '../data/ledgerSeed'
import type { DeskNotification, LedgerEntry, LedgerKind, ResolutionPath, Verdict } from '../types'
import { LEDGER_KINDS, PERSPECTIVES, RESOLUTION_PATHS, VERDICTS } from '../types'

export const VERIFICATION_KEYS = {
  ledger: 'truthlens_ledger',
  notifications: 'truthlens_notifications',
  desk: 'truthlens_desk_reviewer',
} as const

let ledgerCache: LedgerEntry[] | null = null
let notificationsCache: DeskNotification[] | null = null
let hydrated = false

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const probe = '__truthlens_verif_probe'
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
  if (typeof value !== 'string' || value.trim() === '') return false
  return !Number.isNaN(new Date(value).getTime())
}

function isInList<T extends string>(value: unknown, list: readonly T[]): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

function normalizeLedger(value: unknown): LedgerEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  if (!id || !claimId) return null
  if (!isInList(raw.kind, LEDGER_KINDS)) return null
  if (!isIsoDate(raw.timestamp)) return null
  const verdict =
    raw.verdict === null || raw.verdict === undefined
      ? null
      : isInList(raw.verdict, VERDICTS)
        ? (raw.verdict as Verdict)
        : null
  return {
    id,
    claimId,
    timestamp: raw.timestamp,
    kind: raw.kind as LedgerKind,
    verdict,
    actorId: asString(raw.actorId) || 'system',
    actorRole: raw.actorRole === 'REVIEWER' ? 'REVIEWER' : 'SYSTEM',
    perspective: isInList(raw.perspective, PERSPECTIVES) ? raw.perspective : null,
    note: asString(raw.note),
    resolutionPath: isInList(raw.resolutionPath, RESOLUTION_PATHS)
      ? (raw.resolutionPath as ResolutionPath)
      : null,
  }
}

function normalizeNotification(value: unknown): DeskNotification | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const userId = asString(raw.userId).trim()
  const title = asString(raw.title).trim()
  if (!id || !userId || !title) return null
  return {
    id,
    userId,
    claimId: asString(raw.claimId) || undefined,
    title,
    body: asString(raw.body),
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    read: Boolean(raw.read),
  }
}

function listOrNull<T>(parsed: unknown, normalize: (value: unknown) => T | null): T[] | null {
  if (parsed === null) return null
  if (!Array.isArray(parsed)) return []
  return parsed.map(normalize).filter((item): item is T => item !== null)
}

function mergeById<T extends { id: string }>(existing: T[], seed: T[]): T[] {
  const ids = new Set(existing.map((item) => item.id))
  const missing = seed.filter((item) => !ids.has(item.id))
  return missing.length ? [...existing, ...missing] : existing
}

function hydrate(): void {
  if (hydrated && ledgerCache && notificationsCache) return
  hydrated = true
  const ledgerParsed = parseJson(readRaw(VERIFICATION_KEYS.ledger))
  const notesParsed = parseJson(readRaw(VERIFICATION_KEYS.notifications))
  const ledger = ledgerParsed === undefined ? [] : listOrNull(ledgerParsed, normalizeLedger)
  const notes = notesParsed === undefined ? [] : listOrNull(notesParsed, normalizeNotification)

  if (ledger === null || ledger.length === 0) {
    ledgerCache = clone(SEED_LEDGER)
    notificationsCache = notes ?? []
    writeRaw(VERIFICATION_KEYS.ledger, JSON.stringify(ledgerCache))
    writeRaw(VERIFICATION_KEYS.notifications, JSON.stringify(notificationsCache))
    return
  }

  ledgerCache = mergeById(ledger, SEED_LEDGER)
  notificationsCache = notes ?? []
  writeRaw(VERIFICATION_KEYS.ledger, JSON.stringify(ledgerCache))
  writeRaw(VERIFICATION_KEYS.notifications, JSON.stringify(notificationsCache))
}

export const verificationStorage = {
  getLedger(): LedgerEntry[] {
    hydrate()
    return clone(ledgerCache ?? [])
  },
  saveLedger(items: LedgerEntry[]): void {
    ledgerCache = clone(items)
    hydrated = true
    writeRaw(VERIFICATION_KEYS.ledger, JSON.stringify(ledgerCache))
  },
  getNotifications(): DeskNotification[] {
    hydrate()
    return clone(notificationsCache ?? [])
  },
  saveNotifications(items: DeskNotification[]): void {
    notificationsCache = clone(items)
    hydrated = true
    writeRaw(VERIFICATION_KEYS.notifications, JSON.stringify(notificationsCache))
  },
  getDeskReviewerId(): string | null {
    return readRaw(VERIFICATION_KEYS.desk)
  },
  setDeskReviewerId(id: string): void {
    writeRaw(VERIFICATION_KEYS.desk, id)
  },
}
