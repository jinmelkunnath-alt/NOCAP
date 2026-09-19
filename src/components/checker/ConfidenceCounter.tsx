import { useState, useEffect } from 'react'

export function ConfidenceCounter({ target }: { target: number }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setCurrent(target)
      return
    }

    let start = 0
    const duration = 650 // ms
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const val = Math.round(start + (target - start) * eased)
      setCurrent(val)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    const frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return <>{current}%</>
}
