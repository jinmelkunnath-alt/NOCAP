const STEPS = [
  'Claim',
  'Forensic scan',
  'Prosecutor',
  'Defender',
  'Evidence',
  'AI Judge',
  'Community',
  'Human verification',
] as const

interface PipelineProps {
  active?: (typeof STEPS)[number]
}

export function Pipeline({ active = 'AI Judge' }: PipelineProps) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, index) => {
        const isActive = step === active
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={
                isActive
                  ? 'rounded-full bg-cyan-dim px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan'
                  : 'rounded-full bg-elevated px-3 py-1 text-[10px] uppercase tracking-wider text-mute'
              }
            >
              {index + 1}. {step}
            </span>
            {index < STEPS.length - 1 && (
              <span className="hidden text-faint sm:inline" aria-hidden="true">
                →
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
