import type { ReactNode } from 'react'
import { ReviewerSwitcher } from './ReviewerSwitcher'

export function DeskNotice({
  title = 'Demo verification desk',
  children,
  showSwitcher = true,
}: {
  title?: string
  children?: ReactNode
  showSwitcher?: boolean
}) {
  return (
    <div className="mb-4 rounded-2xl border border-cyan/25 bg-cyan-dim px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">{title}</p>
      <p className="mt-1 text-xs text-mute">
        {children ??
          'Actions here are attributed to the selected demo reviewer, not your Guest ID. Visiting this URL does not make you a public moderator.'}
      </p>
      {showSwitcher && (
        <div className="mt-3 max-w-sm">
          <ReviewerSwitcher />
        </div>
      )}
    </div>
  )
}
