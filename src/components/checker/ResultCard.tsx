import { useState, useEffect } from 'react'
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  Globe,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react'
import type { AiAssessment } from '../../types'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { ConfidenceCounter } from './ConfidenceCounter'
import { CommunityPoll } from '../social/CommunityPoll'
import { HighRiskEscalation } from './HighRiskEscalation'
import { reportingStorage } from '../../services/reportingStorage'

export function ResultCard({
  assessment,
  original,
  claimId,
  onPost,
}: {
  assessment: AiAssessment
  original: string
  claimId?: string
  onPost: () => void
}) {
  const [reportCount, setReportCount] = useState(0)
  const [showReasoning, setShowReasoning] = useState(true)

  useEffect(() => {
    if (claimId || assessment.matchedClaimId) {
      const targetId = claimId || assessment.matchedClaimId || ''
      const reports = reportingStorage.getCommunityReports().filter((r) => r.claimId === targetId)
      const uniqueReporters = new Set(reports.map((r) => r.reporterId))
      setReportCount(uniqueReporters.size)
    }
  }, [claimId, assessment.matchedClaimId])

  const isReal = assessment.label === 'REAL'
  const isFake = assessment.label === 'FAKE'

  const borderGlow = isReal
    ? 'border-[#10B981]/30 bg-white'
    : isFake
      ? 'border-[#EF3340]/30 bg-white'
      : 'border-[#F59E0B]/30 bg-white'

  const verdictBadgeStyle = isReal
    ? 'bg-[#10B981] text-white shadow-emerald-500/20'
    : isFake
      ? 'bg-[#EF3340] text-white shadow-[#EF3340]/20'
      : 'bg-[#F59E0B] text-white shadow-amber-500/20'

  const VerdictIcon = isReal ? CheckCircle2 : isFake ? ShieldAlert : HelpCircle

  const hasSources = assessment.sources && assessment.sources.length > 0
  const hasEvidence = assessment.evidence && assessment.evidence.length > 0
  const hasUncertainties = assessment.uncertainties && assessment.uncertainties.length > 0
  const reasoningContent = assessment.reasoningText || assessment.thinking || assessment.why

  const pollTargetId = claimId || assessment.matchedClaimId || `chk_${encodeURIComponent(original.slice(0, 32))}`

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-[26px] border p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all animate-fade-in',
        borderGlow,
      )}
    >
      {/* 1. Header: AI Assessment kicker & verification tags */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] pb-4">
        <div className="flex items-center gap-2 animate-slide-in-right">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE7E9] text-[#EF3340]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-xs font-bold tracking-[0.22em] text-[#111111] uppercase">
            AI ASSESSMENT
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {assessment.usedWebSearch && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#10B981]/30 bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold text-[#059669]">
              <Globe className="h-3 w-3" />
              Live Web Verified
            </span>
          )}
          <span className="rounded-full border border-[#EAEAEA] bg-[#F9FAFB] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#111111]">
            {assessment.verification}
          </span>
          <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[#667085]">
            {assessment.found ? 'Stored Match' : 'Novel Claim'}
          </span>
        </div>
      </div>

      {/* 2. Main Verdict & Confidence Counter Animation */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <span
            className={cn(
              'inline-flex items-center gap-2.5 rounded-2xl px-5 py-2.5 font-sans text-xl sm:text-2xl font-black tracking-wider uppercase shadow-md transition-transform duration-300 hover:scale-102',
              verdictBadgeStyle,
            )}
          >
            <VerdictIcon className="h-6 w-6" aria-hidden="true" />
            {assessment.label}
          </span>
          <p className="mt-2 text-xs font-semibold tracking-wide text-[#667085]">
            PRELIMINARY ADVISORY ASSESSMENT
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="flex items-baseline gap-1 sm:justify-end">
            <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111111]">
              <ConfidenceCounter target={assessment.aiConfidence} />
            </span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
            AI confidence
          </p>
        </div>
      </div>

      {/* 3. Short 2-3 sentence explanation */}
      <div className="mt-6 rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">
          Explanation
        </p>
        <p className="mt-2 text-sm sm:text-base leading-relaxed font-semibold text-[#111111]">
          {assessment.why}
        </p>
        {assessment.evidenceNote && !hasSources && (
          <p className="mt-2 text-xs leading-relaxed text-[#667085] italic">
            Evidence note: {assessment.evidenceNote}
          </p>
        )}
      </div>

      {/* 4. AI Reasoning & Thinking Process Box */}
      {reasoningContent && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-2xs">
          <button
            type="button"
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex w-full items-center justify-between border-b border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3 text-left transition-colors hover:bg-[#F5F5F5] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#EF3340]/10 text-[#EF3340]">
                <Brain className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
                AI REASONING &amp; THINKING PROCESS
              </span>
              {assessment.meta?.reasoningTokens && (
                <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[10px] font-mono font-medium text-[#4B5563]">
                  {assessment.meta.reasoningTokens} tokens
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#667085]">
              <span className="text-[11px] font-medium">{showReasoning ? 'Hide' : 'Show analysis'}</span>
              {showReasoning ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {showReasoning && (
            <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm leading-relaxed text-[#333333] space-y-3">
              {assessment.reasoningSteps && assessment.reasoningSteps.length > 0 ? (
                <div className="space-y-2">
                  {assessment.reasoningSteps.map((step, idx) => (
                    <div key={idx} className="rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] p-3">
                      <p className="font-medium text-[#111111]">{step}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] p-3.5 font-mono text-xs text-[#222222] whitespace-pre-line leading-relaxed">
                  {reasoningContent}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F5F5F5] pt-3 text-[10px] text-[#888888] font-mono">
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-[#EF3340]" />
                  Engine: {assessment.meta?.modelUsed || 'NO CAP Reasoning Engine'}
                </span>
                {assessment.meta?.durationMs && (
                  <span>Latency: {assessment.meta.durationMs}ms</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Live Sources Checked (if available) */}
      {hasSources && (
        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111]">
            <Globe className="h-3.5 w-3.5 text-[#EF3340]" />
            <span>Sources checked</span>
          </div>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {assessment.sources!.map((src, idx) => (
              <a
                key={`${src.url}-${idx}`}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-2 rounded-xl border border-[#EAEAEA] bg-white p-3 text-xs transition-all hover:border-[#EF3340]/40 hover:bg-[#FAFAFA]"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#111111] line-clamp-1 group-hover:text-[#EF3340] transition-colors">
                    {src.title}
                  </p>
                  <p className="text-[10px] text-[#667085] truncate mt-0.5">{src.domain}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF] group-hover:text-[#EF3340] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 6. Supporting Evidence / Signals */}
      {hasEvidence && (
        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111]">
            <Layers className="h-3.5 w-3.5 text-[#667085]" />
            <span>Observed Evidence Signals</span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {assessment.evidence!.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[#555555]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EF3340] mt-1.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Uncertainties (if any) */}
      {hasUncertainties && (
        <div className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-amber-900">
          <p className="font-bold uppercase tracking-wider text-[10px] text-amber-700 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Uncertainties &amp; Context
          </p>
          <ul className="mt-1.5 space-y-1 list-disc list-inside">
            {assessment.uncertainties!.map((u, idx) => (
              <li key={idx} className="text-[11px] leading-relaxed">
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 8. Community Poll: Real / Fake / Not Sure */}
      <div className="mt-6">
        <CommunityPoll
          claimId={pollTargetId}
          title="COMMUNITY CHECK &bull; WHAT DO YOU THINK?"
        />
      </div>

      {/* 9. Deterministic High-Risk Escalation / Cyber Crime Action (shows if High Risk or Confidence < 50%) */}
      <div className="mt-5">
        <HighRiskEscalation
          riskLevel={assessment.riskLevel}
          riskFlags={assessment.riskFlags}
          reportCount={reportCount}
          confidence={assessment.aiConfidence}
        />
      </div>

      {/* Checked original wording */}
      <div className="mt-5 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
          Checked wording
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-[#111111] font-mono">
          &ldquo;{original}&rdquo;
        </p>
      </div>

      {/* Action CTA buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onPost}
            className="inline-flex items-center gap-2 rounded-full bg-[#EF3340] px-6 py-2.5 text-xs font-bold tracking-wide text-white shadow-xs transition-all duration-150 hover:bg-[#D92D3A] active:scale-98 cursor-pointer"
          >
            Post to Community
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {assessment.matchedClaimId && (
            <Button
              to={`/claim/${assessment.matchedClaimId}`}
              variant="secondary"
              className="text-xs rounded-full"
            >
              Open Matched Record
            </Button>
          )}
        </div>

        {assessment.meta?.modelUsed && (
          <span className="text-[10px] font-mono text-[#9CA3AF]">
            Model: {assessment.meta.modelUsed}
          </span>
        )}
      </div>
    </article>
  )
}
