import type { UserProfile } from '../types'
import { socialStorage } from './socialStorage'

const GUEST_KEY = 'truthlens_guest_identity'
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

interface GuestRecord {
  id: string
  code: string
  createdAt: string
}

let memoryGuest: UserProfile | null = null

function storageOk(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const probe = '__truthlens_guest_probe'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function makeCode(): string {
  let code = ''
  const bytes =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? crypto.getRandomValues(new Uint8Array(4))
      : null
  for (let i = 0; i < 4; i += 1) {
    const n = bytes ? bytes[i]! : Math.floor(Math.random() * CODE_CHARS.length)
    code += CODE_CHARS[n % CODE_CHARS.length]
  }
  return code
}

function profileFrom(record: GuestRecord): UserProfile {
  return {
    id: record.id,
    username: `guest_${record.code.toLowerCase()}`,
    displayName: `Guest_${record.code}`,
    bio: 'Anonymous guest identity for this browser. No signup. Not an IP address.',
    joinedAt: record.createdAt,
    accountType: 'member',
  }
}

function readRecord(): GuestRecord | null {
  if (!storageOk()) return null
  try {
    const raw = window.localStorage.getItem(GUEST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GuestRecord
    if (!parsed?.id || !parsed.code || !parsed.createdAt) return null
    if (!/^[A-Z0-9]{4}$/i.test(parsed.code)) return null
    return parsed
  } catch {
    return null
  }
}

function writeRecord(record: GuestRecord): void {
  if (!storageOk()) return
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(record))
  } catch {
    /* quota */
  }
}

function upsertUser(profile: UserProfile): void {
  const users = socialStorage.getUsers()
  const existing = users.find((item) => item.id === profile.id)
  if (existing) return
  socialStorage.saveUsers([profile, ...users])
}

export const guestService = {
  ensureCurrentGuest(): UserProfile {
    if (memoryGuest) {
      upsertUser(memoryGuest)
      return memoryGuest
    }
    const stored = readRecord()
    if (stored) {
      const profile = profileFrom(stored)
      memoryGuest = profile
      upsertUser(profile)
      return profile
    }
    const code = makeCode()
    const record: GuestRecord = {
      id: `usr_guest_${code.toLowerCase()}`,
      code,
      createdAt: new Date().toISOString(),
    }
    const profile = profileFrom(record)
    memoryGuest = profile
    writeRecord(record)
    upsertUser(profile)
    return profile
  },

  switchGuest(): UserProfile {
    memoryGuest = null
    const code = makeCode()
    const record: GuestRecord = {
      id: `usr_guest_${code.toLowerCase()}`,
      code,
      createdAt: new Date().toISOString(),
    }
    const profile = profileFrom(record)
    memoryGuest = profile
    writeRecord(record)
    upsertUser(profile)
    return profile
  },
}

