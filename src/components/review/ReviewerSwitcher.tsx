import { sessionService } from '../../services/sessionService'

export function ReviewerSwitcher() {
  const current = sessionService.getDeskReviewer()
  const reviewers = sessionService.reviewers()

  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-mute">Demo desk reviewer</span>
      <select
        className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-ink"
        value={current.id}
        onChange={(event) => sessionService.setDeskReviewerId(event.target.value)}
        aria-label="Switch demo reviewer"
      >
        {reviewers.map((item) => (
          <option key={item.id} value={item.id}>
            {item.displayName} · Perspective {item.perspective}
          </option>
        ))}
      </select>
      <span className="text-[11px] text-faint">
        Local demo only. A/B tags are independent review roles, not political identities.
      </span>
    </label>
  )
}
