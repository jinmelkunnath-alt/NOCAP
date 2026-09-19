import { useState, type FormEvent } from 'react'
import { courtroomService } from '../../services/courtroomService'
import type { CourtEvidence } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Card, CardBody, CardHeader } from '../ui/Card'

interface EvidenceBoardProps {
  claimId: string
  items: CourtEvidence[]
}

const STATUS_LABEL: Record<CourtEvidence['status'], string> = {
  'reviewer-supplied': 'Reviewer-supplied',
  'needs-human-review': 'Needs human review',
  context: 'Context',
  system: 'System record',
}

export function EvidenceBoard({ claimId, items }: EvidenceBoardProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      courtroomService.addEvidence({ claimId, title, url, explanation })
      setTitle('')
      setUrl('')
      setExplanation('')
      setOpen(false)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add evidence.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <p className="label-kicker">Evidence board</p>
          <h3 className="mt-1 text-sm font-medium text-ink">Stored material only</h3>
          <p className="mt-1 text-[11px] text-faint">
            User contributions are not auto-verified and do not change the official verdict.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((value) => !value)}>
          {open ? 'Cancel' : '+ Add evidence'}
        </Button>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {saved && (
          <p className="rounded-xl border border-cyan/30 bg-cyan-dim px-3 py-2 text-xs text-cyan" role="status">
            Saved to the board. Needs human review. Not an official verdict.
          </p>
        )}
        {open && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-elevated p-3">
            <Input
              id={`ev-title-${claimId}`}
              name="title"
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <Input
              id={`ev-url-${claimId}`}
              name="url"
              type="url"
              label="URL (optional)"
              placeholder="https://"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <Textarea
              id={`ev-why-${claimId}`}
              name="explanation"
              label="Why this is relevant"
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              rows={3}
              required
            />
            {error && (
              <p className="rounded-xl border border-red/40 bg-red-dim px-3 py-2 text-sm text-red" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" size="sm">
              Save to board
            </Button>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-faint">Insufficient evidence available.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-line bg-elevated/80 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan">
                    {item.type.replaceAll('_', ' ')}
                  </span>
                  <span className="glass-pill px-2 py-0.5 text-[10px] uppercase tracking-wider text-mute">
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-ink">{item.title}</p>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-xs text-cyan hover:underline"
                  >
                    {item.url}
                  </a>
                ) : (
                  <p className="mt-0.5 text-xs text-faint">{item.reference}</p>
                )}
                <p className="mt-1 text-xs text-mute">{item.explanation}</p>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
