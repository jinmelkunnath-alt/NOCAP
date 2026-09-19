import { Sparkles, MessageSquare, BarChart3, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react'
import type { CommunityAiAnalysis } from '../../types'
import { cn } from '../../utils/cn'

export function CommunityAiCard({
  analysis,
  isSynthesizing = false,
}: {
  analysis: CommunityAiAnalysis
  isSynthesizing?: boolean
}) {
  const isReal = analysis.label === 'REAL'
  const isFake = analysis.label === 'FAKE'

  const borderGlow = isReal
    ? 'border-emerald-300/80 bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/20'
    : isFake
      ? 'border-rose-300/80 bg-gradient-to-b from-rose-50/70 via-white to-rose-50/20'
      : 'border-amber-300/80 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/20'

  const badgeStyle = isReal
    ? 'bg-emerald-600 text-white'
    : isFake
      ? 'bg-rose-600 text-white'
      : 'bg-amber-600 text-white'

  const VerdictIcon = isReal ? CheckCircle2 : isFake ? ShieldAlert : HelpCircle

  if (isSynthesizing) {
    return (
      <aside className="glass-card float-up border-emerald-300/80 bg-emerald-50/50 p-6 text-center shadow-md">
        <Sparkles className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
        <p className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
          NO CAP AI Is Synthesizing Community Evidence...
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Aggregating weighted consensus, poll responses, and submitted arguments.
        </p>
      </aside>
    )
  }

  return (
    <aside className={cn('glass-card float-up relative overflow-hidden p-5 sm:p-6 shadow-md', borderGlow)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Overall AI Assessment · Community Synthesis
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line/80 bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {analysis.verification}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-sans text-sm font-bold tracking-wider uppercase shadow-2xs', badgeStyle)}>
            <VerdictIcon className="h-4 w-4" />
            {analysis.label}
          </span>
          <span className="font-mono text-xs font-semibold text-slate-700">
            {analysis.aiConfidence}% AI Confidence
          </span>
        </div>

        {/* Small supporting chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-line/80 px-2.5 py-1 text-[10px] font-medium text-slate-600 shadow-2xs">
            <MessageSquare className="h-3 w-3 text-slate-400" />
            {analysis.responseCount} responses
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-line/80 px-2.5 py-1 text-[10px] font-medium text-slate-600 shadow-2xs">
            <BarChart3 className="h-3 w-3 text-slate-400" />
            1 poll
          </span>
          <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            {analysis.uniqueUsers} contributors
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Why?</p>
        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
          {analysis.why}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-line/60 bg-white/60 p-2.5 text-[10px] leading-relaxed text-slate-500">
        <strong>Advisory standard:</strong> Community majority does not equal factual truth. This synthesis structures community findings for human verifiers.
      </div>
    </aside>
  )
}
