import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-panel/60 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="text-faint" aria-hidden="true">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      {description && <p className="max-w-md text-xs text-mute">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
