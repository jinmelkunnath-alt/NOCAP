import { Link } from 'react-router-dom'
import type { EvidencePreviewItem } from '../../types'

export function EvidencePreview({
  claimId,
  items,
}: {
  claimId: string
  items: EvidencePreviewItem[]
}) {
  const present = items.filter((item) => item.present)
  return (
    <div>
      <p className="label-kicker">Evidence</p>
      {present.length === 0 ? (
        <p className="mt-1 text-xs text-faint">Insufficient evidence available.</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-mute">
            {present.length} stored item{present.length === 1 ? '' : 's'} on this record
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {present.map((item) => (
              <li key={item.id} className="text-xs text-ink">
                ✓ {item.label}
              </li>
            ))}
          </ul>
        </>
      )}
      <Link to={`/claim/${claimId}`} className="mt-2 inline-block text-xs text-cyan hover:underline">
        View all evidence
      </Link>
    </div>
  )
}
