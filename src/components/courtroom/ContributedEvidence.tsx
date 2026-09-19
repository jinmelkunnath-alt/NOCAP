import { courtroomService } from '../../services/courtroomService'

interface ContributedEvidenceProps {
  claimId: string
}

export function ContributedEvidence({ claimId }: ContributedEvidenceProps) {
  const items = courtroomService.userEvidenceFor(claimId)
  if (items.length === 0) return null
  return (
    <div>
      <p className="label-kicker">Community evidence (unverified)</p>
      <p className="mt-1 text-[11px] text-faint">
        Submitted on the courtroom board. Needs human review. Not an official verdict.
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-dashed border-line px-3 py-2">
            <p className="text-xs font-medium text-ink">{item.title}</p>
            {item.url && (
              <a href={item.url} className="text-xs text-cyan" target="_blank" rel="noreferrer">
                {item.url}
              </a>
            )}
            <p className="mt-1 text-xs text-mute">{item.explanation}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-orange">Needs human review</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
