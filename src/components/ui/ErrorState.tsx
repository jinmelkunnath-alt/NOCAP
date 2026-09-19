import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ErrorStateProps {
  title?: string
  message: string
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Unable to load',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-red/40 bg-red-dim px-6 py-12 text-center',
        className,
      )}
      role="alert"
    >
      <TriangleAlert className="h-6 w-6 text-red" aria-hidden="true" />
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      <p className="max-w-md text-xs text-mute">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
