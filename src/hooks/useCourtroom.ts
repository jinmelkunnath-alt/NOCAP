import { useEffect, useMemo, useState } from 'react'
import { courtroomService } from '../services/courtroomService'
import { subscribeSocialChanged } from '../services/dataEvents'
import type { ClaimPoll, CourtEvidence, CourtroomSession, PollVote } from '../types'

export function useCourtroom(claimId: string | undefined) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    return subscribeSocialChanged(() => setTick((value) => value + 1))
  }, [])

  return useMemo(() => {
    if (!claimId) {
      return {
        sessions: [] as CourtroomSession[],
        latest: null as CourtroomSession | null,
        board: [] as CourtEvidence[],
        userEvidence: [] as CourtEvidence[],
        poll: null as ClaimPoll | null,
        pollVotes: [] as PollVote[],
        myVote: null as PollVote | null,
      }
    }
    const sessions = courtroomService.getSessionsForClaim(claimId)
    const poll = courtroomService.getPoll(claimId)
    return {
      sessions,
      latest: sessions[sessions.length - 1] ?? null,
      board: courtroomService.boardForClaim(claimId),
      userEvidence: courtroomService.userEvidenceFor(claimId),
      poll,
      pollVotes: poll ? courtroomService.pollVotes(poll.id) : [],
      myVote: poll ? courtroomService.myPollVote(poll.id) : null,
    }
  }, [claimId, tick])
}

export function useLatestHearings() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    return subscribeSocialChanged(() => setTick((value) => value + 1))
  }, [])
  return useMemo(() => {
    void tick
    return courtroomService.latestMap()
  }, [tick])
}
