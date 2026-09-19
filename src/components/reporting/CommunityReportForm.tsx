import { useState, type FormEvent } from 'react'
import { moderationService } from '../../services/moderationService'
import { COMMUNITY_REPORT_REASONS, type CommunityReportReason } from '../../types'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'

export function CommunityReportForm({
  claimId,
  commentId = null,
  onDone,
}: {
  claimId: string
  commentId?: string | null
  onDone?: () => void
}) {
  const [reason, setReason] = useState<CommunityReportReason>('Spam')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      moderationService.createReport({ claimId, commentId, reason, detail })
      setDone(true)
      onDone?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to file report.')
    }
  }

  if (done) {
    return (
      <p className="rounded-xl border border-cyan/30 bg-cyan-dim px-3 py-2 text-xs text-cyan" role="status">
        Community report recorded. This does not change the verification status and does not remove
        the post.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-[11px] text-faint">
        Community moderation — “Does this content violate community rules?” It is not a NO CAP
        verdict.
      </p>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-mute">Reason</span>
        <select
          className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-ink"
          value={reason}
          onChange={(event) => setReason(event.target.value as CommunityReportReason)}
        >
          {COMMUNITY_REPORT_REASONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <Textarea
        id={`report-${claimId}-${commentId ?? 'claim'}`}
        name="detail"
        label="Details (optional)"
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        rows={3}
      />
      {error && (
        <p className="rounded-xl border border-red/40 bg-red-dim px-3 py-2 text-sm text-red" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" variant="secondary">
        Submit community report
      </Button>
    </form>
  )
}
