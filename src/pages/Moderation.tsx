import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { DeskNotice } from '../components/review/DeskNotice'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { moderationService } from '../services/moderationService'
import { subscribeSocialChanged } from '../services/dataEvents'
import { formatTimestamp } from '../utils/format'
import type { CommunityReport, ModerationStatus } from '../types'

const FILTERS: Array<{ id: 'queue' | ModerationStatus; label: string }> = [
  { id: 'queue', label: 'Open Queue' },
  { id: 'OPEN', label: 'Open' },
  { id: 'REVIEWING', label: 'Reviewing' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'DISMISSED', label: 'Dismissed' },
]

export function ModerationPage() {
  const [tick, setTick] = useState(0)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('queue')
  const [error, setError] = useState<string | null>(null)
  const [deskOn, setDeskOn] = useState(false)

  useEffect(() => subscribeSocialChanged(() => setTick((value) => value + 1)), [])

  const reports = useMemo(() => {
    void tick
    const list = moderationService.listReports()
    if (filter === 'queue') return list.filter((item) => item.status === 'OPEN' || item.status === 'REVIEWING')
    return list.filter((item) => item.status === filter)
  }, [filter, tick])

  const grouped = useMemo(() => {
    const map = new Map<string, CommunityReport[]>()
    for (const item of reports) {
      const key = `${item.claimId}:${item.target}`
      const bucket = map.get(key) ?? []
      bucket.push(item)
      map.set(key, bucket)
    }
    return [...map.entries()]
  }, [reports])

  function act(id: string, action: 'reviewing' | 'dismiss' | 'send-to-review' | 'resolve') {
    setError(null)
    try {
      moderationService.apply(id, action)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update moderation.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community Rules"
        title="Moderation"
        description="Moderation asks whether content violates community rules. Verification asks whether a claim has been investigated. They are separate."
      />

      {deskOn ? (
        <DeskNotice title="Demo moderation desk">
          Queue is visible to everyone. Taking an action requires entering the demo desk so a Guest
          ID is not treated as a moderator merely by visiting this URL.
        </DeskNotice>
      ) : (
        <div className="rounded-[20px] border border-[#EAEAEA] bg-white p-5 shadow-xs">
          <p className="text-xs text-[#667085] leading-relaxed">
            Read-only for guests. Enter the demo desk to dismiss, resolve, or send a report to
            verification. Report count never hides a post or changes a verdict.
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setDeskOn(true)}
              className="inline-flex items-center rounded-full bg-[#EF3340] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#D92D3A] transition-colors"
            >
              Enter Demo Desk
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              filter === item.id
                ? 'bg-[#EF3340] text-white shadow-xs'
                : 'bg-[#F4F4F4] text-[#555555] hover:bg-[#EAEAEA] hover:text-[#111111]'
            }`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-[#EF3340]/20 bg-[#FDE7E9] px-4 py-2.5 text-xs text-[#EF3340] font-medium" role="alert">
          {error}
        </p>
      )}

      {grouped.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          description="Community reports appear here. Report count never auto-hides a post or changes a verdict."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {grouped.map(([key, items]) => {
            const first = items[0]!
            return (
              <li key={key} className="rounded-[22px] bg-white border border-[#EAEAEA] p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#EF3340]">
                    {first.target} &bull; {items.length} report{items.length === 1 ? '' : 's'}
                  </p>
                  <span className="font-mono text-[11px] text-[#9CA3AF]">{first.claimId}</span>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] px-4 py-3">
                      <p className="text-xs font-semibold text-[#111111]">{item.reason}</p>
                      {item.detail && <p className="mt-1 text-xs text-[#667085]">{item.detail}</p>}
                      <p className="mt-1 font-mono text-[10px] text-[#9CA3AF]">
                        {item.status} &bull; {item.reporterId} &bull; {formatTimestamp(item.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-[#F0F0F0]">
                  <Button to={`/claim/${first.claimId}`} size="sm" variant="secondary" className="rounded-full text-xs">
                    View Claim
                  </Button>
                  <Button to={`/courtroom/${first.claimId}`} size="sm" variant="ghost" className="rounded-full text-xs">
                    View Courtroom
                  </Button>
                  {deskOn && moderationService.canModerate() && (
                    <>
                      <Button type="button" size="sm" variant="ghost" onClick={() => act(first.id, 'reviewing')} className="rounded-full text-xs">
                        Reviewing
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => act(first.id, 'send-to-review')} className="rounded-full text-xs">
                        Send to Review
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => act(first.id, 'dismiss')} className="rounded-full text-xs">
                        Dismiss
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => act(first.id, 'resolve')} className="rounded-full text-xs">
                        Resolve
                      </Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
