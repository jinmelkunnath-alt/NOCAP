import type { RiskAnalysis } from '../../types'
import { RiskBadge } from '../badges/RiskBadge'

interface RiskBreakdownProps {
  analysis: RiskAnalysis
}

function SignalRow({
  ok,
  title,
  detail,
}: {
  ok: boolean
  title: string
  detail: string
}) {
  return (
    <div className="flex gap-3 border-b border-line py-2 last:border-b-0">
      <span
        className={`font-mono text-sm ${ok ? 'text-green' : 'text-red'}`}
        aria-hidden="true"
      >
        {ok ? '✓' : '✕'}
      </span>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-mute">{detail}</p>
      </div>
    </div>
  )
}

export function RiskBreakdown({ analysis }: RiskBreakdownProps) {
  const sensationalDetail = analysis.sensational.detected
    ? analysis.sensational.matches.map((item) => `"${item}"`).join(', ')
    : 'No trigger phrases matched'
  const shoutingDetail = analysis.shouting.detected
    ? `${Math.round(analysis.shouting.uppercasePercentage)}% CAPS detected`
    : `${Math.round(analysis.shouting.uppercasePercentage)}% uppercase — below the 50% rule`
  const sourceDetail = analysis.unsourced.detected
    ? 'No valid source URL provided'
    : 'Valid http(s) source URL provided'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-kicker">Risk score</p>
          <p className="mt-1 font-mono text-2xl text-ink">
            {analysis.riskScore}
            <span className="text-sm text-mute"> / 100</span>
          </p>
          <p className="mt-1 text-[11px] text-faint">
            Rule-based triage score based on observable signals.
          </p>
        </div>
        <RiskBadge level={analysis.riskLevel} score={analysis.riskScore} />
      </div>

      <div>
        <p className="label-kicker mb-1">Signals detected</p>
        <SignalRow
          ok={!analysis.sensational.detected}
          title="Sensational language"
          detail={sensationalDetail}
        />
        <SignalRow
          ok={!analysis.shouting.detected}
          title="Shouting"
          detail={shoutingDetail}
        />
        <SignalRow
          ok={!analysis.unsourced.detected}
          title="Source"
          detail={sourceDetail}
        />
      </div>

      <div>
        <p className="label-kicker mb-1">Classification</p>
        <p className="text-sm font-medium uppercase tracking-wider text-ink">
          {analysis.riskLevel} risk
        </p>
      </div>

      <div>
        <p className="label-kicker mb-1">Why?</p>
        <ul className="flex flex-col gap-1">
          {analysis.explanation.map((line) => (
            <li key={line} className="text-sm text-mute">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
