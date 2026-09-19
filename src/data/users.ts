import type { Perspective, UploadType, UserProfile } from '../types'

export const CURRENT_USER_ID = 'usr_truthseeker'

export const SEED_USERS: UserProfile[] = [
  {
    id: 'usr_truthseeker',
    username: 'truthseeker',
    displayName: 'Truth Seeker',
    bio: 'I post circulating rumours so they can be checked in the open. Demo account.',
    joinedAt: '2025-11-12T08:00:00.000Z',
    accountType: 'member',
  },
  {
    id: 'usr_campuswatch',
    username: 'campuswatch',
    displayName: 'Campus Watch',
    bio: 'Campus and civic rumour tracker. Demo account.',
    joinedAt: '2025-12-03T10:20:00.000Z',
    accountType: 'reviewer',
  },
  {
    id: 'usr_dailybuzz',
    username: 'dailybuzz',
    displayName: 'Daily Buzz',
    bio: 'What is spreading today. Demo account — not a newsroom.',
    joinedAt: '2026-01-18T14:00:00.000Z',
    accountType: 'member',
  },
  {
    id: 'usr_factfinder',
    username: 'factfinder',
    displayName: 'Fact Finder',
    bio: 'Evidence-first contributor on the verification desk. Demo reviewer.',
    joinedAt: '2025-10-02T09:30:00.000Z',
    accountType: 'reviewer',
  },
  {
    id: 'usr_rumourtracker',
    username: 'rumourtracker',
    displayName: 'Rumour Tracker',
    bio: 'Follows viral forwards and flags close variants. Demo account.',
    joinedAt: '2026-02-09T11:45:00.000Z',
    accountType: 'member',
  },
  {
    id: 'usr_rev_atlas',
    username: 'atlas',
    displayName: 'Reviewer Atlas',
    bio: 'Desk reviewer. Perspective A is a role tag for independent review, not a political identity.',
    joinedAt: '2025-09-01T09:00:00.000Z',
    accountType: 'reviewer',
    perspective: 'A',
  },
  {
    id: 'usr_rev_nova',
    username: 'nova',
    displayName: 'Reviewer Nova',
    bio: 'Desk reviewer. Perspective A is a role tag for independent review, not a political identity.',
    joinedAt: '2025-09-04T09:00:00.000Z',
    accountType: 'reviewer',
    perspective: 'A',
  },
  {
    id: 'usr_rev_river',
    username: 'river',
    displayName: 'Reviewer River',
    bio: 'Desk reviewer. Perspective A is a role tag for independent review, not a political identity.',
    joinedAt: '2025-09-08T09:00:00.000Z',
    accountType: 'reviewer',
    perspective: 'A',
  },
  {
    id: 'usr_rev_echo',
    username: 'echo',
    displayName: 'Reviewer Echo',
    bio: 'Desk reviewer. Perspective B is a role tag for independent review, not a political identity.',
    joinedAt: '2025-09-02T09:00:00.000Z',
    accountType: 'reviewer',
    perspective: 'B',
  },
  {
    id: 'usr_rev_orion',
    username: 'orion',
    displayName: 'Reviewer Orion',
    bio: 'Desk reviewer. Perspective B is a role tag for independent review, not a political identity.',
    joinedAt: '2025-09-06T09:00:00.000Z',
    accountType: 'reviewer',
    perspective: 'B',
  },
  {
    id: 'usr_rev_sage',
    username: 'sage',
    displayName: 'Reviewer Sage',
    bio: 'Desk reviewer. Perspective B is a role tag for independent review, not a political identity.',
    joinedAt: '2025-09-10T09:00:00.000Z',
    accountType: 'reviewer',
    perspective: 'B',
  },
  {
    id: 'usr_truthlens_ai',
    username: 'truthlensai',
    displayName: 'NO CAP AI',
    bio: 'Discovers rumours when multiple independent guests check the same claim. Demo system account — not a person.',
    joinedAt: '2025-09-01T00:00:00.000Z',
    accountType: 'demo',
  },
  {
    id: 'usr_guest_k92d',
    username: 'guest_k92d',
    displayName: 'Guest_K92D',
    bio: 'Anonymous guest identity. Demo.',
    joinedAt: '2026-09-18T10:00:00.000Z',
    accountType: 'member',
  },
  {
    id: 'usr_guest_a81c',
    username: 'guest_a81c',
    displayName: 'Guest_A81C',
    bio: 'Anonymous guest identity. Demo.',
    joinedAt: '2026-09-18T10:05:00.000Z',
    accountType: 'member',
  },
  {
    id: 'usr_guest_m4q1',
    username: 'guest_m4q1',
    displayName: 'Guest_M4Q1',
    bio: 'Anonymous guest identity. Demo.',
    joinedAt: '2026-09-18T10:10:00.000Z',
    accountType: 'member',
  },
]

export const SEED_REVIEWERS = SEED_USERS.filter((item) => item.perspective)

export const DEFAULT_DESK_REVIEWER_ID = 'usr_rev_atlas'

export function perspectiveOf(user: UserProfile | null | undefined): Perspective | null {
  return user?.perspective ?? null
}

export const CLAIM_SOCIAL: Record<string, { authorId: string; uploadType: UploadType }> = {
  clm_001: { authorId: 'usr_truthseeker', uploadType: 'user' },
  clm_002: { authorId: 'usr_campuswatch', uploadType: 'user' },
  clm_003: { authorId: 'usr_dailybuzz', uploadType: 'user' },
  clm_004: { authorId: 'usr_factfinder', uploadType: 'user' },
  clm_005: { authorId: 'usr_rumourtracker', uploadType: 'ai' },
  clm_006: { authorId: 'usr_campuswatch', uploadType: 'user' },
  clm_007: { authorId: 'usr_dailybuzz', uploadType: 'ai' },
  clm_008: { authorId: 'usr_rumourtracker', uploadType: 'user' },
  clm_009: { authorId: 'usr_campuswatch', uploadType: 'user' },
  clm_010: { authorId: 'usr_dailybuzz', uploadType: 'user' },
  clm_011: { authorId: 'usr_factfinder', uploadType: 'ai' },
  clm_012: { authorId: 'usr_factfinder', uploadType: 'user' },
  clm_013: { authorId: 'usr_truthseeker', uploadType: 'user' },
  clm_014: { authorId: 'usr_campuswatch', uploadType: 'user' },
  clm_015: { authorId: 'usr_rumourtracker', uploadType: 'ai' },
  clm_016: { authorId: 'usr_truthseeker', uploadType: 'user' },
  clm_017: { authorId: 'usr_dailybuzz', uploadType: 'user' },
  clm_018: { authorId: 'usr_truthlens_ai', uploadType: 'ai' },
}

export const REVIEWER_USER: Record<string, string> = {
  rev_newsroom_01: 'usr_factfinder',
  rev_newsroom_02: 'usr_campuswatch',
  rev_newsroom_03: 'usr_rumourtracker',
  rev_session: 'usr_truthseeker',
}

export function makeAudienceUsers(count = 18): UserProfile[] {
  return Array.from({ length: count }, (_, index) => {
    const num = String(index + 1).padStart(2, '0')
    return {
      id: `usr_aud_${num}`,
      username: `observer${num}`,
      displayName: `Observer ${num}`,
      bio: 'Fictional demo audience account used only for seeded participation.',
      joinedAt: '2026-04-01T00:00:00.000Z',
      accountType: 'demo' as const,
    }
  })
}
