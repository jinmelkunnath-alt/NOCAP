import { useState, useEffect } from 'react'
import { Check, X, HelpCircle, Users } from 'lucide-react'
import {
  communityPollService,
  type CommunityVoteOption,
  type CommunityPollStats,
} from '../../services/communityPollService'
import { cn } from '../../utils/cn'

interface CommunityPollProps {
  claimId: string
  title?: string
  compact?: boolean
  className?: string
}

export function CommunityPoll({
  claimId,
  title = 'WHAT DO YOU THINK?',
  compact = false,
  className,
}: CommunityPollProps) {
  const [stats, setStats] = useState<CommunityPollStats>(() =>
    communityPollService.getPollStats(claimId),
  )
  const [justVoted, setJustVoted] = useState(false)

  useEffect(() => {
    setStats(communityPollService.getPollStats(claimId))

    function handleSocialUpdate() {
      setStats(communityPollService.getPollStats(claimId))
    }

    window.addEventListener('truthlens:social-changed', handleSocialUpdate)
    return () => window.removeEventListener('truthlens:social-changed', handleSocialUpdate)
  }, [claimId])

  function handleVote(option: CommunityVoteOption) {
    const updated = communityPollService.castVote(claimId, option)
    setStats(updated)
    setJustVoted(true)
    setTimeout(() => setJustVoted(false), 3000)
  }

  const hasVoted = Boolean(stats.myVote)
  const showResults = hasVoted || stats.totalVotes > 0

  const options: Array<{
    id: CommunityVoteOption
    label: string
    icon: typeof Check
    pct: number
    count: number
    colorClasses: {
      idle: string
      selected: string
      bar: string
      text: string
    }
  }> = [
    {
      id: 'Real',
      label: 'REAL',
      icon: Check,
      pct: stats.percentages.real,
      count: stats.counts.real,
      colorClasses: {
        idle: 'border-[#EAEAEA] bg-white text-[#111111] hover:border-[#10B981]/50 hover:bg-[#ECFDF5]/50',
        selected: 'border-[#10B981] bg-[#ECFDF5] text-[#065F46] ring-2 ring-[#10B981]/20 font-bold',
        bar: 'bg-[#10B981]/30',
        text: 'text-[#059669]',
      },
    },
    {
      id: 'Fake',
      label: 'FAKE',
      icon: X,
      pct: stats.percentages.fake,
      count: stats.counts.fake,
      colorClasses: {
        idle: 'border-[#EAEAEA] bg-white text-[#111111] hover:border-[#EF3340]/50 hover:bg-[#FDE7E9]/50',
        selected: 'border-[#EF3340] bg-[#FDE7E9] text-[#991B1B] ring-2 ring-[#EF3340]/20 font-bold',
        bar: 'bg-[#EF3340]/30',
        text: 'text-[#EF3340]',
      },
    },
    {
      id: 'Not Sure',
      label: 'NOT SURE',
      icon: HelpCircle,
      pct: stats.percentages.notSure,
      count: stats.counts.notSure,
      colorClasses: {
        idle: 'border-[#EAEAEA] bg-white text-[#111111] hover:border-[#F59E0B]/50 hover:bg-[#FEF3C7]/50',
        selected: 'border-[#F59E0B] bg-[#FEF3C7] text-[#92400E] ring-2 ring-[#F59E0B]/20 font-bold',
        bar: 'bg-[#F59E0B]/30',
        text: 'text-[#D97706]',
      },
    },
  ]

  const voteLabel =
    stats.totalVotes === 0
      ? 'Be the first to vote.'
      : stats.totalVotes === 1
        ? '1 vote'
        : `${stats.totalVotes} votes`

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] p-4 sm:p-5 transition-all',
        className,
      )}
    >
      {/* Poll Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEAEA] pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#EF3340]" aria-hidden="true" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {justVoted && (
            <span className="animate-fade-in text-[10px] font-semibold text-[#10B981]">
              Your vote has been recorded
            </span>
          )}
          <span className="font-mono text-[11px] font-medium text-[#667085]">{voteLabel}</span>
        </div>
      </div>

      {/* 3 Poll Options */}
      <div className={cn('mt-3 grid gap-2.5', compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3')}>
        {options.map((opt) => {
          const isSelected = stats.myVote === opt.id
          const Icon = opt.icon

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVote(opt.id)}
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer active:scale-98',
                isSelected ? opt.colorClasses.selected : opt.colorClasses.idle,
              )}
            >
              {/* Background Percentage Progress Fill */}
              {showResults && (
                <div
                  className={cn(
                    'absolute bottom-0 left-0 top-0 transition-all duration-500 ease-out -z-0 pointer-events-none',
                    opt.colorClasses.bar,
                  )}
                  style={{ width: `${opt.pct}%` }}
                />
              )}

              {/* Option Top Row: Label & Icon */}
              <div className="relative z-10 flex items-center justify-between gap-1 w-full">
                <span className="text-xs font-bold tracking-wide">{opt.label}</span>
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-xs transition-transform group-hover:scale-110',
                    isSelected ? 'bg-white shadow-2xs' : 'opacity-60',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>

              {/* Option Bottom Row: Percentage & Subtext */}
              {showResults ? (
                <div className="relative z-10 mt-2 flex items-baseline justify-between gap-1 w-full">
                  <span className={cn('font-mono text-base sm:text-lg font-black', opt.colorClasses.text)}>
                    {opt.pct}%
                  </span>
                  <span className="text-[10px] text-[#667085] font-mono">{opt.count}</span>
                </div>
              ) : (
                <div className="relative z-10 mt-2 text-[10px] text-[#9CA3AF]">Tap to vote</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Mandatory Disclaimer */}
      <p className="mt-3 text-center text-[10px] leading-relaxed text-[#9CA3AF]">
        Community opinion is not official verification.
      </p>
    </div>
  )
}
