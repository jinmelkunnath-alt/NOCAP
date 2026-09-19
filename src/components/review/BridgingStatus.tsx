import { Circle, CircleCheck } from 'lucide-react'
import type { Claim, Review } from '../../types'
import { verificationPath } from '../../utils/verificationPath'
import { cn } from '../../utils/cn'

export function BridgingStatus({ claim, reviews }: { claim: Claim; reviews: Review[] }) {
  const path = verificationPath(claim, [claim], reviews)
  const aDone = path.perspectiveA !== 'pending'
  const bDone = path.perspectiveB !== 'pending'
  const conflict = path.consensusState === 'conflict'
  const reached = path.consensusState === 'reached' || claim.verdict !== 'Unverified'

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3',
        conflict ? 'border-red/30 bg-red-dim' : 'border-cyan/30 bg-cyan-dim',
      )}
    >
      <p className="label-kicker">{conflict ? 'Consensus not reached' : 'Bridging verification'}</p>
      <p className="mt-1 text-xs font-medium text-ink">
        {claim.riskLevel} risk · novel claim · {claim.riskScore} / 100
      </p>
      {conflict && (
        <p className="mt-2 text-sm text-red" role="status">
          Perspectives disagree. The public status stays Unverified. NO CAP does not pick a winner.
        </p>
      )}
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <PerspectiveCard
          label="Perspective A"
          value={path.perspectiveA ?? 'pending'}
          done={aDone}
        />
        <PerspectiveCard
          label="Perspective B"
          value={path.perspectiveB ?? 'pending'}
          done={bDone}
        />
      </dl>
      <p className="mt-3 font-mono text-xs text-ink">
        {path.completed} / {path.required} required perspectives
      </p>
      <p className="mt-1 text-[11px] text-mute">
        {reached && !conflict
          ? 'Consensus reached'
          : conflict
            ? 'Request additional review'
            : aDone || bDone
              ? 'Awaiting second perspective'
              : 'Both independent perspectives required'}
      </p>
      <p className="mt-2 text-[10px] text-faint">
        A / B are reviewer-role tags for independent review. They are not political identities.
      </p>
    </div>
  )
}

function PerspectiveCard({
  label,
  value,
  done,
}: {
  label: string
  value: string
  done: boolean
}) {
  return (
    <div className="rounded-xl bg-panel/80 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink">
        {done ? (
          <CircleCheck className="h-4 w-4 text-cyan" aria-hidden="true" />
        ) : (
          <Circle className="h-4 w-4 text-faint" aria-hidden="true" />
        )}
        {done ? `Approved · ${value}` : 'Pending'}
      </p>
    </div>
  )
}
