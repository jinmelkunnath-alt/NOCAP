import type { Category } from '../../types'
import { cn } from '../../utils/cn'

interface CategoryBadgeProps {
  category: Category
  className?: string
}

const styles: Record<Category, string> = {
  Politics: 'border-cyan/30 bg-cyan-dim text-cyan',
  Health: 'border-green/30 bg-green-dim text-green',
  Finance: 'border-amber/30 bg-amber-dim text-amber',
  Technology: 'border-teal/30 bg-cyan-dim text-teal',
  Campus: 'border-orange/30 bg-orange-dim text-orange',
  Entertainment: 'border-red/30 bg-red-dim text-red',
  Other: 'border-line bg-elevated text-mute',
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        styles[category],
        className,
      )}
    >
      {category}
    </span>
  )
}
