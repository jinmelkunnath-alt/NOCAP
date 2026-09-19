import type {
  Claim,
  ClaimPoll,
  CourtEvidence,
  CourtroomSession,
  PollVote,
  Review,
} from '../types'
import { POLL_OPTIONS } from '../types'
import { createId } from '../utils/format'
import {
  aiCourtroomService,
  buildCourtroomContext,
} from './aiCourtroomService'
import { courtroomStorage } from './courtroomStorage'
import { communityAnalysisService } from './communityAnalysisService'
import { emitSocialChanged } from './dataEvents'
import { sessionService } from './sessionService'
import { socialService } from './socialService'
import { storageService } from './storageService'

function claimById(id: string): Claim | null {
  return storageService.getStoredClaims().find((item) => item.id === id) ?? null
}

function relatedFor(claim: Claim): Claim | null {
  if (!claim.matchedClaimId) return null
  return claimById(claim.matchedClaimId)
}

function reviewsFor(claimId: string): Review[] {
  return storageService
    .getStoredReviews()
    .filter((item) => item.claimId === claimId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function sessionsFor(claimId: string): CourtroomSession[] {
  return courtroomStorage
    .getSessions()
    .filter((item) => item.claimId === claimId)
    .sort((a, b) => a.hearingNumber - b.hearingNumber)
}

export function derivedEvidenceBoard(claim: Claim): CourtEvidence[] {
  const items: CourtEvidence[] = []
  const stamp = claim.createdAt

  if (claim.sourceUrl.trim()) {
    items.push({
      id: `ctx_${claim.id}_source`,
      claimId: claim.id,
      type: 'SOURCE',
      title: 'Submitted source URL',
      reference: claim.sourceUrl.trim(),
      explanation: 'Stored on the claim at intake. Not independently fetched in this demo.',
      status: 'context',
      url: claim.sourceUrl.trim(),
      createdAt: stamp,
    })
  }

  if (claim.matchedClaimId) {
    const related = relatedFor(claim)
    items.push({
      id: `ctx_${claim.id}_variant`,
      claimId: claim.id,
      type: 'CLAIM_VARIANT',
      title: claim.potentialDuplicate ? 'Close variant detected' : 'Potentially related claim',
      reference: `${claim.matchedClaimId}${typeof claim.similarityScore === 'number' ? ` · ${claim.similarityScore}%` : ''}`,
      explanation: related
        ? `Related record ${related.id} is stored as ${related.verdict}. Similarity is retrieval, not proof.`
        : `Matched id ${claim.matchedClaimId} is recorded on this claim.`,
      status: 'system',
      createdAt: stamp,
    })
  }

  const reviews = reviewsFor(claim.id)
  if (reviews.length > 0) {
    const latest = reviews[0]
    items.push({
      id: `ctx_${claim.id}_reviews`,
      claimId: claim.id,
      type: 'REVIEW_HISTORY',
      title: `${reviews.length} human review record(s)`,
      reference: latest ? `${latest.verdict} · ${latest.reviewerId}` : claim.id,
      explanation: 'Review ledger entries are human work. They are not AI findings.',
      status: 'reviewer-supplied',
      createdAt: latest?.createdAt ?? stamp,
    })
  }

  if (claim.reviewerNote.trim()) {
    items.push({
      id: `ctx_${claim.id}_note`,
      claimId: claim.id,
      type: 'REVIEWER_NOTE',
      title: 'Reviewer note on claim',
      reference: claim.reviewerId || 'reviewer',
      explanation: claim.reviewerNote,
      status: 'reviewer-supplied',
      createdAt: claim.updatedAt,
    })
  }

  const consensus = socialService.getConsensus(claim.id)
  items.push({
    id: `ctx_${claim.id}_community`,
    claimId: claim.id,
    type: 'COMMUNITY_CONTEXT',
    title: 'Community votes (context only)',
    reference: `${consensus.total} votes`,
    explanation:
      consensus.total === 0
        ? 'No community participation recorded yet. Votes are never an official verdict.'
        : `${consensus.agree} agree · ${consensus.disagree} disagree · ${consensus.unsure} unsure. Not a verdict.`,
    status: 'context',
    createdAt: stamp,
  })

  for (const source of claim.candidateSources ?? []) {
    items.push({
      id: source.id || `ctx_${claim.id}_cand_${source.url}`,
      claimId: claim.id,
      type: 'CANDIDATE_SOURCE',
      title: source.title || 'Candidate source',
      reference: source.url,
      explanation: source.description || 'Inspected by reviewers. Never auto-converted into a verdict.',
      status: 'needs-human-review',
      url: source.url,
      createdAt: stamp,
    })
  }

  for (const item of claim.evidence) {
    items.push({
      id: `ctx_${claim.id}_ev_${item.id}`,
      claimId: claim.id,
      type: 'SOURCE',
      title: item.title || 'Reviewer-supplied evidence',
      reference: item.url,
      explanation: item.description || 'Attached by a reviewer on the claim record.',
      status: 'reviewer-supplied',
      url: item.url,
      createdAt: stamp,
    })
  }

  return items
}

function boardFor(claim: Claim): CourtEvidence[] {
  const userItems = courtroomStorage.getEvidence().filter((item) => item.claimId === claim.id)
  return [...derivedEvidenceBoard(claim), ...userItems]
}

function runHearing(claim: Claim): CourtroomSession {
  const evidence = boardFor(claim)
  const consensus = socialService.getConsensus(claim.id)
  const ctx = buildCourtroomContext(claim, relatedFor(claim), reviewsFor(claim.id), evidence, consensus)
  const existing = sessionsFor(claim.id)
  const hearingNumber = existing.length + 1
  const session: CourtroomSession = {
    id: createId('crt'),
    claimId: claim.id,
    hearingNumber,
    createdAt: new Date().toISOString(),
    prosecutor: aiCourtroomService.generateProsecutorArgument(ctx),
    defender: aiCourtroomService.generateDefenderArgument(ctx),
    judge: aiCourtroomService.generateJudgeAssessment(ctx),
    evidenceIds: evidence.map((item) => item.id),
    communitySnapshot: {
      agree: consensus.agree,
      disagree: consensus.disagree,
      unsure: consensus.unsure,
      total: consensus.total,
    },
    demo: true,
  }
  courtroomStorage.saveSessions([...courtroomStorage.getSessions(), session])
  emitSocialChanged()
  return session
}

export const courtroomService = {
  getSessions(): CourtroomSession[] {
    return courtroomStorage.getSessions()
  },

  getSessionsForClaim(claimId: string): CourtroomSession[] {
    return sessionsFor(claimId)
  },

  latestFor(claimId: string): CourtroomSession | null {
    const list = sessionsFor(claimId)
    return list[list.length - 1] ?? null
  },

  getSession(id: string): CourtroomSession | null {
    return courtroomStorage.getSessions().find((item) => item.id === id) ?? null
  },

  boardForClaim(claimId: string): CourtEvidence[] {
    const claim = claimById(claimId)
    if (!claim) return courtroomStorage.getEvidence().filter((item) => item.claimId === claimId)
    return boardFor(claim)
  },

  userEvidenceFor(claimId: string): CourtEvidence[] {
    return courtroomStorage.getEvidence().filter((item) => item.claimId === claimId)
  },

  createHearing(claimId: string): CourtroomSession {
    const claim = claimById(claimId)
    if (!claim) throw new Error(`Claim ${claimId} was not found.`)
    return runHearing(claim)
  },

  ensureSession(claimId: string): CourtroomSession {
    const existing = this.latestFor(claimId)
    if (existing) return existing
    return this.createHearing(claimId)
  },

  prepareAiUploads(): void {
    const claims = storageService.getStoredClaims().filter((item) => item.uploadType === 'ai')
    let changed = false
    for (const claim of claims) {
      if (sessionsFor(claim.id).length === 0) {
        runHearing(claim)
        changed = true
      }
    }
    if (changed) emitSocialChanged()
  },

  addEvidence(input: {
    claimId: string
    title: string
    url?: string
    explanation: string
  }): CourtEvidence {
    const title = input.title.trim()
    const explanation = input.explanation.trim()
    if (title.length < 3) throw new Error('Give the evidence a short title.')
    if (explanation.length < 8) throw new Error('Explain why this item is relevant.')
    const url = input.url?.trim() ?? ''
    if (url && !/^https?:\/\//i.test(url)) {
      throw new Error('If you include a URL, it must start with http:// or https://.')
    }
    const item: CourtEvidence = {
      id: createId('cev'),
      claimId: input.claimId,
      type: 'USER_CONTRIBUTION',
      title,
      reference: url || title,
      explanation,
      status: 'needs-human-review',
      url: url || undefined,
      authorId: sessionService.getCurrentUserId(),
      createdAt: new Date().toISOString(),
    }
    courtroomStorage.saveEvidence([...courtroomStorage.getEvidence(), item])
    emitSocialChanged()
    return item
  },

  getPoll(claimId: string): ClaimPoll | null {
    return courtroomStorage.getPolls().find((item) => item.claimId === claimId) ?? null
  },

  createPoll(claimId: string, question?: string): ClaimPoll {
    const existing = this.getPoll(claimId)
    if (existing) return existing
    const poll: ClaimPoll = {
      id: createId('pol'),
      claimId,
      question: (question ?? 'How would you describe this claim?').trim(),
      options: [...POLL_OPTIONS],
      createdAt: new Date().toISOString(),
      authorId: sessionService.getCurrentUserId(),
    }
    courtroomStorage.savePolls([...courtroomStorage.getPolls(), poll])
    emitSocialChanged()
    return poll
  },

  pollVotes(pollId: string): PollVote[] {
    return courtroomStorage.getPollVotes().filter((item) => item.pollId === pollId)
  },

  myPollVote(pollId: string): PollVote | null {
    const userId = sessionService.getCurrentUserId()
    return this.pollVotes(pollId).find((item) => item.userId === userId) ?? null
  },

  castPollVote(pollId: string, optionIndex: number): PollVote {
    const poll = courtroomStorage.getPolls().find((item) => item.id === pollId)
    if (!poll) throw new Error('Poll was not found.')
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new Error('That option is not on this poll.')
    }
    const userId = sessionService.getCurrentUserId()
    const now = new Date().toISOString()
    const votes = courtroomStorage.getPollVotes()
    const existing = votes.find((item) => item.pollId === pollId && item.userId === userId)
    let next: PollVote
    if (existing) {
      next = { ...existing, optionIndex, createdAt: now }
      courtroomStorage.savePollVotes(votes.map((item) => (item.id === existing.id ? next : item)))
    } else {
      next = { id: createId('pv'), pollId, userId, optionIndex, createdAt: now }
      courtroomStorage.savePollVotes([...votes, next])
    }
    emitSocialChanged()
    communityAnalysisService.maybeAnalyze(poll.claimId)
    return next
  },

  latestMap(): Map<string, CourtroomSession> {
    const map = new Map<string, CourtroomSession>()
    for (const session of courtroomStorage.getSessions()) {
      const current = map.get(session.claimId)
      if (!current || session.hearingNumber > current.hearingNumber) {
        map.set(session.claimId, session)
      }
    }
    return map
  },
}
