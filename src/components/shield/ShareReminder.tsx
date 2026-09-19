import { Button } from '../ui/Button'

export function ShareReminder({
  claimId,
  onShareAnyway,
  onCancel,
}: {
  claimId: string
  onShareAnyway: () => void
  onCancel: () => void
}) {
  return (
    <div className="rounded-2xl border border-amber/30 bg-amber-dim px-3 py-3" role="status">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
        Verification status: Unverified
      </p>
      <p className="mt-1 text-xs text-ink">Consider checking the evidence before sharing.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onShareAnyway}>
          Share anyway
        </Button>
        <Button to={`/claim/${claimId}`} size="sm">
          View verification
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
