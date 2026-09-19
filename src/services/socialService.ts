import type {
  Bookmark,
  CommentKind,
  CommentRecord,
  CommunityConsensus,
  EngagementEvent,
  EngagementMetrics,
  Follow,
  ShareRecord,
  UserProfile,
  Vote,
  VoteType,
} from '../types'
import { createId } from '../utils/format'
import { communityAnalysisService } from './communityAnalysisService'
import { emitSocialChanged } from './dataEvents'
import { sessionService } from './sessionService'
import { socialStorage } from './socialStorage'

function recordEngagement(claimId: string, userId: string, type: EngagementEvent['type']): void {
  const events = socialStorage.getEngagement()
  socialStorage.saveEngagement([
    {
      id: createId('eng'),
      claimId,
      userId,
      type,
      createdAt: new Date().toISOString(),
    },
    ...events,
  ])
}

function consensusFrom(claimId: string, votes: Vote[]): CommunityConsensus {
  const mine = votes.filter((item) => item.claimId === claimId)
  const agree = mine.filter((item) => item.type === 'agree').length
  const disagree = mine.filter((item) => item.type === 'disagree').length
  const unsure = mine.filter((item) => item.type === 'unsure').length
  const total = mine.length
  const consensusPercent = total === 0 ? 0 : Math.round((Math.max(agree, disagree, unsure) / total) * 100)
  const demo = mine.length > 0 && mine.every((item) => item.id.startsWith('vote_demo_'))
  return { claimId, agree, disagree, unsure, total, consensusPercent, demo }
}

export const socialService = {
  getUsers(): UserProfile[] {
    return socialStorage.getUsers()
  },

  getUserById(id: string): UserProfile | null {
    return socialStorage.getUsers().find((item) => item.id === id) ?? null
  },

  getUserByUsername(username: string): UserProfile | null {
    const needle = username.replace(/^@/, '').toLowerCase()
    return (
      socialStorage.getUsers().find((item) => item.username.toLowerCase() === needle) ?? null
    )
  },

  getVotes(): Vote[] {
    return socialStorage.getVotes()
  },

  getConsensus(claimId: string): CommunityConsensus {
    return consensusFrom(claimId, socialStorage.getVotes())
  },

  getAllConsensus(): CommunityConsensus[] {
    const votes = socialStorage.getVotes()
    const ids = [...new Set(votes.map((item) => item.claimId))]
    return ids.map((id) => consensusFrom(id, votes))
  },

  getTotalVotes(): number {
    return socialStorage.getVotes().length
  },

  getUserVote(claimId: string, userId = sessionService.getCurrentUserId()): Vote | null {
    return (
      socialStorage.getVotes().find((item) => item.claimId === claimId && item.userId === userId) ??
      null
    )
  },

  castVote(claimId: string, type: VoteType): Vote {
    const userId = sessionService.getCurrentUserId()
    const now = new Date().toISOString()
    const votes = socialStorage.getVotes()
    const existing = votes.find((item) => item.claimId === claimId && item.userId === userId)
    let next: Vote[]
    let saved: Vote
    if (existing && existing.type === type) {
      return existing
    }
    if (existing) {
      saved = { ...existing, type, createdAt: now }
      next = votes.map((item) => (item.id === existing.id ? saved : item))
    } else {
      saved = { id: createId('vote'), claimId, userId, type, createdAt: now }
      next = [saved, ...votes]
      recordEngagement(claimId, userId, 'vote')
    }
    socialStorage.saveVotes(next)
    emitSocialChanged()
    communityAnalysisService.maybeAnalyze(claimId)
    return saved
  },

  getComments(): CommentRecord[] {
    return socialStorage.getComments()
  },

  getCommentsForClaim(claimId: string): CommentRecord[] {
    return socialStorage.getComments().filter((item) => item.claimId === claimId)
  },

  addComment(input: {
    claimId: string
    text: string
    type?: CommentKind
    parentId?: string | null
  }): CommentRecord {
    const text = input.text.trim()
    if (text.length < 2) {
      throw new Error('Comment text is too short.')
    }
    const userId = sessionService.getCurrentUserId()
    const record: CommentRecord = {
      id: createId('cmt'),
      claimId: input.claimId,
      authorId: userId,
      parentId: input.parentId ?? null,
      type: input.type ?? 'GENERAL',
      text,
      createdAt: new Date().toISOString(),
      helpfulBy: [],
      reportedBy: [],
    }
    socialStorage.saveComments([record, ...socialStorage.getComments()])
    recordEngagement(input.claimId, userId, 'comment')
    emitSocialChanged()
    communityAnalysisService.maybeAnalyze(input.claimId)
    return record
  },

  toggleHelpful(commentId: string): CommentRecord {
    const userId = sessionService.getCurrentUserId()
    const comments = socialStorage.getComments()
    const current = comments.find((item) => item.id === commentId)
    if (!current) throw new Error('Comment was not found.')
    const has = current.helpfulBy.includes(userId)
    const helpfulBy = has
      ? current.helpfulBy.filter((id) => id !== userId)
      : [...current.helpfulBy, userId]
    const updated = { ...current, helpfulBy }
    socialStorage.saveComments(comments.map((item) => (item.id === commentId ? updated : item)))
    emitSocialChanged()
    return updated
  },

  reportComment(commentId: string): CommentRecord {
    const userId = sessionService.getCurrentUserId()
    const comments = socialStorage.getComments()
    const current = comments.find((item) => item.id === commentId)
    if (!current) throw new Error('Comment was not found.')
    if (current.reportedBy.includes(userId)) return current
    const updated = { ...current, reportedBy: [...current.reportedBy, userId] }
    socialStorage.saveComments(comments.map((item) => (item.id === commentId ? updated : item)))
    emitSocialChanged()
    return updated
  },

  getFollows(): Follow[] {
    return socialStorage.getFollows()
  },

  isFollowing(userId: string, followerId = sessionService.getCurrentUserId()): boolean {
    return socialStorage
      .getFollows()
      .some((item) => item.followerId === followerId && item.followingId === userId)
  },

  followerCount(userId: string): number {
    return socialStorage.getFollows().filter((item) => item.followingId === userId).length
  },

  followingCount(userId: string): number {
    return socialStorage.getFollows().filter((item) => item.followerId === userId).length
  },

  toggleFollow(userId: string): boolean {
    const followerId = sessionService.getCurrentUserId()
    if (followerId === userId) return false
    const follows = socialStorage.getFollows()
    const existing = follows.find(
      (item) => item.followerId === followerId && item.followingId === userId,
    )
    if (existing) {
      socialStorage.saveFollows(follows.filter((item) => item.id !== existing.id))
      emitSocialChanged()
      return false
    }
    socialStorage.saveFollows([
      {
        id: createId('fol'),
        followerId,
        followingId: userId,
        createdAt: new Date().toISOString(),
      },
      ...follows,
    ])
    emitSocialChanged()
    return true
  },

  getBookmarks(): Bookmark[] {
    return socialStorage.getBookmarks()
  },

  isSaved(claimId: string, userId = sessionService.getCurrentUserId()): boolean {
    return socialStorage.getBookmarks().some((item) => item.userId === userId && item.claimId === claimId)
  },

  savedClaimIds(userId = sessionService.getCurrentUserId()): string[] {
    return socialStorage
      .getBookmarks()
      .filter((item) => item.userId === userId)
      .map((item) => item.claimId)
  },

  toggleSave(claimId: string): boolean {
    const userId = sessionService.getCurrentUserId()
    const bookmarks = socialStorage.getBookmarks()
    const existing = bookmarks.find((item) => item.userId === userId && item.claimId === claimId)
    if (existing) {
      socialStorage.saveBookmarks(bookmarks.filter((item) => item.id !== existing.id))
      emitSocialChanged()
      return false
    }
    socialStorage.saveBookmarks([
      { id: createId('bmk'), userId, claimId, createdAt: new Date().toISOString() },
      ...bookmarks,
    ])
    recordEngagement(claimId, userId, 'save')
    emitSocialChanged()
    return true
  },

  getShares(): ShareRecord[] {
    return socialStorage.getShares()
  },

  recordShare(claimId: string): ShareRecord {
    const userId = sessionService.getCurrentUserId()
    const record: ShareRecord = {
      id: createId('shr'),
      userId,
      claimId,
      createdAt: new Date().toISOString(),
    }
    socialStorage.saveShares([record, ...socialStorage.getShares()])
    recordEngagement(claimId, userId, 'share')
    emitSocialChanged()
    return record
  },

  metricsFor(claimId: string): EngagementMetrics {
    return {
      votes: socialStorage.getVotes().filter((item) => item.claimId === claimId).length,
      comments: socialStorage.getComments().filter((item) => item.claimId === claimId).length,
      shares: socialStorage.getShares().filter((item) => item.claimId === claimId).length,
      saves: socialStorage.getBookmarks().filter((item) => item.claimId === claimId).length,
    }
  },

  getEngagement(): EngagementEvent[] {
    return socialStorage.getEngagement()
  },

  recordSubmit(claimId: string): void {
    recordEngagement(claimId, sessionService.getCurrentUserId(), 'submit')
    emitSocialChanged()
  },

  getRecentSearches(): string[] {
    return socialStorage.getSearches()
  },

  rememberSearch(query: string): void {
    const trimmed = query.trim()
    if (!trimmed) return
    const next = [trimmed, ...socialStorage.getSearches().filter((item) => item !== trimmed)].slice(0, 8)
    socialStorage.saveSearches(next)
    emitSocialChanged()
  },

  clearRecentSearches(): void {
    socialStorage.saveSearches([])
    emitSocialChanged()
  },
}
