import { useMemo, type ReactNode } from 'react'
import type { Claim } from '../../types'
import { EmptyState } from '../ui/EmptyState'
import { ClaimCard } from './ClaimCard'

interface ClaimListProps {
  claims: Claim[]
  catalog?: Claim[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

export function ClaimList({
  claims,
  catalog,
  emptyTitle = 'No claims submitted yet.',
  emptyDescription = 'Submitted claims will appear here once they enter the feed.',
  emptyAction,
}: ClaimListProps) {
  const byId = useMemo(() => {
    const map = new Map<string, Claim>()
    for (const item of catalog ?? claims) map.set(item.id, item)
    return map
  }, [catalog, claims])

  if (claims.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {claims.map((claim) => (
        <ClaimCard
          key={claim.id}
          claim={claim}
          relatedClaim={claim.matchedClaimId ? byId.get(claim.matchedClaimId) ?? null : null}
        />
      ))}
    </div>
  )
}
