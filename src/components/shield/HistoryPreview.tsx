import type { HistoryStep } from '../../types'
import { cn } from '../../utils/cn'

export function HistoryPreview({ steps }: { steps: HistoryStep[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {steps.map((step, index) => (
        <li key={step.id} className="flex gap-2">
          <span className="flex w-4 flex-col items-center">
            <span
              className={cn(
                'mt-1 h-2 w-2 rounded-full',
                step.done ? 'bg-cyan' : 'bg-line-strong',
              )}
              aria-hidden="true"
            />
            {index < steps.length - 1 && <span className="min-h-4 w-px flex-1 bg-line" />}
          </span>
          <p className={cn('pb-3 text-xs', step.done ? 'text-ink' : 'text-faint')}>{step.label}</p>
        </li>
      ))}
    </ol>
  )
}
