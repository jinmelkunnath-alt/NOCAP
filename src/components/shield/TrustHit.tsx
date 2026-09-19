import { Link } from 'react-router-dom'
import type { Claim, CommunityConsensus } from '../../types'
import { StatusBadge } from '../badges/StatusBadge'
import { RiskBadge } from '../badges/RiskBadge'

export function TrustHit({
  claim,
  consensus,
  comments,
  interactions,
}: {
  claim: Claim
  consensus: CommunityConsensus
  comments?: number
  interactions?: number
}) {
  return (
    <Link to={`/claim/${claim.id}`} className="block rounded-xl px-2 py-1 hover:bg-elevated">
      <p className="line-clamp-2 text-xs text-ink">{claim.text}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <StatusBadge verdict={claim.verdict} />
        <RiskBadge level={claim.riskLevel} score={claim.riskScore} />
      </div>
      <p className="mt-1 text-[10px] text-faint">
        {typeof interactions === 'number'
          ? `+${interactions} interactions · attention only`
          : `${consensus.total} votes${typeof comments === 'number' ? ` · ${comments} comments` : ''}`}
      </p>
    </Link>
  )
}
