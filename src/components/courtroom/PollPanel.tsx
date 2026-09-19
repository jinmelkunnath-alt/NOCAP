import { useState } from 'react'
import { BarChart3, CheckCircle2, Sparkles, Trophy } from 'lucide-react'
import { courtroomService } from '../../services/courtroomService'
import { communityAnalysisService } from '../../services/communityAnalysisService'
import type { ClaimPoll, PollVote } from '../../types'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

interface PollPanelProps {
  claimId: string
  poll: ClaimPoll | null
  votes: PollVote[]
  myVote: PollVote | null
  isAuthor: boolean
  onSynthesizeRequested?: () => void
}

export function PollPanel({
  claimId,
  poll,
  votes,
  myVote,
  isAuthor,
  onSynthesizeRequested,
}: PollPanelProps) {
  const [synthesizing, setSynthesizing] = useState(false)
  const analysisProgress = communityAnalysisService.progress(claimId)
  const existingAnalysis = communityAnalysisService.forClaim(claimId)

  if (!poll) {
    return (
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Community Pulse Poll
            </span>
            <h3 className="mt-1 text-base font-bold text-slate-900">Community sentiment survey</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Open a public pulse check for this claim. Polls gauge community intuition, not official proof.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => courtroomService.createPoll(claimId)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isAuthor ? 'Create Poll' : 'Open Community Poll'}
          </Button>
        </div>
      </div>
    )
  }

  const counts = poll.options.map(
    (_, index) => votes.filter((item) => item.optionIndex === index).length,
  )
  const total = votes.length

  const thresholdReached = total >= 3 || analysisProgress.ready

  function handleTriggerSynthesis() {
    setSynthesizing(true)
    setTimeout(() => {
      communityAnalysisService.maybeAnalyze(claimId)
      setSynthesizing(false)
      if (onSynthesizeRequested) onSynthesizeRequested()
    }, 900)
  }

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Community Poll
            </span>
          </div>
          <h3 className="mt-1 text-base font-bold text-slate-900">{poll.question}</h3>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-mono font-medium text-slate-600">
          {total} vote{total === 1 ? '' : 's'} recorded
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {poll.options.map((option, index) => {
          const selected = myVote?.optionIndex === index
          const count = counts[index] ?? 0
          const pct = total === 0 ? 0 : Math.round((count / total) * 100)

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => courtroomService.castPollVote(poll.id, index)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.99]',
                selected
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-line/80 bg-white/70 hover:border-slate-300 hover:bg-white',
              )}
            >
              {/* Background progress fill */}
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500/10 transition-all duration-500"
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selected && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                  <span className={cn('text-sm font-medium', selected ? 'text-emerald-950 font-semibold' : 'text-slate-800')}>
                    {option}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">{count}</span>
                  <span className={cn('font-bold', selected ? 'text-emerald-700' : 'text-slate-700')}>
                    {pct}%
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Threshold reached & AI Synthesis transition */}
      {thresholdReached && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Community evidence threshold reached
                </p>
                <p className="text-[11px] text-emerald-700">
                  Sufficient signal collected to generate an AI synthesis.
                </p>
              </div>
            </div>

            {!existingAnalysis && (
              <Button
                type="button"
                size="sm"
                onClick={handleTriggerSynthesis}
                disabled={synthesizing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {synthesizing ? 'Synthesizing...' : 'Synthesize with AI'}
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="mt-3 text-center text-[10px] text-slate-400">
        Poll results are advisory community signals. NO CAP official verdicts are certified by reviewers.
      </p>
    </div>
  )
}
