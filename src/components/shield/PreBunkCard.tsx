import type { Claim } from '../../types'
import { Button } from '../ui/Button'
import { RiskFlagBadge } from '../badges/RiskFlagBadge'

export function PreBunkCard({ claim }: { claim: Claim }) {
  if (claim.verdict !== 'Unverified' || claim.riskLevel !== 'High') return null
  return (
    <div className="rounded-2xl border border-amber/30 bg-amber-dim px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
        ⚠ Before you share
      </p>
      <p className="mt-1 text-xs text-ink">
        Claims with strong risk signals deserve verification before being passed along.
      </p>
      <p className="mt-2 font-mono text-[11px] text-ink">
        Risk: {claim.riskLevel.toUpperCase()} · {claim.riskScore}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {claim.flags.map((flag) => (
          <RiskFlagBadge key={flag} flag={flag} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button to={`/courtroom/${claim.id}`} size="sm">
          Enter courtroom
        </Button>
        <Button to={`/claim/${claim.id}`} size="sm" variant="secondary">
          View evidence
        </Button>
      </div>
    </div>
  )
}
