import { ExternalLink, Link2 } from 'lucide-react'
import type { Evidence } from '../../types'
import { EmptyState } from '../ui/EmptyState'

interface EvidenceListProps {
  evidence: Evidence[]
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <EmptyState
        icon={<Link2 className="h-5 w-5" />}
        title="No evidence attached"
        description="Reviewers can append source URLs when a verdict is published."
        className="py-8"
      />
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {evidence.map((item) => (
        <li key={item.id} className="border border-line bg-elevated px-3 py-2">
          <p className="text-sm font-medium text-ink">{item.title || 'Evidence link'}</p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-cyan hover:underline"
            >
              {item.url}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
          {item.description && <p className="mt-1 text-xs text-mute">{item.description}</p>}
        </li>
      ))}
    </ul>
  )
}
