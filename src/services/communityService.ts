import type { CommunityConsensus, VoteType } from '../types'
import { socialService } from './socialService'

export const communityService = {
  getConsensus(claimId: string): Promise<CommunityConsensus | null> {
    const consensus = socialService.getConsensus(claimId)
    return Promise.resolve(consensus.total === 0 ? null : consensus)
  },

  getAllConsensus(): Promise<CommunityConsensus[]> {
    return Promise.resolve(socialService.getAllConsensus())
  },

  getTotalVotes(): Promise<number> {
    return Promise.resolve(socialService.getTotalVotes())
  },

  recordVote(input: { claimId: string; choice: VoteType }): Promise<CommunityConsensus> {
    socialService.castVote(input.claimId, input.choice)
    return Promise.resolve(socialService.getConsensus(input.claimId))
  },

  empty(claimId: string): CommunityConsensus {
    return {
      claimId,
      agree: 0,
      disagree: 0,
      unsure: 0,
      total: 0,
      consensusPercent: 0,
      demo: false,
    }
  },
}
