/**
 * NO CAP Community Poll Service
 * Manages standard 3-option community sentiment polls: Real / Fake / Not Sure.
 * Enforces 1 vote per unique Guest ID.
 * Persists votes in localStorage and emits real-time social update events.
 * Community opinion is strictly advisory and NEVER determines official truth.
 */

import { sessionService } from './sessionService'
import { emitSocialChanged } from './dataEvents'
import { createId } from '../utils/format'

export type CommunityVoteOption = 'Real' | 'Fake' | 'Not Sure'

export interface CommunityPollVote {
  id: string
  claimId: string
  userId: string
  option: CommunityVoteOption
  createdAt: string
}

export interface CommunityPollStats {
  claimId: string
  totalVotes: number
  counts: {
    real: number
    fake: number
    notSure: number
  }
  percentages: {
    real: number
    fake: number
    notSure: number
  }
  myVote: CommunityVoteOption | null
}

const STORAGE_KEY = 'truthlens_community_polls_v2'

function readVotes(): CommunityPollVote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeVotes(votes: CommunityPollVote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
  } catch {
    // ignore quota error
  }
}

export const communityPollService = {
  getPollStats(claimId: string): CommunityPollStats {
    if (!claimId) {
      return {
        claimId: '',
        totalVotes: 0,
        counts: { real: 0, fake: 0, notSure: 0 },
        percentages: { real: 0, fake: 0, notSure: 0 },
        myVote: null,
      }
    }

    const allVotes = readVotes()
    const votesForClaim = allVotes.filter((v) => v.claimId === claimId)
    const currentUserId = sessionService.getCurrentUserId()

    let real = 0
    let fake = 0
    let notSure = 0
    let myVote: CommunityVoteOption | null = null

    for (const v of votesForClaim) {
      if (v.option === 'Real') real++
      else if (v.option === 'Fake') fake++
      else if (v.option === 'Not Sure') notSure++

      if (v.userId === currentUserId) {
        myVote = v.option
      }
    }

    const totalVotes = real + fake + notSure
    const percentages = {
      real: totalVotes > 0 ? Math.round((real / totalVotes) * 100) : 0,
      fake: totalVotes > 0 ? Math.round((fake / totalVotes) * 100) : 0,
      notSure: totalVotes > 0 ? Math.round((notSure / totalVotes) * 100) : 0,
    }

    // Adjust rounding edge cases so percentages sum to 100% when total > 0
    if (totalVotes > 0 && percentages.real + percentages.fake + percentages.notSure !== 100) {
      const diff = 100 - (percentages.real + percentages.fake + percentages.notSure)
      if (percentages.real >= percentages.fake && percentages.real >= percentages.notSure) {
        percentages.real += diff
      } else if (percentages.fake >= percentages.notSure) {
        percentages.fake += diff
      } else {
        percentages.notSure += diff
      }
    }

    return {
      claimId,
      totalVotes,
      counts: { real, fake, notSure },
      percentages,
      myVote,
    }
  },

  castVote(claimId: string, option: CommunityVoteOption): CommunityPollStats {
    if (!claimId) throw new Error('Claim ID is required to vote.')
    const currentUserId = sessionService.getCurrentUserId()
    const now = new Date().toISOString()
    const allVotes = readVotes()

    const existingIndex = allVotes.findIndex(
      (v) => v.claimId === claimId && v.userId === currentUserId,
    )

    if (existingIndex >= 0) {
      // Update existing vote
      allVotes[existingIndex] = {
        ...allVotes[existingIndex],
        option,
        createdAt: now,
      }
    } else {
      // Create new vote
      allVotes.push({
        id: createId('cpv'),
        claimId,
        userId: currentUserId,
        option,
        createdAt: now,
      })
    }

    writeVotes(allVotes)
    emitSocialChanged()
    return this.getPollStats(claimId)
  },
}
