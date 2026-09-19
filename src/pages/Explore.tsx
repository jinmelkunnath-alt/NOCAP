import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Flame, Search, X } from 'lucide-react'
import { RumourPostCard } from '../components/social/RumourPostCard'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSocial } from '../context/SocialProvider'
import { useClaims } from '../hooks/useClaims'
import { socialService } from '../services/socialService'
import { fingerprintService } from '../services/fingerprintService'
import { StatusBadge } from '../components/badges/StatusBadge'
import { RiskBadge } from '../components/badges/RiskBadge'
import type { Claim } from '../types'
import { trendingScore } from '../utils/trending'
import { cn } from '../utils/cn'

type ExploreTab = 'for-you' | 'ai' | 'user'

const TABS: Array<{ id: ExploreTab; label: string }> = [
  { id: 'for-you', label: 'For You' },
  { id: 'ai', label: 'AI Rumours' },
  { id: 'user', label: 'User Rumours' },
]

const CATEGORY_PILLS = [
  'All',
  'Trending',
  'Politics',
  'Sports',
  'Health',
  'Finance',
  'Technology',
  'Education',
  'Entertainment',
  'Other',
]

const SECTIONS: Array<{ id: string; label: string; match: (claim: Claim) => boolean }> = [
  { id: 'Trending', label: 'Trending Community Attention', match: () => true },
  { id: 'Politics', label: 'Politics & Governance', match: (claim) => claim.category === 'Politics' },
  {
    id: 'Sports',
    label: 'Sports & Athletics',
    match: (claim) => claim.category === 'Other' && /sport|cricket|match/i.test(claim.text),
  },
  { id: 'Health', label: 'Health & Medicine', match: (claim) => claim.category === 'Health' },
  { id: 'Finance', label: 'Finance & Banking', match: (claim) => claim.category === 'Finance' },
  { id: 'Technology', label: 'Technology & AI', match: (claim) => claim.category === 'Technology' },
  {
    id: 'Entertainment',
    label: 'Entertainment & Culture',
    match: (claim) => claim.category === 'Entertainment',
  },
  { id: 'Education', label: 'Education & Campus', match: (claim) => claim.category === 'Campus' },
  { id: 'Other', label: 'General & Other Claims', match: (claim) => claim.category === 'Other' },
]

function originOf(claim: Claim): 'AI' | 'USER' {
  return claim.originType === 'AI' ? 'AI' : 'USER'
}

export function ExplorePage() {
  const { claims, loading } = useClaims()
  const social = useSocial()
  const [tab, setTab] = useState<ExploreTab>('for-you')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')

  const pool = useMemo(() => {
    let list = claims
    if (tab === 'ai') list = claims.filter((item) => originOf(item) === 'AI')
    if (tab === 'user') list = claims.filter((item) => originOf(item) === 'USER')

    if (selectedCategory !== 'All' && selectedCategory !== 'Trending') {
      if (selectedCategory === 'Education') {
        list = list.filter((item) => item.category === 'Campus')
      } else if (selectedCategory === 'Sports') {
        list = list.filter(
          (item) => item.category === 'Other' && /sport|cricket|match/i.test(item.text),
        )
      } else {
        list = list.filter((item) => item.category.toLowerCase() === selectedCategory.toLowerCase())
      }
    }
    return list
  }, [claims, tab, selectedCategory])

  const ranked = useMemo(() => {
    return [...pool].sort(
      (a, b) =>
        trendingScore(b, social.metricsFor(b.id), social.engagement) -
        trendingScore(a, social.metricsFor(a.id), social.engagement),
    )
  }, [pool, social])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return pool.filter((claim) => {
      const author = claim.authorId ? social.userById.get(claim.authorId) : undefined
      const fp = fingerprintService.fingerprint(claim.text)
      return (
        claim.text.toLowerCase().includes(q) ||
        claim.id.toLowerCase().includes(q) ||
        claim.category.toLowerCase().includes(q) ||
        claim.platform.toLowerCase().includes(q) ||
        claim.verdict.toLowerCase().includes(q) ||
        fp.includes(q.replace(/\s+/g, ' ')) ||
        (author?.username.toLowerCase().includes(q.replace(/^@/, '')) ?? false) ||
        (author?.displayName.toLowerCase().includes(q) ?? false)
      )
    })
  }, [pool, query, social.userById])

  const byId = useMemo(() => new Map(claims.map((item) => [item.id, item])), [claims])

  function runSearch(value: string) {
    const trimmed = value.trim()
    setQuery(trimmed)
    if (trimmed) socialService.rememberSearch(trimmed)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    runSearch(draft)
  }

  function clearSearch() {
    setDraft('')
    setQuery('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#EF3340]/20 bg-[#FDE7E9] px-3 py-1 text-[#EF3340]">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
            DISCOVERY HUB
          </span>
        </div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
          Explore Rumours
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#667085]">
          Attention is not truth. Discover emerging claims, check patterns, and examine community signals.
        </p>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-4 w-4 text-[#9CA3AF]" aria-hidden="true" />
          <input
            id="explore-search"
            type="text"
            placeholder="Search rumours, claim IDs, topics..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-2xl border border-[#EAEAEA] bg-white py-3 pl-11 pr-24 text-sm text-[#111111] shadow-xs placeholder:text-[#9CA3AF] focus:border-[#EF3340] focus:outline-hidden focus:ring-1 focus:ring-[#EF3340]"
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            {draft && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 text-[#9CA3AF] hover:text-[#111111]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="rounded-xl bg-[#EF3340] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#D92D3A] transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Primary Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F0F0F0] pb-3">
        <div className="flex rounded-full bg-[#F4F4F4] p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150',
                tab === item.id
                  ? 'bg-white text-[#EF3340] shadow-xs'
                  : 'text-[#667085] hover:text-[#111111]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-[#9CA3AF]">
          {pool.length} recorded claims
        </span>
      </div>

      {/* Category Pills (Horizontal strip) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_PILLS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150',
              selectedCategory === cat
                ? 'bg-[#EF3340] text-white shadow-xs'
                : 'bg-[#F4F4F4] text-[#555555] hover:bg-[#EAEAEA] hover:text-[#111111]',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Results View */}
      {query ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#111111]">
              Results for &ldquo;{query}&rdquo;
            </h2>
            <button
              type="button"
              onClick={clearSearch}
              className="text-xs font-semibold text-[#EF3340] hover:underline"
            >
              Clear filter
            </button>
          </div>

          {loading && <LoadingState label="Searching indexed claims" />}
          {!loading && results.length === 0 && (
            <EmptyState
              title="No matches found"
              description="Try another keyword, claim fingerprint, or author ID."
            />
          )}
          <div className="flex flex-col gap-4">
            {results.map((claim) => (
              <RumourPostCard
                key={claim.id}
                claim={claim}
                author={claim.authorId ? social.userById.get(claim.authorId) : undefined}
                relatedClaim={claim.matchedClaimId ? (byId.get(claim.matchedClaimId) ?? null) : null}
              />
            ))}
          </div>
        </section>
      ) : tab === 'for-you' && selectedCategory === 'All' ? (
        /* Curated Sectional Streams */
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const items =
              section.id === 'Trending'
                ? ranked.slice(0, 8)
                : ranked.filter(section.match).slice(0, 8)
            if (items.length === 0) return null

            return (
              <section key={section.id} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    {section.id === 'Trending' && <Flame className="h-4 w-4 text-[#EF3340]" />}
                    <h2 className="text-base font-bold text-[#111111] tracking-tight">
                      {section.label}
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-[#9CA3AF]">{items.length} records</span>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                  {items.map((claim) => (
                    <ExploreCard key={claim.id} claim={claim} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        /* Grid View for specific tabs or categories */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title={tab === 'ai' ? 'No AI Rumours in this category' : 'No User Rumours in this category'}
                description="Rumours will appear here as community checks accumulate."
              />
            </div>
          ) : (
            ranked.map((claim) => <ExploreCard key={claim.id} claim={claim} wide />)
          )}
        </div>
      )}
    </div>
  )
}

function ExploreCard({ claim, wide = false }: { claim: Claim; wide?: boolean }) {
  const isAi = claim.originType === 'AI'
  return (
    <Link
      to={`/claim/${claim.id}`}
      className={cn(
        'group flex flex-col justify-between rounded-[20px] bg-white border border-[#EAEAEA] p-5 shadow-xs hover:border-[#DFDFDF] hover:shadow-sm transition-all duration-150',
        wide ? 'w-full' : 'w-72 sm:w-80 shrink-0',
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
              isAi ? 'bg-[#FDE7E9] text-[#EF3340]' : 'bg-[#F4F4F4] text-[#555555]',
            )}
          >
            {isAi ? '✦ AI Rumour' : 'User Rumour'}
          </span>
          <StatusBadge verdict={claim.verdict} />
        </div>

        <p className="mt-3 line-clamp-3 text-sm font-bold leading-snug text-[#111111] group-hover:text-[#EF3340] transition-colors">
          {claim.text}
        </p>
      </div>

      <div className="mt-4 border-t border-[#F0F0F0] pt-3">
        <div className="flex items-center justify-between">
          <RiskBadge level={claim.riskLevel} score={claim.riskScore} />
          <span className="text-[10px] font-mono text-[#9CA3AF]">
            {claim.category} &bull; {claim.platform}
          </span>
        </div>
      </div>
    </Link>
  )
}
