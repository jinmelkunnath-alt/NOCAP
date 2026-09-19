import { useState } from 'react'
import { HelpCircle, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { CommunityConsensus, VoteType } from '../../types'
import { socialService } from '../../services/socialService'
import { cn } from '../../utils/cn'

interface VoteBarProps {
  claimId: string
  consensus: CommunityConsensus
  current: VoteType | null
}

const OPTIONS: Array<{ type: VoteType; label: string; icon: typeof ThumbsUp }> = [
  { type: 'agree', label: 'Agree', icon: ThumbsUp },
  { type: 'disagree', label: 'Disagree', icon: ThumbsDown },
  { type: 'unsure', label: 'Unsure', icon: HelpCircle },
]

export function VoteBar({ claimId, consensus, current }: VoteBarProps) {
  const [note, setNote] = useState<string | null>(null)
  const total = consensus.total
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))

  return (
    <div className="rounded-2xl border border-line/60 bg-slate-50/50 p-3.5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Community Sentiment
        </p>
        <span className="text-[10px] text-slate-400">
          {total} participant{total === 1 ? '' : 's'} · Advisory only
        </span>
      </div>

      {/* 3 Interaction Buttons */}
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon
          const count =
            option.type === 'agree'
              ? consensus.agree
              : option.type === 'disagree'
                ? consensus.disagree
                : consensus.unsure
          const selected = current === option.type
          return (
            <button
              key={option.type}
              type="button"
              aria-pressed={selected}
              aria-label={`${option.label} (${count})`}
              onClick={() => {
                socialService.castVote(claimId, option.type)
                setNote('Opinion recorded. Official verdicts are human reviewed.')
              }}
              className={cn(
                'group flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-medium transition-all duration-150 active:scale-98',
                selected
                  ? option.type === 'agree'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs font-semibold'
                    : option.type === 'disagree'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-2xs font-semibold'
                      : 'border-amber-500 bg-amber-50 text-amber-800 shadow-2xs font-semibold'
                  : 'border-line/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" aria-hidden="true" />
              <span>{option.label}</span>
              <span className="font-mono text-[10px] text-slate-400 ml-0.5">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Percentage Bar */}
      {total > 0 && (
        <div className="mt-3">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              style={{ width: `${pct(consensus.agree)}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Agree: ${pct(consensus.agree)}%`}
            />
            <div
              style={{ width: `${pct(consensus.disagree)}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Disagree: ${pct(consensus.disagree)}%`}
            />
            <div
              style={{ width: `${pct(consensus.unsure)}%` }}
              className="bg-amber-400 transition-all duration-500"
              title={`Unsure: ${pct(consensus.unsure)}%`}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="text-emerald-700 font-medium">{pct(consensus.agree)}% Agree</span>
            <span className="text-rose-700 font-medium">{pct(consensus.disagree)}% Disagree</span>
            <span className="text-amber-700 font-medium">{pct(consensus.unsure)}% Unsure</span>
          </div>
        </div>
      )}

      {note && (
        <p className="mt-2 text-[10px] text-emerald-700 font-medium animate-fade-in">
          {note}
        </p>
      )}
    </div>
  )
}
