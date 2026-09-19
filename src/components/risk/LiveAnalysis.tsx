import type { RiskAnalysis } from '../../types'
import { RiskBadge } from '../badges/RiskBadge'

interface LiveAnalysisProps {
  analysis: RiskAnalysis | null
  active: boolean
}

function Row({ label, detected, detail }: { label: string; detected: boolean; detail: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-mute">{label}</span>
      <span className={`font-mono ${detected ? 'text-red' : 'text-faint'}`}>
        {detected ? '✓' : '—'}
        {detail ? <span className="ml-2 text-xs text-faint">{detail}</span> : null}
      </span>
    </div>
  )
}

export function LiveAnalysis({ analysis, active }: LiveAnalysisProps) {
  return (
    <aside className="glass-card p-4" aria-live="polite">
      <div className="mb-3 flex items-center gap-2">
        <span className={`pulse-dot ${active ? 'is-live' : ''}`} aria-hidden="true" />
        <p className="label-kicker">Live analysis</p>
      </div>

      {!analysis || !active ? (
        <p className="text-xs text-faint">Start typing a claim to preview risk signals. Nothing is stored until you submit.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Row
            label="Sensational"
            detected={analysis.sensational.detected}
            detail={analysis.sensational.detected ? analysis.sensational.matches[0] ?? '' : ''}
          />
          <Row
            label="Shouting"
            detected={analysis.shouting.detected}
            detail={`${Math.round(analysis.shouting.uppercasePercentage)}% CAPS`}
          />
          <Row
            label="Unsourced"
            detected={analysis.unsourced.detected}
            detail={analysis.unsourced.detected ? 'No URL' : ''}
          />
          <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-mute">Risk</span>
            <RiskBadge level={analysis.riskLevel} score={analysis.riskScore} />
          </div>
          <p className="text-[11px] text-faint">
            Preview only. Submit to persist the claim and run fingerprint matching.
          </p>
        </div>
      )}
    </aside>
  )
}
