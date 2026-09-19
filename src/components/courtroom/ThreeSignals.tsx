import { Link } from 'react-router-dom'
import type { Claim, CommunityConsensus, CourtroomSession } from '../../types'
import { Card, CardBody, CardHeader } from '../ui/Card'

interface ThreeSignalsProps {
  claim: Claim
  session: CourtroomSession | null
  consensus: CommunityConsensus
}

export function ThreeSignals({ claim, session, consensus }: ThreeSignalsProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-ink">AI courtroom</h3>
        </CardHeader>
        <CardBody>
          <p className="text-[11px] text-faint">Advisory leaning only.</p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {session ? session.judge.leaning : 'No hearing yet'}
          </p>
          {session && (
            <p className="mt-2 text-xs text-mute">
              Assessment confidence {session.judge.assessmentConfidence}% — not P(true).
            </p>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-ink">Community</h3>
        </CardHeader>
        <CardBody>
          <p className="text-[11px] text-faint">What people think. Not the official verdict.</p>
          {consensus.total === 0 ? (
            <p className="mt-2 text-sm text-faint">No votes recorded.</p>
          ) : (
            <p className="mt-2 font-mono text-sm text-ink">
              {Math.round((consensus.agree / consensus.total) * 100)}% Agree ·{' '}
              {Math.round((consensus.disagree / consensus.total) * 100)}% Disagree ·{' '}
              {Math.round((consensus.unsure / consensus.total) * 100)}% Unsure
            </p>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-ink">NO CAP verification</h3>
        </CardHeader>
        <CardBody>
          <p className="text-[11px] text-faint">Accountable human / fingerprint status.</p>
          <p className="mt-2 text-sm font-semibold text-ink">{claim.verdict}</p>
          <Link to={`/claim/${claim.id}`} className="mt-2 inline-block text-xs text-cyan hover:underline">
            Open verification record
          </Link>
        </CardBody>
      </Card>
    </div>
  )
}
