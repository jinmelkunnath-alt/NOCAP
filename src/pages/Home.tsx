import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Minus,
} from 'lucide-react'
import { RumourPostCard } from '../components/social/RumourPostCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSocial } from '../context/SocialProvider'
import { useClaims } from '../hooks/useClaims'
import type { Category, FeedTab } from '../types'
import { compareTrending, trendingScore } from '../utils/trending'
import { cn } from '../utils/cn'

interface HomePageProps {
  tab: FeedTab
}

const CATEGORY_TABS: string[] = [
  'For You',
  'Following',
  'Politics',
  'Technology',
  'Health',
  'Education',
  'Finance',
]

const EXTRA_CATEGORIES: Category[] = ['Campus', 'Entertainment', 'Other']

// Hardcoded reference items for high visual fidelity with dynamic fallback
const SEED_TRENDING_ITEMS = [
  { id: 'clm_001', label: 'LPU free laptops', count: '12.4K discussions', trend: 'up' },
  { id: 'clm_002', label: 'WhatsApp update', count: '8.1K discussions', trend: 'up' },
  { id: 'clm_003', label: 'Lemon water diabetes', count: '6.7K discussions', trend: 'down' },
  { id: 'clm_005', label: 'RBI bank balance', count: '5.9K discussions', trend: 'up' },
  { id: 'clm_007', label: '5G towers health risk', count: '4.3K discussions', trend: 'neutral' },
]

export function HomePage({ tab }: HomePageProps) {
  const { claims, loading, error } = useClaims()
  const social = useSocial()
  const [selectedPill, setSelectedPill] = useState<string>('For You')
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false)

  // Filter claims based on selected category pill or tab
  const visibleClaims = useMemo(() => {
    let list = [...claims]

    if (tab === 'user') {
      list = list.filter((item) => item.uploadType !== 'ai')
    } else if (tab === 'ai') {
      list = list.filter((item) => item.uploadType === 'ai')
    }

    if (selectedPill === 'Following') {
      list = list.filter(
        (item) => item.authorId && social.followingIds.has(item.authorId),
      )
    } else if (selectedPill !== 'For You') {
      list = list.filter((item) => item.category === selectedPill)
    }

    if (tab === 'trending' || selectedPill === 'For You') {
      return list.sort((a, b) =>
        compareTrending(a, b, (claim) =>
          trendingScore(claim, social.metricsFor(claim.id), social.engagement),
        ),
      )
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [claims, tab, selectedPill, social])

  // Resolve trending rail items with actual claims when possible
  const trendingList = useMemo(() => {
    return SEED_TRENDING_ITEMS.map((item) => {
      // Find matching claim in dataset
      const matched = claims.find(
        (c) =>
          c.id === item.id ||
          c.text.toLowerCase().includes(item.label.toLowerCase()),
      )
      return {
        ...item,
        claimId: matched?.id ?? claims[0]?.id ?? 'clm_001',
      }
    })
  }, [claims])

  const byId = useMemo(() => new Map(claims.map((item) => [item.id, item])), [claims])

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Center Column: Hero Banner + Filter Pills + Post Feed */}
      <div className="min-w-0 flex flex-col gap-6">
        {/* Community Feed Hero Banner */}
        <div className="relative overflow-hidden rounded-[24px] bg-white border border-[#EAEAEA] p-6 sm:p-8 shadow-xs">
          {/* Subtle warm glow in background */}
          <div className="absolute right-0 top-0 h-64 w-64 bg-radial from-[#FDE7E9]/70 via-[#FFF5F5]/30 to-transparent pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] text-[#EF3340] uppercase">
                <span className="inline-block w-4 h-0.5 bg-[#EF3340]" />
                COMMUNITY FEED
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-[#111111] leading-[1.2]">
                Curious minds <br className="hidden sm:inline" />
                build a <span className="text-[#EF3340]">safer tomorrow.</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#667085]">
                Real questions. Real discussions. Real people.
              </p>
            </div>

            {/* Classical bust illustration / emblem graphic */}
            <div className="relative shrink-0 flex items-center justify-center self-center md:self-auto">
              <div className="relative h-32 w-32 sm:h-36 sm:w-36 flex items-center justify-center">
                {/* Concentric red circles */}
                <div className="absolute inset-0 rounded-full border border-[#EF3340]/20 animate-pulse" />
                <div className="absolute inset-3 rounded-full border border-[#EF3340]/30" />
                <div className="absolute inset-6 rounded-full border border-[#EF3340]/15" />

                {/* Classical Lady Justice Statue Emblem */}
                <img
                  src="/justice-statue.png"
                  alt="TruthLens Lady Justice"
                  className="h-28 w-auto object-contain drop-shadow-md select-none pointer-events-none"
                />


                {/* Editorial Words */}
                <div className="absolute -top-1 -right-2 text-[8px] font-mono font-bold tracking-widest text-[#EF3340] uppercase bg-white/90 px-1.5 py-0.5 rounded-full border border-[#EF3340]/20 shadow-2xs">
                  QUESTION
                </div>
                <div className="absolute top-1/2 -right-4 -translate-y-1/2 text-[8px] font-mono font-bold tracking-widest text-[#667085] uppercase bg-white/90 px-1 py-0.5 rounded-full border border-[#EAEAEA]">
                  DISCUSS
                </div>
                <div className="absolute -bottom-1 -left-2 text-[8px] font-mono font-bold tracking-widest text-[#EF3340] uppercase bg-white/90 px-1.5 py-0.5 rounded-full border border-[#EF3340]/20 shadow-2xs">
                  VERIFY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((pill) => {
            const isActive = selectedPill === pill
            return (
              <button
                key={pill}
                type="button"
                onClick={() => setSelectedPill(pill)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-[#EF3340] text-white shadow-xs'
                    : 'bg-[#F4F4F4] text-[#555555] hover:bg-[#EAEAEA] hover:text-[#111111]',
                )}
              >
                {pill}
              </button>
            )
          })}

          {/* More dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMoreDropdownOpen((prev) => !prev)}
              className={cn(
                'flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150',
                EXTRA_CATEGORIES.includes(selectedPill as Category)
                  ? 'bg-[#EF3340] text-white'
                  : 'bg-[#F4F4F4] text-[#555555] hover:bg-[#EAEAEA]',
              )}
            >
              <span>{EXTRA_CATEGORIES.includes(selectedPill as Category) ? selectedPill : 'More'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {moreDropdownOpen && (
              <div className="absolute left-0 mt-1 w-36 rounded-xl border border-[#EAEAEA] bg-white p-1.5 shadow-lg z-20">
                {EXTRA_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedPill(cat)
                      setMoreDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      selectedPill === cat
                        ? 'bg-[#FDE7E9] text-[#EF3340] font-bold'
                        : 'text-[#111111] hover:bg-slate-50',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Post Feed List */}
        <section aria-label="Community Rumours Feed" className="flex flex-col gap-4">
          {loading && <LoadingState label="Loading community rumours" />}
          {error && <ErrorState message={error} />}
          {!loading && !error && visibleClaims.length === 0 && (
            <EmptyState
              title="No rumours found in this filter."
              description="Be the first to bring a claim to the community."
              action={
                <Button to="/submit" size="sm">
                  Post a Rumour
                </Button>
              }
            />
          )}
          {visibleClaims.map((claim) => (
            <RumourPostCard
              key={claim.id}
              claim={claim}
              author={claim.authorId ? social.userById.get(claim.authorId) : undefined}
              relatedClaim={claim.matchedClaimId ? (byId.get(claim.matchedClaimId) ?? null) : null}
            />
          ))}
        </section>
      </div>

      {/* Right Rail: Promo Banner + Trending Now + Editorial Quote */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-6">
        {/* Card 1: TruthLens Promo Banner */}
        <div className="relative overflow-hidden rounded-[22px] bg-white border border-[#EAEAEA] p-6 shadow-xs">
          {/* Subtle warm glow in top-right corner */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-[#FDE7E9] via-[#FEE2E2]/40 to-transparent pointer-events-none" />

          <div className="relative">
            <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-[#111111] uppercase">
              NO <span className="text-[#EF3340]">CAP</span>
            </span>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#111111] leading-tight">
              A more <br />
              informed <br />
              <span className="text-[#EF3340]">tomorrow.</span>
            </h2>

            <p className="mt-2.5 text-xs text-[#667085] leading-relaxed max-w-[200px]">
              Check before you believe. <br />
              Be part of a safer society.
            </p>

            <div className="mt-5 flex justify-end">
              <Link
                to="/"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EF3340] text-white shadow-sm hover:bg-[#D92D3A] transition-transform hover:scale-105"
                aria-label="Check a claim with NO CAP AI"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2: Trending Now */}
        <div className="rounded-[22px] bg-white border border-[#EAEAEA] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111111]">Trending Now</h2>
            <Link
              to="/trending"
              className="flex items-center gap-1 text-xs font-semibold text-[#EF3340] hover:underline"
            >
              <span>See all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {trendingList.map((item, index) => (
              <Link
                key={item.label}
                to={`/claim/${item.claimId}`}
                className="group flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Number pill */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FDE7E9] text-xs font-bold text-[#EF3340]">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111111] truncate group-hover:text-[#EF3340] transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-[#667085]">{item.count}</p>
                  </div>
                </div>

                {/* Trend direction icon */}
                <div className="shrink-0">
                  {item.trend === 'up' && (
                    <ArrowUp className="h-4 w-4 text-[#EF3340]" />
                  )}
                  {item.trend === 'down' && (
                    <ArrowDown className="h-4 w-4 text-[#EF3340]" />
                  )}
                  {item.trend === 'neutral' && (
                    <Minus className="h-4 w-4 text-[#9CA3AF]" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Card 3: Editorial Quote Card */}
        <div className="relative overflow-hidden rounded-[22px] bg-white border border-[#EAEAEA] p-6 shadow-xs">
          {/* Subtle red tint glow in bottom right */}
          <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-tl from-[#FDE7E9]/80 to-transparent pointer-events-none" />

          <div className="relative border-l-2 border-[#EF3340] pl-4 py-1">
            <blockquote className="font-serif italic text-lg sm:text-xl text-[#111111] leading-snug">
              &ldquo;Doubt less. <br />
              Discover more.&rdquo;
            </blockquote>
            <cite className="mt-2.5 block text-xs font-sans not-italic text-[#667085]">
              &mdash; NO CAP
            </cite>
          </div>
        </div>
      </aside>
    </div>
  )
}
