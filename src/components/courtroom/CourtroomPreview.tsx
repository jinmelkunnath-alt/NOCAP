import { Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CourtroomSession } from '../../types'

interface CourtroomPreviewProps {
  claimId: string
  session: CourtroomSession | null
}

export function CourtroomPreview({ claimId, session }: CourtroomPreviewProps) {
  return (
    <Link
      to={`/courtroom/${claimId}`}
      className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-cyan-dim/50 px-3 py-2 hover:bg-cyan-dim"
    >
      <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan">
          {session ? 'Courtroom preview' : 'Courtroom available'}
        </p>
        {session ? (
          <>
            <p className="mt-0.5 text-xs text-ink">
              Hearing #{session.hearingNumber} · {session.judge.leaning}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-mute">{session.judge.rationale}</p>
            <p className="mt-1 text-[10px] text-faint">Advisory only — not an official verdict.</p>
          </>
        ) : (
          <p className="mt-0.5 text-xs text-mute">
            Enter the NO CAP courtroom for an advisory hearing on stored evidence.
          </p>
        )}
      </div>
    </Link>
  )
}
