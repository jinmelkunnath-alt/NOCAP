import { buildSocialSeed } from '../data/socialSeed'
import { CLAIM_SOCIAL, SEED_USERS } from '../data/users'
import type {
  Bookmark,
  CommentKind,
  CommentRecord,
  EngagementEvent,
  EngagementType,
  Follow,
  ShareRecord,
  UploadType,
  UserProfile,
  Vote,
  VoteType,
} from '../types'
import { ACCOUNT_TYPES, COMMENT_TYPES, ENGAGEMENT_TYPES, PERSPECTIVES, VOTE_TYPES } from '../types'

export const SOCIAL_KEYS = {
  users: 'truthlens_users',
  votes: 'truthlens_votes',
  comments: 'truthlens_comments',
  follows: 'truthlens_follows',
  bookmarks: 'truthlens_bookmarks',
  shares: 'truthlens_shares',
  engagement: 'truthlens_engagement',
  searches: 'truthlens_searches',
} as const

let usersCache: UserProfile[] | null = null
let votesCache: Vote[] | null = null
let commentsCache: CommentRecord[] | null = null
let followsCache: Follow[] | null = null
let bookmarksCache: Bookmark[] | null = null
let sharesCache: ShareRecord[] | null = null
let engagementCache: EngagementEvent[] | null = null
let searchesCache: string[] | null = null
let hydrated = false

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const probe = '__truthlens_social_probe'
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

function normalizeUser(value: unknown): UserProfile | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const username = asString(raw.username).trim()
  if (!id || !username) return null
  return {
    id,
    username,
    displayName: asString(raw.displayName) || username,
    bio: asString(raw.bio),
    joinedAt: isIsoDate(raw.joinedAt) ? raw.joinedAt : '2026-01-01T00:00:00.000Z',
    accountType: isInList(raw.accountType, ACCOUNT_TYPES) ? raw.accountType : 'member',
    perspective: isInList(raw.perspective, PERSPECTIVES) ? raw.perspective : null,
  }
}

function normalizeVote(value: unknown): Vote | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  const userId = asString(raw.userId).trim()
  if (!id || !claimId || !userId) return null
  if (!isInList(raw.type, VOTE_TYPES)) return null
  if (!isIsoDate(raw.createdAt)) return null
  return { id, claimId, userId, type: raw.type as VoteType, createdAt: raw.createdAt }
}

function normalizeComment(value: unknown): CommentRecord | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  const authorId = asString(raw.authorId).trim()
  const text = asString(raw.text).trim()
  if (!id || !claimId || !authorId || !text) return null
  if (!isIsoDate(raw.createdAt)) return null
  const helpfulBy = Array.isArray(raw.helpfulBy)
    ? raw.helpfulBy.filter((item): item is string => typeof item === 'string')
    : []
  const reportedBy = Array.isArray(raw.reportedBy)
    ? raw.reportedBy.filter((item): item is string => typeof item === 'string')
    : []
  return {
    id,
    claimId,
    authorId,
    parentId: typeof raw.parentId === 'string' ? raw.parentId : null,
    type: isInList(raw.type, COMMENT_TYPES) ? (raw.type as CommentKind) : 'GENERAL',
    text,
    createdAt: raw.createdAt,
    helpfulBy,
    reportedBy,
  }
}

function normalizeFollow(value: unknown): Follow | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const followerId = asString(raw.followerId).trim()
  const followingId = asString(raw.followingId).trim()
  if (!id || !followerId || !followingId) return null
  return {
    id,
    followerId,
    followingId,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : '2026-01-01T00:00:00.000Z',
  }
}

function normalizeBookmark(value: unknown): Bookmark | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const userId = asString(raw.userId).trim()
  const claimId = asString(raw.claimId).trim()
  if (!id || !userId || !claimId) return null
  return {
    id,
    userId,
    claimId,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : '2026-01-01T00:00:00.000Z',
  }
}

function normalizeShare(value: unknown): ShareRecord | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const userId = asString(raw.userId).trim()
  const claimId = asString(raw.claimId).trim()
  if (!id || !userId || !claimId) return null
  return {
    id,
    userId,
    claimId,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : '2026-01-01T00:00:00.000Z',
  }
}

function normalizeEngagement(value: unknown): EngagementEvent | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asString(raw.id).trim()
  const claimId = asString(raw.claimId).trim()
  const userId = asString(raw.userId).trim()
  if (!id || !claimId || !userId) return null
  if (!isInList(raw.type, ENGAGEMENT_TYPES)) return null
  if (!isIsoDate(raw.createdAt)) return null
  return {
    id,
    claimId,
    userId,
    type: raw.type as EngagementType,
    createdAt: raw.createdAt,
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

function seedAll(): void {
  const seed = buildSocialSeed()
  usersCache = clone(seed.users)
  votesCache = clone(seed.votes)
  commentsCache = clone(seed.comments)
  followsCache = clone(seed.follows)
  bookmarksCache = clone(seed.bookmarks)
  sharesCache = clone(seed.shares)
  engagementCache = clone(seed.engagement)
  searchesCache = []
  persistAll()
}

function persistAll(): void {
  writeRaw(SOCIAL_KEYS.users, JSON.stringify(usersCache ?? []))
  writeRaw(SOCIAL_KEYS.votes, JSON.stringify(votesCache ?? []))
  writeRaw(SOCIAL_KEYS.comments, JSON.stringify(commentsCache ?? []))
  writeRaw(SOCIAL_KEYS.follows, JSON.stringify(followsCache ?? []))
  writeRaw(SOCIAL_KEYS.bookmarks, JSON.stringify(bookmarksCache ?? []))
  writeRaw(SOCIAL_KEYS.shares, JSON.stringify(sharesCache ?? []))
  writeRaw(SOCIAL_KEYS.engagement, JSON.stringify(engagementCache ?? []))
  writeRaw(SOCIAL_KEYS.searches, JSON.stringify(searchesCache ?? []))
}

function hydrate(): void {
  if (hydrated && usersCache && votesCache && commentsCache) return
  hydrated = true

  const usersParsed = parseJson(readRaw(SOCIAL_KEYS.users))
  const users = usersParsed === undefined ? [] : listOrNull(usersParsed, normalizeUser)

  if (users === null || users.length === 0) {
    seedAll()
    return
  }

  const seed = buildSocialSeed()
  const votes = listOrNull(parseJson(readRaw(SOCIAL_KEYS.votes)), normalizeVote) ?? []
  const comments = listOrNull(parseJson(readRaw(SOCIAL_KEYS.comments)), normalizeComment) ?? []
  const follows = listOrNull(parseJson(readRaw(SOCIAL_KEYS.follows)), normalizeFollow) ?? []
  const bookmarks = listOrNull(parseJson(readRaw(SOCIAL_KEYS.bookmarks)), normalizeBookmark) ?? []
  const shares = listOrNull(parseJson(readRaw(SOCIAL_KEYS.shares)), normalizeShare) ?? []
  const engagement = listOrNull(parseJson(readRaw(SOCIAL_KEYS.engagement)), normalizeEngagement) ?? []
  const searchesParsed = parseJson(readRaw(SOCIAL_KEYS.searches))
  const searches = Array.isArray(searchesParsed)
    ? searchesParsed.filter((item): item is string => typeof item === 'string')
    : []

  usersCache = mergeById(users, seed.users)
  votesCache = mergeById(votes, seed.votes)
  commentsCache = mergeById(comments, seed.comments)
  followsCache = mergeById(follows, seed.follows)
  bookmarksCache = mergeById(bookmarks, seed.bookmarks)
  sharesCache = mergeById(shares, seed.shares)
  engagementCache = mergeById(engagement, seed.engagement)
  searchesCache = searches
  persistAll()
}

export function claimSocialDefaults(id: string): { authorId: string; uploadType: UploadType } {
  return CLAIM_SOCIAL[id] ?? { authorId: SEED_USERS[0]?.id ?? 'usr_truthseeker', uploadType: 'user' }
}

export const socialStorage = {
  getUsers(): UserProfile[] {
    hydrate()
    return clone(usersCache ?? [])
  },
  saveUsers(items: UserProfile[]): void {
    usersCache = clone(items)
    hydrated = true
    writeRaw(SOCIAL_KEYS.users, JSON.stringify(usersCache))
  },
  getVotes(): Vote[] {
    hydrate()
    return clone(votesCache ?? [])
  },
  saveVotes(items: Vote[]): void {
    votesCache = clone(items)
    hydrated = true
    writeRaw(SOCIAL_KEYS.votes, JSON.stringify(votesCache))
  },
  getComments(): CommentRecord[] {
    hydrate()
    return clone(commentsCache ?? [])
  },
  saveComments(items: CommentRecord[]): void {
    commentsCache = clone(items)
    hydrated = true
    writeRaw(SOCIAL_KEYS.comments, JSON.stringify(commentsCache))
  },
  getFollows(): Follow[] {
    hydrate()
    return clone(followsCache ?? [])
  },
  saveFollows(items: Follow[]): void {
    followsCache = clone(items)
    hydrated = true
    writeRaw(SOCIAL_KEYS.follows, JSON.stringify(followsCache))
  },
  getBookmarks(): Bookmark[] {
    hydrate()
    return clone(bookmarksCache ?? [])
  },
  saveBookmarks(items: Bookmark[]): void {
    bookmarksCache = clone(items)
    hydrated = true
    writeRaw(SOCIAL_KEYS.bookmarks, JSON.stringify(bookmarksCache))
  },
  getShares(): ShareRecord[] {
    hydrate()
    return clone(sharesCache ?? [])
  },
  saveShares(items: ShareRecord[]): void {
    sharesCache = clone(items)
    hydrated = true
    writeRaw(SOCIAL_KEYS.shares, JSON.stringify(sharesCache))
  },
  getEngagement(): EngagementEvent[] {
    hydrate()
    return clone(engagementCache ?? [])
  },
  saveEngagement(items: EngagementEvent[]): void {
    engagementCache = clone(items)
    hydrated = true
    writeRaw(SOCIAL_KEYS.engagement, JSON.stringify(engagementCache))
  },
  getSearches(): string[] {
    hydrate()
    return clone(searchesCache ?? [])
  },
  saveSearches(items: string[]): void {
    searchesCache = clone(items)
    hydrated = true
    writeRaw(SOCIAL_KEYS.searches, JSON.stringify(searchesCache))
  },
}
