import { ExternalLink } from 'lucide-react'
import type { Claim } from '../../types'
import { formatTimestamp } from '../../utils/format'
import { CategoryBadge } from '../badges/CategoryBadge'
import { PlatformBadge } from '../badges/PlatformBadge'
import { StatusBadge } from '../badges/StatusBadge'

interface ClaimMetadataProps {
  claim: Claim
}

export function ClaimMetadata({ claim }: ClaimMetadataProps) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
      <div>
        <dt className="label-kicker">Status</dt>
        <dd className="mt-1">
          <StatusBadge verdict={claim.verdict} />
        </dd>
      </div>
      <div>
        <dt className="label-kicker">Platform</dt>
        <dd className="mt-1">
          <PlatformBadge platform={claim.platform} />
        </dd>
      </div>
      <div>
        <dt className="label-kicker">Category</dt>
        <dd className="mt-1">
          <CategoryBadge category={claim.category} />
        </dd>
      </div>
      <div>
        <dt className="label-kicker">Submitted</dt>
        <dd className="mt-1 text-ink">
          <time dateTime={claim.createdAt}>{formatTimestamp(claim.createdAt)}</time>
        </dd>
      </div>
      <div>
        <dt className="label-kicker">Updated</dt>
        <dd className="mt-1 text-ink">
          <time dateTime={claim.updatedAt}>{formatTimestamp(claim.updatedAt)}</time>
        </dd>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <dt className="label-kicker">Source URL</dt>
        <dd className="mt-1 truncate text-ink">
          {claim.sourceUrl ? (
            <a
              href={claim.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 text-cyan hover:underline"
            >
              <span className="truncate">{claim.sourceUrl}</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <span className="text-mute">None provided</span>
          )}
        </dd>
      </div>
    </dl>
  )
}
