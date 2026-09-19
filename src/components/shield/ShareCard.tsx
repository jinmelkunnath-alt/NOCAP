import { useState } from 'react'
import type { Claim, VerificationSummary } from '../../types'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

const MARK: Record<Claim['verdict'], string> = {
  Unverified: '⚠ UNVERIFIED',
  'Verified True': '✓ VERIFIED TRUE',
  'Verified False': '✕ VERIFIED FALSE',
  Misleading: '! MISLEADING',
}

const TONE: Record<Claim['verdict'], string> = {
  Unverified: 'border-amber/40 bg-amber-dim text-amber',
  'Verified True': 'border-green/40 bg-green-dim text-green',
  'Verified False': 'border-red/40 bg-red-dim text-red',
  Misleading: 'border-orange/40 bg-orange-dim text-orange',
}

export function ShareCardVisual({
  claim,
  summary,
}: {
  claim: Claim
  summary: VerificationSummary
}) {
  return (
    <div className="court-silk float-up rounded-[1.75rem] border border-line bg-panel p-6 shadow-[0_16px_40px_rgb(15_23_42/0.08)]">
      <p className="font-mono text-[10px] tracking-[0.28em] text-[#111111]">NO <span className="text-[#EF3340]">CAP</span></p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-faint">Verification shield</p>
      <p className={cn('mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold', TONE[claim.verdict])}>
        {MARK[claim.verdict]}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink">“{claim.text}”</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-faint">Risk</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {claim.riskLevel.toUpperCase()} · {claim.riskScore}
          </dd>
        </div>
        <div>
          <dt className="text-faint">Resolution</dt>
          <dd className="mt-0.5 font-medium text-ink">{summary.resolutionPath.replaceAll('_', ' ')}</dd>
        </div>
      </dl>
      {claim.verdict === 'Unverified' ? (
        <p className="mt-4 text-xs text-amber">Under Active Review. Do not share as fact.</p>
      ) : (
        <p className="mt-4 text-xs text-mute">NO CAP verification completed.</p>
      )}
      <p className="mt-6 text-[11px] text-cyan">View evidence →</p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-faint">NO CAP</p>
    </div>
  )
}

export function ShareCardActions({
  text,
  onClose,
}: {
  text: string
  onClose: () => void
}) {
  const [note, setNote] = useState<string | null>(null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setNote('Copied')
    } catch {
      setNote('Copy is not available.')
    }
  }

  async function share() {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'NO CAP', text })
        setNote('Shared')
      } else {
        await copy()
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setNote('Share cancelled')
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" onClick={() => void share()}>
        Share
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={() => void copy()}>
        Copy
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClose}>
        Close
      </Button>
      {note && <span className="text-xs text-cyan">{note}</span>}
    </div>
  )
}
