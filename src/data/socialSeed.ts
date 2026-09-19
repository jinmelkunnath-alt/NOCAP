import type {
  Bookmark,
  CommentRecord,
  EngagementEvent,
  Follow,
  ShareRecord,
  UserProfile,
  Vote,
  VoteType,
} from '../types'
import { makeAudienceUsers, SEED_USERS } from './users'

const T0 = '2026-09-18T12:00:00.000Z'

function vote(
  id: string,
  claimId: string,
  userId: string,
  type: VoteType,
  createdAt: string,
): Vote {
  return { id, claimId, userId, type, createdAt }
}

function comment(partial: CommentRecord): CommentRecord {
  return partial
}

export function buildSocialSeed(): {
  users: UserProfile[]
  votes: Vote[]
  comments: CommentRecord[]
  follows: Follow[]
  bookmarks: Bookmark[]
  shares: ShareRecord[]
  engagement: EngagementEvent[]
} {
  const audience = makeAudienceUsers(18)
  const users = [...SEED_USERS, ...audience]
  const aud = audience.map((item) => item.id)

  const named = {
    ts: 'usr_truthseeker',
    cw: 'usr_campuswatch',
    db: 'usr_dailybuzz',
    ff: 'usr_factfinder',
    rt: 'usr_rumourtracker',
  }

  const votes: Vote[] = []
  let voteN = 1
  function addVotes(claimId: string, mix: VoteType[], from: number, createdAt: string) {
    mix.forEach((type, index) => {
      const userId = aud[(from + index) % aud.length]
      if (!userId) return
      votes.push(vote(`vote_demo_${String(voteN).padStart(3, '0')}`, claimId, userId, type, createdAt))
      voteN += 1
    })
  }

  addVotes('clm_008', [
    ...Array(10).fill('agree'),
    ...Array(3).fill('disagree'),
    ...Array(2).fill('unsure'),
  ] as VoteType[], 0, '2026-09-18T10:20:00.000Z')
  addVotes('clm_001', [
    ...Array(6).fill('agree'),
    ...Array(4).fill('disagree'),
    ...Array(2).fill('unsure'),
  ] as VoteType[], 2, '2026-09-18T09:10:00.000Z')
  addVotes('clm_003', [
    ...Array(2).fill('agree'),
    ...Array(8).fill('disagree'),
    ...Array(1).fill('unsure'),
  ] as VoteType[], 4, '2026-09-17T16:00:00.000Z')
  addVotes('clm_004', [
    ...Array(9).fill('agree'),
    ...Array(1).fill('disagree'),
    ...Array(1).fill('unsure'),
  ] as VoteType[], 1, '2026-09-17T11:00:00.000Z')
  addVotes('clm_007', [
    ...Array(1).fill('agree'),
    ...Array(7).fill('disagree'),
    ...Array(2).fill('unsure'),
  ] as VoteType[], 6, '2026-09-14T14:00:00.000Z')
  addVotes('clm_005', [
    ...Array(3).fill('agree'),
    ...Array(4).fill('disagree'),
    ...Array(3).fill('unsure'),
  ] as VoteType[], 3, '2026-09-16T18:00:00.000Z')
  addVotes('clm_011', [
    ...Array(1).fill('agree'),
    ...Array(6).fill('disagree'),
    ...Array(1).fill('unsure'),
  ] as VoteType[], 8, '2026-09-11T18:00:00.000Z')
  addVotes('clm_012', [
    ...Array(8).fill('agree'),
    ...Array(1).fill('unsure'),
  ] as VoteType[], 0, '2026-09-10T20:00:00.000Z')
  addVotes('clm_002', [
    ...Array(4).fill('agree'),
    ...Array(3).fill('disagree'),
    ...Array(2).fill('unsure'),
  ] as VoteType[], 5, '2026-09-18T07:30:00.000Z')
  addVotes('clm_009', [
    ...Array(2).fill('agree'),
    ...Array(3).fill('disagree'),
    ...Array(3).fill('unsure'),
  ] as VoteType[], 7, '2026-09-13T10:00:00.000Z')
  addVotes('clm_010', [
    ...Array(5).fill('agree'),
    ...Array(2).fill('disagree'),
    ...Array(1).fill('unsure'),
  ] as VoteType[], 9, '2026-09-17T23:00:00.000Z')
  addVotes('clm_013', [
    ...Array(3).fill('agree'),
    ...Array(2).fill('unsure'),
  ] as VoteType[], 11, '2026-09-19T06:10:00.000Z')
  addVotes('clm_014', [
    ...Array(4).fill('agree'),
    ...Array(2).fill('disagree'),
  ] as VoteType[], 12, '2026-09-19T07:40:00.000Z')
  addVotes('clm_015', [
    ...Array(3).fill('agree'),
    ...Array(3).fill('disagree'),
    ...Array(1).fill('unsure'),
  ] as VoteType[], 13, '2026-09-19T08:40:00.000Z')
  addVotes('clm_006', [
    ...Array(2).fill('agree'),
    ...Array(1).fill('unsure'),
  ] as VoteType[], 15, '2026-09-18T05:00:00.000Z')
  addVotes('clm_016', [
    ...Array(5).fill('agree'),
    ...Array(4).fill('disagree'),
    ...Array(2).fill('unsure'),
  ] as VoteType[], 1, '2026-09-19T09:30:00.000Z')
  addVotes('clm_017', [
    ...Array(1).fill('agree'),
    ...Array(5).fill('disagree'),
  ] as VoteType[], 10, '2026-09-19T09:50:00.000Z')
  addVotes('clm_018', [
    ...Array(4).fill('agree'),
    ...Array(5).fill('disagree'),
    ...Array(2).fill('unsure'),
  ] as VoteType[], 2, '2026-09-19T09:35:00.000Z')

  votes.push(
    vote('vote_demo_named_01', 'clm_008', named.ts, 'unsure', '2026-09-18T11:00:00.000Z'),
    vote('vote_demo_named_02', 'clm_004', named.ts, 'agree', '2026-09-17T12:00:00.000Z'),
    vote('vote_demo_named_03', 'clm_001', named.cw, 'disagree', '2026-09-18T09:40:00.000Z'),
    vote('vote_demo_named_04', 'clm_007', named.ff, 'disagree', '2026-09-14T13:00:00.000Z'),
    vote('vote_demo_named_05', 'clm_013', named.rt, 'agree', '2026-09-19T06:30:00.000Z'),
  )

  const comments: CommentRecord[] = [
    comment({
      id: 'cmt_001',
      claimId: 'clm_008',
      authorId: named.ts,
      parentId: null,
      type: 'QUESTION',
      text: 'Has anyone seen the original clip with a date stamp, or is this only the WhatsApp crop?',
      createdAt: '2026-09-18T10:40:00.000Z',
      helpfulBy: [named.cw, named.ff],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_002',
      claimId: 'clm_008',
      authorId: named.ff,
      parentId: 'cmt_001',
      type: 'EVIDENCE',
      text: 'No matching report on any verified entertainment desk. Treating this as an unsourced forward until a primary clip appears.',
      createdAt: '2026-09-18T11:05:00.000Z',
      helpfulBy: [named.ts],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_003',
      claimId: 'clm_001',
      authorId: named.cw,
      parentId: null,
      type: 'CORRECTION',
      text: 'Diabetes is not “cured in 48 hours” by lemon water. This is a recurring health hoax.',
      createdAt: '2026-09-18T08:50:00.000Z',
      helpfulBy: [named.ff, named.ts, named.rt],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_004',
      claimId: 'clm_004',
      authorId: named.rt,
      parentId: null,
      type: 'EVIDENCE',
      text: 'The linked WHO measles fact sheet matches the wording. This looks like a sourced public-health note, not a rumour.',
      createdAt: '2026-09-17T10:00:00.000Z',
      helpfulBy: [named.ff],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_005',
      claimId: 'clm_003',
      authorId: named.ff,
      parentId: null,
      type: 'CORRECTION',
      text: 'RBI does not issue “forward this to ten people” circulars. Classic balance-double hoax.',
      createdAt: '2026-09-17T14:40:00.000Z',
      helpfulBy: [named.cw, named.db],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_006',
      claimId: 'clm_003',
      authorId: named.db,
      parentId: 'cmt_005',
      type: 'GENERAL',
      text: 'Same text showed up on Instagram yesterday with a different crop.',
      createdAt: '2026-09-17T15:10:00.000Z',
      helpfulBy: [],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_007',
      claimId: 'clm_007',
      authorId: named.cw,
      parentId: null,
      type: 'EVIDENCE',
      text: 'WHO 5G health Q&A has no mechanism for towers “spreading infection.”',
      createdAt: '2026-09-14T12:40:00.000Z',
      helpfulBy: [named.ff],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_008',
      claimId: 'clm_013',
      authorId: named.db,
      parentId: null,
      type: 'QUESTION',
      text: 'Did anyone find a gazette notification, or is this only the Reddit title?',
      createdAt: '2026-09-19T06:00:00.000Z',
      helpfulBy: [named.ts],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_009',
      claimId: 'clm_014',
      authorId: named.rt,
      parentId: null,
      type: 'GENERAL',
      text: 'This is almost the same RBI forward that was already reviewed as false.',
      createdAt: '2026-09-19T07:30:00.000Z',
      helpfulBy: [named.ff],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_010',
      claimId: 'clm_002',
      authorId: named.ts,
      parentId: null,
      type: 'QUESTION',
      text: 'Which river, which booth, which night? The post names none of them.',
      createdAt: '2026-09-18T07:10:00.000Z',
      helpfulBy: [],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_011',
      claimId: 'clm_016',
      authorId: named.cw,
      parentId: null,
      type: 'QUESTION',
      text: 'Which campus, which scheme, which date? The forward names none of them.',
      createdAt: '2026-09-19T09:22:00.000Z',
      helpfulBy: [named.ts, named.ff],
      reportedBy: [],
    }),
    comment({
      id: 'cmt_012',
      claimId: 'clm_016',
      authorId: named.ff,
      parentId: 'cmt_011',
      type: 'EVIDENCE',
      text: 'No matching education-department notice is attached. High-risk novel claim — still Unverified until bridging review.',
      createdAt: '2026-09-19T09:28:00.000Z',
      helpfulBy: [named.cw],
      reportedBy: [],
    }),
  ]

  const follows: Follow[] = [
    { id: 'fol_001', followerId: named.ts, followingId: named.cw, createdAt: T0 },
    { id: 'fol_002', followerId: named.ts, followingId: named.ff, createdAt: T0 },
    { id: 'fol_003', followerId: named.ts, followingId: named.rt, createdAt: T0 },
    { id: 'fol_004', followerId: named.cw, followingId: named.ff, createdAt: T0 },
    { id: 'fol_005', followerId: named.db, followingId: named.rt, createdAt: T0 },
    { id: 'fol_006', followerId: named.db, followingId: named.ts, createdAt: T0 },
    { id: 'fol_007', followerId: named.rt, followingId: named.cw, createdAt: T0 },
  ]

  const bookmarks: Bookmark[] = [
    { id: 'bmk_001', userId: named.ts, claimId: 'clm_004', createdAt: T0 },
    { id: 'bmk_002', userId: named.ts, claimId: 'clm_012', createdAt: T0 },
    { id: 'bmk_003', userId: named.ff, claimId: 'clm_008', createdAt: T0 },
    { id: 'bmk_004', userId: named.cw, claimId: 'clm_001', createdAt: T0 },
  ]

  const shares: ShareRecord[] = [
    { id: 'shr_001', userId: named.cw, claimId: 'clm_008', createdAt: '2026-09-18T10:50:00.000Z' },
    { id: 'shr_002', userId: named.db, claimId: 'clm_008', createdAt: '2026-09-18T11:20:00.000Z' },
    { id: 'shr_003', userId: named.ts, claimId: 'clm_004', createdAt: '2026-09-17T12:10:00.000Z' },
    { id: 'shr_004', userId: named.rt, claimId: 'clm_001', createdAt: '2026-09-18T09:00:00.000Z' },
    { id: 'shr_005', userId: named.ff, claimId: 'clm_007', createdAt: '2026-09-14T13:20:00.000Z' },
    { id: 'shr_006', userId: named.db, claimId: 'clm_013', createdAt: '2026-09-19T06:20:00.000Z' },
    { id: 'shr_007', userId: named.cw, claimId: 'clm_014', createdAt: '2026-09-19T07:50:00.000Z' },
  ]

  const engagement: EngagementEvent[] = []
  let engN = 1
  function pushEvent(
    claimId: string,
    userId: string,
    type: EngagementEvent['type'],
    createdAt: string,
  ) {
    engagement.push({
      id: `eng_demo_${String(engN).padStart(3, '0')}`,
      claimId,
      userId,
      type,
      createdAt,
    })
    engN += 1
  }

  for (const item of votes) pushEvent(item.claimId, item.userId, 'vote', item.createdAt)
  for (const item of comments) pushEvent(item.claimId, item.authorId, 'comment', item.createdAt)
  for (const item of shares) pushEvent(item.claimId, item.userId, 'share', item.createdAt)
  for (const item of bookmarks) pushEvent(item.claimId, item.userId, 'save', item.createdAt)

  const hot = new Set(['clm_008', 'clm_001', 'clm_013', 'clm_014'])
  const now = Date.now()
  let minutes = 6
  const stamped = engagement.map((item) => {
    if (!hot.has(item.claimId)) return item
    minutes += 2
    return { ...item, createdAt: new Date(now - minutes * 60_000).toISOString() }
  })

  return { users, votes, comments, follows, bookmarks, shares, engagement: stamped }
}
