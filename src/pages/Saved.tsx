import { useMemo } from 'react'
import { RumourPostCard } from '../components/social/RumourPostCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { useSocial } from '../context/SocialProvider'
import { useClaims } from '../hooks/useClaims'

export function SavedPage() {
  const { claims, loading, error } = useClaims()
  const social = useSocial()
  const savedIds = useMemo(
    () => new Set(social.bookmarks.filter((item) => item.userId === social.currentUser.id).map((item) => item.claimId)),
    [social.bookmarks, social.currentUser.id],
  )
  const saved = claims.filter((item) => savedIds.has(item.id))
  const byId = useMemo(() => new Map(claims.map((item) => [item.id, item])), [claims])

  if (loading) return <LoadingState label="Loading saved posts" />
  if (error) return <ErrorState message={error} />

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <p className="label-kicker">Library</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Saved</h1>
        <p className="mt-1 text-sm text-mute">Bookmarks for @{social.currentUser.username}. Claims are not duplicated.</p>
      </header>
      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet."
          description="Save a rumour from the feed to keep it here."
          action={
            <Button to="/" size="sm" variant="secondary">
              Open feed
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {saved.map((claim) => (
            <RumourPostCard
              key={claim.id}
              claim={claim}
              author={claim.authorId ? social.userById.get(claim.authorId) : undefined}
              relatedClaim={claim.matchedClaimId ? (byId.get(claim.matchedClaimId) ?? null) : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
