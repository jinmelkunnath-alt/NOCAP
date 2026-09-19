import type { IncidentReport } from '../../types'
import { formatTimestamp } from '../../utils/format'
import { StatusBadge } from '../badges/StatusBadge'
import { RiskBadge } from '../badges/RiskBadge'
import { ResolutionPathVisual } from '../shield/ResolutionPathVisual'

export function IncidentReportView({ report }: { report: IncidentReport }) {
  const snap = report.snapshot
  const communityTotal = snap.community.votes
  const pct = (n: number) => (communityTotal === 0 ? 0 : Math.round((n / communityTotal) * 100))

  return (
    <article className="print-report flex flex-col gap-5">
      <header className="glass-card p-5">
        <p className="font-mono text-[10px] tracking-[0.22em] text-cyan">NO CAP INCIDENT REPORT</p>
        <h1 className="mt-1 font-mono text-xl font-semibold text-ink">{report.incidentId}</h1>
        <p className="mt-2 text-xs text-mute">
          Status {report.status}
          {report.needsRevalidation
            ? ' · Information may require revalidation because the associated claim has been reopened.'
            : ''}
        </p>
        <p className="mt-3 rounded-2xl border border-amber/30 bg-amber-dim px-3 py-2 text-xs text-amber">
          Official reporting is an escalation workflow. A NO CAP report does not itself establish
          legal wrongdoing.
        </p>
      </header>

      <section className="glass-card p-5">
        <p className="label-kicker">Claim</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{snap.text}</p>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-faint">Submitted</dt>
            <dd className="mt-0.5 font-mono text-ink">
              <time dateTime={snap.submittedAt}>{formatTimestamp(snap.submittedAt)}</time>
            </dd>
          </div>
          <div>
            <dt className="text-faint">Platform / category</dt>
            <dd className="mt-0.5 text-ink">
              {snap.platform} · {snap.category}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-faint">Source URL</dt>
            <dd className="mt-0.5 break-all text-ink">{snap.sourceUrl.trim() || 'None provided'}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-card p-5">
          <p className="label-kicker">NO CAP verification</p>
          <p className="mt-2 text-[11px] text-faint">Human / fingerprint accountability — the official status.</p>
          <div className="mt-2">
            <StatusBadge verdict={snap.verdict} />
          </div>
          <div className="mt-3">
            <ResolutionPathVisual path={snap.resolutionPath} />
          </div>
          <p className="mt-3 font-mono text-sm text-ink">
            {snap.completedPerspectives} / {snap.requiredPerspectives || 0} perspectives
          </p>
          {snap.reviewerNotes.length === 0 ? (
            <p className="mt-2 text-xs text-faint">No human reviewer notes on this snapshot.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {snap.reviewerNotes.map((item) => (
                <li key={`${item.reviewerId}-${item.createdAt}`} className="rounded-xl bg-elevated px-3 py-2">
                  <p className="text-xs font-medium text-ink">
                    {item.verdict}
                    {item.perspective ? ` · Perspective ${item.perspective}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-mute">{item.note}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-card p-5">
          <p className="label-kicker">Risk</p>
          <div className="mt-2">
            <RiskBadge
              level={snap.riskLevel === 'High' || snap.riskLevel === 'Medium' || snap.riskLevel === 'Low' ? snap.riskLevel : 'Low'}
              score={snap.riskScore}
            />
          </div>
          <p className="mt-2 text-xs text-mute">
            Signals: {snap.flags.length ? snap.flags.join(', ') : 'none recorded'}
          </p>
          <p className="mt-2 text-[11px] text-faint">
            Observable triage signals. Not truth probability, fake probability, or AI confidence.
          </p>
        </section>
      </div>

      <section className="glass-card p-5">
        <p className="label-kicker">Evidence</p>
        {snap.evidence.length === 0 ? (
          <p className="mt-2 text-sm text-faint">Insufficient evidence available.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {snap.evidence.map((item, index) => (
              <li key={`${item.reference}-${index}`} className="rounded-xl border border-line px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-cyan">
                  {item.classification.replaceAll('-', ' ')} · {item.type.replaceAll('_', ' ')}
                </p>
                <p className="mt-1 text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-0.5 break-all text-xs text-mute">{item.reference}</p>
                <p className="mt-1 text-xs text-mute">{item.description}</p>
                <p className="mt-1 font-mono text-[10px] text-faint">
                  {item.addedBy} · {formatTimestamp(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-card p-5">
        <p className="label-kicker">AI courtroom</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-amber">
          Advisory AI assessment
        </p>
        {snap.courtroom ? (
          <>
            <p className="mt-2 text-sm text-ink">
              Hearing #{snap.courtroom.hearingNumber} · {snap.courtroom.leaning}
            </p>
            <p className="mt-1 text-xs text-mute">
              Prosecutor {snap.courtroom.prosecutorPoints} points · Defender{' '}
              {snap.courtroom.defenderPoints} points · Gaps {snap.courtroom.gaps}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-faint">No courtroom hearing was on record at snapshot time.</p>
        )}
        <p className="mt-2 text-[11px] text-faint">
          AI analysis is supporting context and does not determine the official NO CAP verdict.
        </p>
      </section>

      <section className="glass-card p-5">
        <p className="label-kicker">Community context</p>
        <p className="mt-1 text-[11px] text-faint">
          Contextual only. Community participation did not prove the claim false.
        </p>
        {communityTotal === 0 ? (
          <p className="mt-2 text-sm text-faint">No votes recorded at snapshot time.</p>
        ) : (
          <p className="mt-2 font-mono text-sm text-ink">
            {communityTotal} votes · {pct(snap.community.agree)}% Agree · {pct(snap.community.disagree)}%
            Disagree · {pct(snap.community.unsure)}% Unsure
          </p>
        )}
        <p className="mt-2 text-xs text-mute">
          {snap.community.comments} comments · {snap.community.shares} shares · {snap.community.saves}{' '}
          saves
        </p>
      </section>

      <section className="glass-card p-5">
        <p className="label-kicker">Timeline</p>
        <ol className="mt-3 flex flex-col">
          {snap.timeline.map((step, index) => (
            <li key={`${step.label}-${index}`} className="flex gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan" aria-hidden="true" />
              <p className="pb-3 text-xs text-ink">
                {step.label}
                {step.at ? (
                  <span className="ml-2 font-mono text-faint">{formatTimestamp(step.at)}</span>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="glass-card p-5">
        <p className="label-kicker">Preparation</p>
        <p className="mt-2 text-xs text-mute">Created by demo desk reviewer {report.createdBy}</p>
        {report.authorizedBy && (
          <p className="mt-1 text-xs text-mute">Authorized by {report.authorizedBy}</p>
        )}
        {report.notes && <p className="mt-2 text-sm text-ink">{report.notes}</p>}
        <ol className="mt-3 flex flex-col gap-1">
          {[...report.audit]
            .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
            .map((item) => (
              <li key={item.id} className="text-xs text-mute">
                <span className="font-semibold uppercase tracking-wider text-ink">{item.kind}</span>
                <span className="ml-2 font-mono text-faint">{formatTimestamp(item.at)}</span>
                <span className="mt-0.5 block">{item.note}</span>
              </li>
            ))}
        </ol>
        {report.status === 'READY FOR SUBMISSION' && (
          <p className="mt-4 rounded-2xl border border-cyan/30 bg-cyan-dim px-3 py-2 text-xs text-cyan">
            Ready for official submission. NO CAP has prepared the report. An authorized person
            can submit it through the appropriate official channel. No external authority was
            contacted.
          </p>
        )}
      </section>
    </article>
  )
}
