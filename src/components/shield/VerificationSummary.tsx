import { Link } from 'react-router-dom'
import type { VerificationSummary as Summary } from '../../types'
import { ResolutionPathVisual } from './ResolutionPathVisual'
import { StatusBadge } from '../badges/StatusBadge'
import { RiskBadge } from '../badges/RiskBadge'

export function VerificationSummary({ summary }: { summary: Summary }) {
  return (
    <div className="glass-card p-4">
      <p className="label-kicker">NO CAP verification</p>
      <div className="mt-2">
        <StatusBadge verdict={summary.verdict} />
      </div>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-faint">Resolution</dt>
          <dd className="mt-1">
            <ResolutionPathVisual path={summary.resolutionPath} />
          </dd>
        </div>
        <div>
          <dt className="text-faint">Reviewer perspectives</dt>
          <dd className="mt-1 font-mono text-ink">
            {summary.completed} / {summary.required || (summary.resolutionPath === 'FINGERPRINT_REUSE' ? 0 : 1)}
          </dd>
        </div>
        <div>
          <dt className="text-faint">Community</dt>
          <dd className="mt-1 text-ink">{summary.communityVotes} votes</dd>
        </div>
        <div>
          <dt className="text-faint">AI courtroom</dt>
          <dd className="mt-1 text-ink">{summary.courtroomLeaning ?? 'No hearing yet'}</dd>
        </div>
        <div>
          <dt className="text-faint">Risk</dt>
          <dd className="mt-1">
            <RiskBadge level={summary.riskLevel} score={summary.riskScore} />
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] text-faint">
        Community votes and AI leanings are not official verdicts.
      </p>
      <Link
        to={`/claim/${summary.claimId}`}
        className="mt-3 inline-block text-xs text-cyan hover:underline"
      >
        View full verification
      </Link>
    </div>
  )
}
