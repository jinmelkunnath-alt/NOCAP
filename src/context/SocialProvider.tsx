import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { sessionService } from '../services/sessionService'
import { socialService } from '../services/socialService'
import { storageService } from '../services/storageService'
import { subscribeClaimsChanged, subscribeSocialChanged } from '../services/dataEvents'
import type {
  Bookmark,
  CommentRecord,
  CommunityConsensus,
  EngagementEvent,
  EngagementMetrics,
  Follow,
  Review,
  ShareRecord,
  UserProfile,
  Vote,
} from '../types'

interface SocialBundle {
  users: UserProfile[]
  votes: Vote[]
  comments: CommentRecord[]
  follows: Follow[]
  bookmarks: Bookmark[]
  shares: ShareRecord[]
  engagement: EngagementEvent[]
  reviews: Review[]
  searches: string[]
  currentUser: UserProfile
}

interface SocialContextValue extends SocialBundle {
  userById: Map<string, UserProfile>
  followingIds: Set<string>
  consensusFor: (claimId: string) => CommunityConsensus
  voteFor: (claimId: string) => Vote | null
  commentsFor: (claimId: string) => CommentRecord[]
  metricsFor: (claimId: string) => EngagementMetrics
  isSaved: (claimId: string) => boolean
  isFollowing: (userId: string) => boolean
}

const SocialContext = createContext<SocialContextValue | null>(null)

function loadBundle(): SocialBundle {
  return {
    users: socialService.getUsers(),
    votes: socialService.getVotes(),
    comments: socialService.getComments(),
    follows: socialService.getFollows(),
    bookmarks: socialService.getBookmarks(),
    shares: socialService.getShares(),
    engagement: socialService.getEngagement(),
    reviews: storageService.getStoredReviews(),
    searches: socialService.getRecentSearches(),
    currentUser: sessionService.getCurrentUser(),
  }
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState(loadBundle)

  useEffect(() => {
    const refresh = () => setBundle(loadBundle())
    const offSocial = subscribeSocialChanged(refresh)
    const offClaims = subscribeClaimsChanged(refresh)
    return () => {
      offSocial()
      offClaims()
    }
  }, [])

  const value = useMemo<SocialContextValue>(() => {
    const userById = new Map(bundle.users.map((item) => [item.id, item]))
    const followingIds = new Set(
      bundle.follows
        .filter((item) => item.followerId === bundle.currentUser.id)
        .map((item) => item.followingId),
    )

    function consensusFor(claimId: string): CommunityConsensus {
      const mine = bundle.votes.filter((item) => item.claimId === claimId)
      const agree = mine.filter((item) => item.type === 'agree').length
      const disagree = mine.filter((item) => item.type === 'disagree').length
      const unsure = mine.filter((item) => item.type === 'unsure').length
      const total = mine.length
      return {
        claimId,
        agree,
        disagree,
        unsure,
        total,
        consensusPercent: total === 0 ? 0 : Math.round((Math.max(agree, disagree, unsure) / total) * 100),
        demo: mine.length > 0 && mine.every((item) => item.id.startsWith('vote_demo_')),
      }
    }

    function metricsFor(claimId: string): EngagementMetrics {
      return {
        votes: bundle.votes.filter((item) => item.claimId === claimId).length,
        comments: bundle.comments.filter((item) => item.claimId === claimId).length,
        shares: bundle.shares.filter((item) => item.claimId === claimId).length,
        saves: bundle.bookmarks.filter((item) => item.userId && item.claimId === claimId).length,
      }
    }

    return {
      ...bundle,
      userById,
      followingIds,
      consensusFor,
      voteFor: (claimId) =>
        bundle.votes.find(
          (item) => item.claimId === claimId && item.userId === bundle.currentUser.id,
        ) ?? null,
      commentsFor: (claimId) => bundle.comments.filter((item) => item.claimId === claimId),
      metricsFor,
      isSaved: (claimId) =>
        bundle.bookmarks.some(
          (item) => item.claimId === claimId && item.userId === bundle.currentUser.id,
        ),
      isFollowing: (userId) => followingIds.has(userId),
    }
  }, [bundle])

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial(): SocialContextValue {
  const value = useContext(SocialContext)
  if (!value) {
    throw new Error('useSocial must be used inside SocialProvider.')
  }
  return value
}
