import { Link } from 'react-router-dom'
import type { CourtroomSession } from '../../types'

export function CourtroomSummary({
  claimId,
  session,
}: {
  claimId: string
  session: CourtroomSession | null
}) {
  return (
    <div>
      <p className="label-kicker">AI courtroom</p>
      {session ? (
        <>
          <p className="mt-1 text-xs text-ink">
            Prosecutor: {session.prosecutor.argument.length} concern
            {session.prosecutor.argument.length === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-ink">
            Defender: {session.defender.argument.length} counterpoint
            {session.defender.argument.length === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">{session.judge.leaning}</p>
          <p className="text-xs text-mute">
            Evidence gaps: {session.judge.evidenceGaps.length}
          </p>
          <p className="mt-1 text-[11px] text-faint">AI ruling is advisory.</p>
        </>
      ) : (
        <p className="mt-1 text-xs text-faint">No hearing on record yet.</p>
      )}
      <Link to={`/courtroom/${claimId}`} className="mt-2 inline-block text-xs text-cyan hover:underline">
        {session ? 'Enter courtroom' : 'Start courtroom'}
      </Link>
    </div>
  )
}
