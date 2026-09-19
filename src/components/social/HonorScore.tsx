import { useState } from 'react'
import type { HonorBreakdown } from '../../types'

const ROWS: Array<{ key: keyof Omit<HonorBreakdown, 'total'>; label: string }> = [
  { key: 'verificationContributions', label: 'Verification contributions' },
  { key: 'evidenceContributions', label: 'Evidence contributions' },
  { key: 'helpfulReports', label: 'Helpful reports' },
  { key: 'constructiveParticipation', label: 'Discussion contributions' },
]

export function HonorScore({
  breakdown,
  lines = [],
}: {
  breakdown: HonorBreakdown
  lines?: string[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card p-4">
      <p className="label-kicker">Honor score</p>
      <p className="mt-1 font-mono text-3xl font-semibold text-cyan">{breakdown.total}</p>
      <p className="mt-1 text-xs text-ink">Earned through constructive participation.</p>
      <p className="mt-1 text-[11px] text-faint">
        A contribution metric — not truthfulness, political reliability, or a verdict engine.
      </p>
      <dl className="mt-4 flex flex-col gap-2">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-mute">{row.label}</dt>
            <dd className="font-mono text-ink">+{breakdown[row.key]}</dd>
          </div>
        ))}
      </dl>
      {lines.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {lines.map((line) => (
            <li key={line} className="text-xs text-cyan">
              {line}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="mt-3 text-[11px] text-cyan underline-offset-2 hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Hide Honor Score explanation' : 'How Honor Score works'}
      </button>
      {open && (
        <p className="mt-2 text-xs leading-relaxed text-mute">
          Points come from stored verification notes, evidence added for human review, helpful
          comments, and constructive discussion. Choosing Agree or Disagree does not raise the
          score by itself. Honor Score never decides a claim verdict and never labels a person as
          truthful or misleading.
        </p>
      )}
    </div>
  )
}
