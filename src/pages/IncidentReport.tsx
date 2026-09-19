import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IncidentReportView } from '../components/reporting/IncidentReportView'
import { DeskNotice } from '../components/review/DeskNotice'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { reportingService } from '../services/reportingService'
import { subscribeSocialChanged } from '../services/dataEvents'
import type { IncidentReport as IncidentReportModel } from '../types'

export function IncidentReportPage() {
  const { incidentId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<IncidentReportModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function load() {
      setReport(incidentId ? reportingService.getById(incidentId) : null)
      setLoading(false)
    }
    load()
    return subscribeSocialChanged(load)
  }, [incidentId])

  if (loading) return <LoadingState label="Loading incident report" />
  if (!report) {
    return (
      <ErrorState
        title="Report not found"
        message="That incident ID is not in the local reporting store."
        action={
          <Button to="/reporting" size="sm" variant="secondary">
            Reporting desk
          </Button>
        }
      />
    )
  }

  function generate() {
    const current = report
    if (!current) return
    setError(null)
    try {
      const next = reportingService.generateAuthorized(current.id, confirmed)
      setReport(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate report.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap gap-2 no-print">
        <Button to="/reporting" size="sm" variant="secondary">
          All reports
        </Button>
        <Button to={`/claim/${report.claimId}`} size="sm" variant="ghost">
          Open claim
        </Button>
        <Button type="button" size="sm" onClick={() => window.print()}>
          Download / print
        </Button>
      </div>

      <IncidentReportView report={report} />

      {report.status !== 'READY FOR SUBMISSION' && reportingService.canPrepare() && (
        <DeskNotice title="Authorized preparation" showSwitcher>
          Generating a report attributes the action to the selected demo reviewer. The authorization
          box is never pre-checked, and no authority is contacted.
        </DeskNotice>
      )}
      {report.status !== 'READY FOR SUBMISSION' && reportingService.canPrepare() && (
        <section className="glass-card mt-4 p-5 no-print">
          <p className="label-kicker">Authorized report preparation</p>
          <p className="mt-2 text-sm text-mute">
            Demo desk reviewer confirmation. This does not contact any authority.
          </p>
          <label htmlFor="incident-authorize" className="mt-3 flex items-start gap-2 text-sm text-ink">
            <input
              id="incident-authorize"
              type="checkbox"
              className="mt-1"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              I have reviewed the information in this report and confirm that it accurately
              represents the NO CAP verification record.
            </span>
          </label>
          {error && (
            <p className="mt-3 rounded-xl border border-red/40 bg-red-dim px-3 py-2 text-sm text-red" role="alert">
              {error}
            </p>
          )}
          <div className="mt-4">
            <Button type="button" onClick={generate} disabled={!confirmed}>
              Generate report
            </Button>
          </div>
        </section>
      )}

      {report.status === 'READY FOR SUBMISSION' && (
        <div className="no-print mt-4">
          <Button type="button" size="sm" variant="secondary" onClick={() => navigate('/reporting')}>
            Back to reporting
          </Button>
        </div>
      )}
    </div>
  )
}
