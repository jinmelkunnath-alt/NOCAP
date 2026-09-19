import { useNavigate } from 'react-router-dom'
import { reportingService } from '../../services/reportingService'
import type { Claim } from '../../types'
import { Button } from '../ui/Button'

export function PrepareIncidentButton({ claim }: { claim: Claim }) {
  const navigate = useNavigate()
  if (claim.verdict !== 'Verified False') return null
  if (!reportingService.canPrepare()) return null

  function go() {
    try {
      const existing = reportingService.latestForClaim(claim.id)
      if (existing) {
        navigate(`/reporting/${existing.id}`)
        return
      }
      const report = reportingService.createDraft(claim.id)
      navigate(`/reporting/${report.id}`)
    } catch {
      navigate('/reporting')
    }
  }

  return (
    <Button type="button" size="sm" onClick={go}>
      Prepare incident report
    </Button>
  )
}
