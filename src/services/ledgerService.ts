import type { LedgerEntry, LedgerKind, Perspective, ResolutionPath, Verdict } from '../types'
import { createId } from '../utils/format'
import { verificationStorage } from './verificationStorage'

export function appendLedger(input: {
  claimId: string
  kind: LedgerKind
  note: string
  actorId?: string
  actorRole?: 'SYSTEM' | 'REVIEWER'
  perspective?: Perspective | null
  verdict?: Verdict | null
  resolutionPath?: ResolutionPath | null
  timestamp?: string
}): LedgerEntry {
  const entry: LedgerEntry = {
    id: createId('led'),
    claimId: input.claimId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    kind: input.kind,
    verdict: input.verdict ?? null,
    actorId: input.actorId ?? 'system',
    actorRole: input.actorRole ?? 'SYSTEM',
    perspective: input.perspective ?? null,
    note: input.note,
    resolutionPath: input.resolutionPath ?? null,
  }
  verificationStorage.saveLedger([entry, ...verificationStorage.getLedger()])
  return entry
}

export const ledgerService = {
  getAll(): LedgerEntry[] {
    return verificationStorage.getLedger()
  },

  forClaim(claimId: string): LedgerEntry[] {
    return verificationStorage
      .getLedger()
      .filter((item) => item.claimId === claimId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  },

  append: appendLedger,
}
