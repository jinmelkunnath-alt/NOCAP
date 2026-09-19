import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { DeskNotice } from '../components/review/DeskNotice'
import { StatusBadge } from '../components/badges/StatusBadge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { reportingService } from '../services/reportingService'
import { subscribeSocialChanged } from '../services/dataEvents'
import { formatTimestamp } from '../utils/format'
import type { IncidentReport, IncidentStatus } from '../types'
import { cn } from '../utils/cn'

const FILTERS: Array<{ id: 'all' | IncidentStatus; label: string }> = [
  { id: 'all', label: 'All Incidents' },
  { id: 'DRAFT', label: 'Prepared' },
  { id: 'AUTHORIZED', label: 'Awaiting Authorization' },
  { id: 'READY FOR SUBMISSION', label: 'Ready for Official Submission' },
]

export function ReportingPage() {
  const [tick, setTick] = useState(0)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')

  useEffect(() => subscribeSocialChanged(() => setTick((value) => value + 1)), [])

  const reports = useMemo(() => {
    void tick
    const list = reportingService.list()
    if (filter === 'all') return list
    return list.filter((item) => item.status === filter)
  }, [filter, tick])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Authorized Escalation"
        title="Incident Reporting"
        description="Prepare an official forensic snapshot of a Verified False record. NO CAP does not contact police, cybercrime, or government systems automatically."
      />
      <DeskNotice title="Official Incident Reporting Workflow">
        Official reporting is an escalation workflow. A NO CAP report does not itself establish
        legal wrongdoing, and nothing here contacts police, cybercrime, or government systems without authorized clearance.
      </DeskNotice>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              filter === item.id
                ? 'bg-[#EF3340] text-white shadow-xs'
                : 'bg-[#F4F4F4] text-[#555555] hover:bg-[#EAEAEA] hover:text-[#111111]'
            }`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No incident reports yet"
          description="Prepare a report from a Verified False claim. Unverified, Verified True, and Misleading claims do not open this workflow."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((item) => (
            <li key={item.id}>
              <ReportRow report={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReportRow({ report }: { report: IncidentReport }) {
  const snap = report.snapshot

  const statusLabel =
    report.status === 'DRAFT'
      ? 'Prepared'
      : report.status === 'AUTHORIZED'
        ? 'Awaiting Authorization'
        : 'Ready for Official Submission'

  const statusClass =
    report.status === 'READY FOR SUBMISSION'
      ? 'bg-[#D1FAE5] text-[#059669]'
      : report.status === 'AUTHORIZED'
        ? 'bg-[#FEF3C7] text-[#D97706]'
        : 'bg-[#FDE7E9] text-[#EF3340]'

  return (
    <article className="rounded-[22px] bg-white border border-[#EAEAEA] p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs font-bold text-[#EF3340]">{report.incidentId}</span>
          <h2 className="mt-1 text-base font-bold leading-snug text-[#111111]">{snap.text}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider', statusClass)}>
            {statusLabel}
          </span>
          <StatusBadge verdict={snap.verdict} />
        </div>
      </div>
      <p className="mt-3 text-xs text-[#667085]">
        {snap.platform} &bull; {snap.category} &bull; Risk {snap.riskLevel.toUpperCase()} &bull; Score {snap.riskScore} &bull;{' '}
        {snap.resolutionLabel} &bull; {snap.evidence.length} evidence items &bull; {snap.community.votes} votes
        {snap.courtroom ? ` &bull; Courtroom ${snap.courtroom.leaning}` : ''}
      </p>
      <p className="mt-1 font-mono text-[11px] text-[#9CA3AF]">
        Created {formatTimestamp(report.createdAt)}
        {report.needsRevalidation ? ' &bull; revalidation flagged' : ''}
      </p>
      <div className="mt-4 pt-3 border-t border-[#F0F0F0]">
        <Button to={`/reporting/${report.id}`} size="sm" className="rounded-full text-xs font-bold">
          Open Incident Dossier &rarr;
        </Button>
      </div>
    </article>
  )
}
