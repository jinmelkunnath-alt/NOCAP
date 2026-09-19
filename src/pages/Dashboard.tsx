import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ClaimCard } from '../components/claim/ClaimCard'
import { PageHeader } from '../components/layout/PageHeader'
import { RiskBadge } from '../components/badges/RiskBadge'
import { StatusBadge } from '../components/badges/StatusBadge'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useClaimStats } from '../hooks/useClaimStats'
import { useClaims } from '../hooks/useClaims'
import type { Category, Platform, RiskLevel, Verdict } from '../types'
import { formatRelative } from '../utils/format'
import { sortRiskWeightedRecency } from '../utils/ranking'

export function DashboardPage() {
  const { claims, loading: claimsLoading, error: claimsError } = useClaims()
  const { stats, loading: statsLoading, error: statsError } = useClaimStats()

  const loading = claimsLoading || statsLoading
  const error = claimsError || statsError

  if (loading) return <LoadingState label="Loading insights" />
  if (error || !stats) return <ErrorState message={error ?? 'Stats unavailable.'} />

  const byId = new Map(claims.map((claim) => [claim.id, claim]))
  const highRisk = sortRiskWeightedRecency(claims.filter((claim) => claim.riskLevel === 'High')).slice(
    0,
    4,
  )
  const recent = [...claims]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const riskMax = Math.max(stats.byRisk.Low, stats.byRisk.Medium, stats.byRisk.High, 1)
  const statusMax = Math.max(...Object.values(stats.byVerdict), 1)
  const platformMax = Math.max(...Object.values(stats.byPlatform), 1)
  const categoryMax = Math.max(...Object.values(stats.byCategory), 1)

  return (
    <div>
      <PageHeader
        eyebrow="NO CAP"
        title="Insights"
        description="Counts and queues from the stored claim desk. Seed records are labelled [DEMO] and are fictional."
        actions={
          <>
            <Button to="/" variant="secondary" size="sm">
              Open feed
            </Button>
            <Button to="/submit" size="sm">
              Post a rumour
            </Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total claims" value={stats.total} tone="ink" />
        <StatCard label="Unverified" value={stats.unverified} tone="orange" />
        <StatCard label="High risk" value={stats.highRisk} tone="red" />
        <StatCard label="Resolved" value={stats.reviewed} tone="green" />
      </section>
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Potential variants" value={stats.potentialDuplicates} tone="cyan" />
        <StatCard label="Related submissions" value={stats.relatedSubmissions} tone="cyan" />
        <StatCard label="Claims with flags" value={stats.flagged} tone="orange" />
        <StatCard label="Community votes" value={stats.communityVotes} tone="mute" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <p className="label-kicker">Risk distribution</p>
              <h2 className="mt-1 text-sm font-medium text-ink">Observable triage levels</h2>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {(['High', 'Medium', 'Low'] as RiskLevel[]).map((level) => (
              <Meter
                key={level}
                label={<RiskBadge level={level} />}
                value={stats.byRisk[level]}
                max={riskMax}
                tone={level === 'High' ? 'red' : level === 'Medium' ? 'orange' : 'green'}
              />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="label-kicker">Status distribution</p>
              <h2 className="mt-1 text-sm font-medium text-ink">Official desk verdicts</h2>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {(
              [
                ['Unverified', 'orange'],
                ['Verified True', 'green'],
                ['Verified False', 'red'],
                ['Misleading', 'orange'],
              ] as Array<[Verdict, 'orange' | 'green' | 'red']>
            ).map(([verdict, tone]) => (
              <Meter
                key={verdict}
                label={<StatusBadge verdict={verdict} />}
                value={stats.byVerdict[verdict]}
                max={statusMax}
                tone={tone}
              />
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <p className="label-kicker">Platforms</p>
              <h2 className="mt-1 text-sm font-medium text-ink">Where claims were submitted from</h2>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {(['WhatsApp', 'X', 'Instagram', 'Reddit', 'Other'] as Platform[]).map((platform) => (
              <Meter
                key={platform}
                label={platform}
                value={stats.byPlatform[platform]}
                max={platformMax}
                tone="cyan"
              />
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="label-kicker">Categories</p>
              <h2 className="mt-1 text-sm font-medium text-ink">Descriptive topic mix only</h2>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {(['Politics', 'Health', 'Finance', 'Technology', 'Campus', 'Entertainment', 'Other'] as Category[]).map((category) => (
              <Meter
                key={category}
                label={category}
                value={stats.byCategory[category]}
                max={categoryMax}
                tone="cyan"
              />
            ))}
          </CardBody>
        </Card>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="label-kicker">High-risk claims</p>
            <h2 className="mt-1 text-sm font-medium text-ink">Risk-Weighted Recency</h2>
          </div>
          <Link to="/feed" className="text-xs font-medium text-cyan hover:underline">
            View feed
          </Link>
        </div>
        {highRisk.length === 0 ? (
          <EmptyState title="No high-risk claims currently." description="Nothing in the store is scored High." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {highRisk.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                compact
                relatedClaim={claim.matchedClaimId ? (byId.get(claim.matchedClaimId) ?? null) : null}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <Card>
          <CardHeader>
            <div>
              <p className="label-kicker">Recent activity</p>
              <h2 className="mt-1 text-sm font-medium text-ink">Latest submissions and reviews</h2>
            </div>
          </CardHeader>
          <CardBody>
            {recent.length === 0 ? (
              <EmptyState title="No claims submitted yet." className="border-0 py-8" />
            ) : (
              <ul className="flex flex-col gap-2">
                {recent.map((claim) => (
                  <li key={claim.id}>
                    <Link
                      to={`/claim/${claim.id}`}
                      className="flex items-start gap-3 rounded-2xl px-2 py-2 hover:bg-elevated"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{claim.text}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <StatusBadge verdict={claim.verdict} />
                          <RiskBadge level={claim.riskLevel} />
                          <span className="font-mono text-[10px] text-faint">
                            <time dateTime={claim.updatedAt}>{formatRelative(claim.updatedAt)}</time>
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-3">
          <InsightCard
            label="Potential variants"
            value={stats.potentialDuplicates}
            note="Strong fingerprint matches at submission."
          />
          <InsightCard
            label="High-risk claims"
            value={stats.highRisk}
            note="Two or more observable risk signals."
          />
          <InsightCard
            label="Unverified claims"
            value={stats.unverified}
            note="Public, with an active-review warning."
          />
          <InsightCard
            label="Community participation"
            value={stats.communityVotes}
            note={
              stats.communityVotes === 0
                ? 'No community participation recorded yet.'
                : 'Supporting signal only — not an official verdict.'
            }
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'cyan' | 'mute' | 'red' | 'green' | 'orange' | 'ink'
}) {
  const toneClass = {
    cyan: 'text-[#EF3340]',
    mute: 'text-[#667085]',
    red: 'text-[#EF3340]',
    green: 'text-[#10B981]',
    orange: 'text-[#F59E0B]',
    ink: 'text-[#111111]',
  }[tone]

  return (
    <div className="glass-card px-4 py-3">
      <p className="label-kicker">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}

function Meter({
  label,
  value,
  max,
  tone,
}: {
  label: ReactNode
  value: number
  max: number
  tone: 'red' | 'orange' | 'green' | 'cyan'
}) {
  const bar = {
    red: 'bg-[#EF3340]',
    orange: 'bg-[#F59E0B]',
    green: 'bg-[#10B981]',
    cyan: 'bg-[#EF3340]',
  }[tone]

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate text-mute">{label}</span>
        <span className="font-mono text-mute">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}

function InsightCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="glass-card px-4 py-3">
      <p className="label-kicker">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-faint">{note}</p>
    </div>
  )
}
