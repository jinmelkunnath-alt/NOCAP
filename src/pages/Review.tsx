import { useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { DeskNotice } from '../components/review/DeskNotice'
import { ResolutionBadge } from '../components/review/ResolutionBadge'
import { ReviewPanel } from '../components/review/ReviewPanel'
import { CategoryBadge } from '../components/badges/CategoryBadge'
import { PlatformBadge } from '../components/badges/PlatformBadge'
import { RiskBadge } from '../components/badges/RiskBadge'
import { StatusBadge } from '../components/badges/StatusBadge'
import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSocial } from '../context/SocialProvider'
import { useClaims } from '../hooks/useClaims'
import { useReviews } from '../hooks/useReviews'
import { sessionService } from '../services/sessionService'
import type { Claim } from '../types'
import { isOpenQueueItem, sortReviewQueue } from '../utils/queueRank'
import { deriveResolutionPath, verificationPath } from '../utils/verificationPath'

type DeskTab = 'mine' | 'bridging' | 'resolved' | 'history'

export function ReviewPage() {
  const { claims, loading, error, refetch } = useClaims()
  const { reviews, refetch: refetchReviews } = useReviews()
  useSocial()
  const desk = sessionService.getDeskReviewer()
  const [tab, setTab] = useState<DeskTab>('mine')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const open = useMemo(
    () => sortReviewQueue(claims.filter(isOpenQueueItem), reviews),
    [claims, reviews],
  )
  const bridging = useMemo(
    () => open.filter((claim) => deriveResolutionPath(claim) === 'BRIDGING_VERIFICATION'),
    [open],
  )
  const mine = useMemo(() => {
    if (desk.perspective) {
      const waiting = bridging.filter((claim) => {
        const path = verificationPath(claim, claims, reviews)
        return desk.perspective === 'A'
          ? path.perspectiveA === 'pending'
          : path.perspectiveB === 'pending'
      })
      const rest = open.filter((claim) => !bridging.includes(claim))
      return [...waiting, ...rest]
    }
    return open
  }, [bridging, claims, desk.perspective, open, reviews])

  const resolved = useMemo(
    () =>
      [...claims]
        .filter((claim) => claim.verdict !== 'Unverified')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [claims],
  )

  const history = useMemo(
    () =>
      [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [reviews],
  )

  const list: Claim[] =
    tab === 'mine' ? mine : tab === 'bridging' ? bridging : tab === 'resolved' ? resolved : []

  const selected =
    claims.find((claim) => claim.id === selectedId) ??
    (tab !== 'history' ? list[0] : undefined)

  function handlePublished() {
    void refetch()
    void refetchReviews()
  }

  if (loading) return <LoadingState label="Loading review desk" />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Verification Desk"
        title="Human Review"
        description="Community votes never publish a NO CAP verdict. High-risk novel claims need Perspective A and Perspective B to agree."
      />

      <DeskNotice title="Demo Verification Desk">
        Human verdicts are published as the selected reviewer, not as your Guest ID. Community votes
        never write the official status.
      </DeskNotice>
      <p className="text-xs text-[#667085]">
        Queue order: high-risk awaiting a missing perspective, then other high-risk, then older
        unresolved, then lower-risk. Not ranked by topic or ideology.
      </p>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Review sections">
        {(
          [
            ['mine', 'My Queue'],
            ['bridging', 'Bridging Queue'],
            ['resolved', 'Recently Resolved'],
            ['history', 'Review History'],
          ] as Array<[DeskTab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              tab === id
                ? 'bg-[#EF3340] text-white shadow-xs'
                : 'bg-[#F4F4F4] text-[#555555] hover:bg-[#EAEAEA] hover:text-[#111111]'
            }`}
            onClick={() => {
              setTab(id)
              setSelectedId(null)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <Card>
          <CardBody>
            {history.length === 0 ? (
              <EmptyState title="No decisions yet" description="Submitted reviews appear here and stay append-only." />
            ) : (
              <ol className="flex flex-col gap-3">
                {history.map((item) => {
                  const claim = claims.find((row) => row.id === item.claimId)
                  return (
                    <li key={item.id} className="rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] px-4 py-3">
                      <p className="text-xs font-bold text-[#111111]">{item.verdict}</p>
                      <p className="mt-1 text-sm text-[#667085]">{item.note}</p>
                      <p className="mt-1 font-mono text-[11px] text-[#9CA3AF]">
                        {item.reviewerId}
                        {item.perspective ? ` &bull; ${item.perspective}` : ''} &bull; {item.claimId}
                      </p>
                      {claim && (
                        <Button to={`/claim/${claim.id}`} size="sm" variant="ghost" className="mt-2 text-xs">
                          Open claim
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <section aria-label="Queue">
            {list.length === 0 ? (
              <EmptyState title="Queue is clear" description="Nothing in this section right now." />
            ) : (
              <ul className="flex flex-col gap-3">
                {list.map((claim) => {
                  const path = verificationPath(claim, claims, reviews)
                  const active = selected?.id === claim.id
                  return (
                    <li key={claim.id}>
                      <article className={`rounded-[20px] bg-white border p-5 shadow-xs transition-all ${active ? 'border-[#EF3340] ring-2 ring-[#EF3340]/20' : 'border-[#EAEAEA]'}`}>
                        <p className="text-sm font-semibold leading-relaxed text-[#111111]">{claim.text}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <StatusBadge verdict={claim.verdict} />
                          <RiskBadge level={claim.riskLevel} score={claim.riskScore} />
                          <PlatformBadge platform={claim.platform} />
                          <CategoryBadge category={claim.category} />
                          <ResolutionBadge path={path.resolutionPath} latency={path.latency} />
                        </div>
                        {path.kind === 'bridging-consensus' && claim.verdict === 'Unverified' && (
                          <p className="mt-2 text-xs text-[#667085]">{path.detail}</p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={active ? 'primary' : 'secondary'}
                            onClick={() => setSelectedId(claim.id)}
                          >
                            Review
                          </Button>
                          <Button to={`/claim/${claim.id}`} size="sm" variant="ghost">
                            Open detail
                          </Button>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section aria-label="Review panel">
            <Card>
              <CardBody className="p-4 sm:p-6">
                {selected ? (
                  <ReviewPanel
                    claim={selected}
                    reviews={reviews.filter((item) => item.claimId === selected.id)}
                    catalog={claims}
                    onPublished={handlePublished}
                  />
                ) : (
                  <EmptyState
                    title="Select a claim"
                    description="Choose Review to load the human verdict panel."
                    className="border-0 py-16"
                  />
                )}
              </CardBody>
            </Card>
          </section>
        </div>
      )}
    </div>
  )
}
