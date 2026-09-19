import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { HonorScore } from '../components/social/HonorScore'
import { RumourPostCard } from '../components/social/RumourPostCard'
import { Avatar } from '../components/social/Avatar'
import { FollowButton } from '../components/social/FollowButton'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { REVIEWER_USER } from '../data/users'
import { useSocial } from '../context/SocialProvider'
import { useClaims } from '../hooks/useClaims'
import { honorService } from '../services/honorService'
import { formatDate } from '../utils/format'

export function ProfilePage() {
  const { username } = useParams()
  const { claims, loading, error } = useClaims()
  const social = useSocial()
  const [picked, setPicked] = useState<string | null>(null)
  const user = username ? social.users.find((item) => item.username === username) : undefined

  const posts = useMemo(
    () => claims.filter((item) => item.authorId === user?.id),
    [claims, user?.id],
  )
  const byId = useMemo(() => new Map(claims.map((item) => [item.id, item])), [claims])

  if (loading) return <LoadingState label="Loading profile" />
  if (error) return <ErrorState message={error} />
  if (!user) {
    return (
      <div>
        <ErrorState
          title="Profile not found"
          message={`No demo user named @${username ?? ''}.`}
          action={
            <Button to="/" variant="secondary" size="sm">
              Back home
            </Button>
          }
        />
      </div>
    )
  }

  const honor = honorService.honorForUser(user, claims, social.reviews)
  const earned = honorService.achievementsEarned(user, claims, social.reviews)
  const contributions = honorService.contributionLines(user, claims, social.reviews)
  const comments = social.comments.filter((item) => item.authorId === user.id)
  const votes = social.votes.filter((item) => item.userId === user.id)
  const verifications = social.reviews.filter((item) => {
    const mapped = REVIEWER_USER[item.reviewerId] ?? item.reviewerId
    return mapped === user.id
  }).length
  const followers = social.follows.filter((item) => item.followingId === user.id).length
  const following = social.follows.filter((item) => item.followerId === user.id).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile Header */}
      <header className="rounded-[22px] bg-white border border-[#EAEAEA] p-6 shadow-xs">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar user={user} size="lg" linked={false} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#111111]">{user.displayName}</h1>
            <p className="text-xs font-mono text-[#667085]">@{user.username}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#111111]">{user.bio}</p>
            <p className="mt-2 text-[11px] text-[#9CA3AF]">Joined {formatDate(user.joinedAt)}</p>
          </div>
          <FollowButton
            userId={user.id}
            following={social.isFollowing(user.id)}
            isSelf={user.id === social.currentUser.id}
          />
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-[#F0F0F0] pt-4 sm:grid-cols-4">
          <Stat label="Claims" value={posts.length} />
          <Stat label="Contributions" value={comments.length + verifications} />
          <Stat label="Followers" value={followers} />
          <Stat label="Following" value={following} />
        </dl>
        {user.perspective && (
          <p className="mt-4 text-xs text-[#667085]">
            Desk reviewer &bull; Perspective {user.perspective} (independent review role, not a political
            identity) &bull; {verifications} claims reviewed
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <HonorScore breakdown={honor} lines={contributions} />
        <div className="rounded-[20px] bg-white border border-[#EAEAEA] p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">Activity</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-xs text-[#111111]">
            <li className="flex items-center justify-between">
              <span>Community votes</span>
              <span className="font-mono font-bold text-[#EF3340]">{votes.length}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Comments</span>
              <span className="font-mono font-bold text-[#EF3340]">{comments.length}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Verification notes</span>
              <span className="font-mono font-bold text-[#EF3340]">{verifications}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Achievements */}
      <section className="rounded-[22px] bg-white border border-[#EAEAEA] p-6 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">Achievements</p>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Earned badges based on contribution quality and verification activity.
        </p>
        {earned.length === 0 ? (
          <p className="mt-3 text-xs text-[#9CA3AF]">No achievements earned yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {earned.map((item) => {
              const open = picked === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-[#EF3340]/20 bg-[#FDE7E9]/30 px-4 py-3 text-left transition-colors hover:bg-[#FDE7E9]/60"
                    onClick={() => setPicked(open ? null : item.id)}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-[#EF3340]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-[#667085]">{item.description}</p>
                    {open && (
                      <p className="mt-2 text-xs text-[#111111] font-medium border-t border-[#EF3340]/20 pt-2">
                        Requirement: {item.description}
                        {item.earnedAt ? (
                          <>
                            <br />
                            Earned {formatDate(item.earnedAt)}
                          </>
                        ) : null}
                      </p>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Posts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111111]">Posts by {user.displayName}</h2>
          <span className="text-xs text-[#667085]">
            {posts.length} {posts.length === 1 ? 'claim' : 'claims'}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <EmptyState
              title="No posts yet."
              description="This profile has not submitted a claim."
            />
          ) : (
            posts.map((claim) => (
              <RumourPostCard
                key={claim.id}
                claim={claim}
                author={user}
                relatedClaim={claim.matchedClaimId ? (byId.get(claim.matchedClaimId) ?? null) : null}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-bold text-[#111111]">{value}</dd>
    </div>
  )
}
