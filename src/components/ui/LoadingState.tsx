import { LoaderCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Loading', className }: LoadingStateProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2 py-16 text-sm text-mute', className)}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="h-4 w-4 animate-spin text-cyan" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
