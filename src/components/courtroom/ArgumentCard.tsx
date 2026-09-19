import type { CourtArgument } from '../../types'
import { Card, CardBody, CardHeader } from '../ui/Card'

interface ArgumentCardProps {
  argument: CourtArgument
}

const COPY: Record<CourtArgument['role'], { kicker: string; title: string; note: string }> = {
  prosecutor: {
    kicker: 'Prosecutor',
    title: 'Case against treating this as established fact',
    note: 'Assembled from stored flags, gaps, and ledger status. Not an accusation of the author.',
  },
  defender: {
    kicker: 'Defender',
    title: 'Strongest support available in the record',
    note: 'Includes honest gaps. Missing sources are not invented.',
  },
}

function Block({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div>
      <p className="label-kicker">{label}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {lines.map((line, index) => (
          <li key={`${label}-${index}`} className="text-sm leading-relaxed text-mute">
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ArgumentCard({ argument }: ArgumentCardProps) {
  const copy = COPY[argument.role]
  return (
    <Card className="float-up h-full">
      <CardHeader>
        <div>
          <p className="label-kicker text-cyan">{copy.kicker}</p>
          <h3 className="mt-1 text-sm font-medium text-ink">{copy.title}</h3>
          <p className="mt-1 text-[11px] text-faint">{copy.note}</p>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <Block label="Argument" lines={argument.argument} />
        <Block label="Evidence" lines={argument.evidence} />
        <Block label="Reasoning" lines={argument.reasoning} />
        <Block label="Limitations" lines={argument.limitations} />
      </CardBody>
    </Card>
  )
}
