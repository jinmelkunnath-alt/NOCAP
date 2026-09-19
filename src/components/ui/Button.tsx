import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
  to?: string
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs shadow-emerald-600/20 border border-emerald-600 active:scale-[0.98]',
  secondary: 'bg-white text-slate-800 hover:bg-slate-50 border border-line/80 shadow-2xs active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-xs shadow-rose-600/20 border border-rose-600 active:scale-[0.98]',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs shadow-emerald-600/20 border border-emerald-600 active:scale-[0.98]',
  warning: 'bg-amber-600 text-white hover:bg-amber-500 shadow-xs shadow-amber-600/20 border border-amber-600 active:scale-[0.98]',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

function classes(
  variant: Variant,
  size: Size,
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
    variantClass[variant],
    sizeClass[size],
    className,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  type = 'button',
  to,
  ...props
}: ButtonProps) {
  const classNames = classes(variant, size, className)

  if (to) {
    return (
      <Link
        to={to}
        className={cn(classNames, (disabled || loading) && 'pointer-events-none opacity-50')}
        aria-disabled={disabled || loading || undefined}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classNames}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
