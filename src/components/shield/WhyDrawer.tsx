import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

export function WhyDrawer({
  title,
  open,
  onClose,
  children,
}: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/30"
        aria-label="Close explanation"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="why-title"
        className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-kicker">Why?</p>
            <h2 id="why-title" className="mt-1 text-base font-semibold text-ink">
              {title}
            </h2>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}
