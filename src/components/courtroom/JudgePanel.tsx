import { Scale, AlertCircle } from 'lucide-react'
import type { JudgeRuling } from '../../types'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { cn } from '../../utils/cn'

interface JudgePanelProps {
  ruling: JudgeRuling
}

const LEANING_TONE: Record<JudgeRuling['leaning'], string> = {
  'LEANING TRUE': 'border-[#10B981]/40 bg-[#D1FAE5] text-[#059669]',
  'LEANING FALSE': 'border-[#EF3340]/40 bg-[#FDE7E9] text-[#EF3340]',
  'POTENTIALLY MISLEADING': 'border-[#F59E0B]/40 bg-[#FEF3C7] text-[#D97706]',
  'INSUFFICIENT EVIDENCE': 'border-slate-200 bg-slate-100 text-slate-800',
}

export function JudgePanel({ ruling }: JudgePanelProps) {
  return (
    <Card className="border-[#EAEAEA] bg-white shadow-xs rounded-[20px]">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-[#EF3340]" />
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#EF3340]">
              ADVISORY AI ASSESSMENT
            </span>
            <h3 className="text-base font-bold text-[#111111]">AI Deliberation Leaning</h3>
          </div>
        </div>

        <span
          className={cn(
            'rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wider',
            LEANING_TONE[ruling.leaning],
          )}
        >
          {ruling.leaning}
        </span>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Advisory banner */}
        <div className="flex items-center gap-2 rounded-xl border border-[#EAEAEA] bg-[#F9FAFB] p-3 text-xs text-[#667085]">
          <AlertCircle className="h-4 w-4 text-[#EF3340] shrink-0" />
          <p>
            <strong className="font-semibold text-[#111111]">Advisory notice:</strong> The AI Judge is a deliberation workspace tool. Human verification remains authoritative.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#111111] font-semibold">
          {ruling.rationale}
        </p>

        <div className="grid gap-4 sm:grid-cols-3 border-t border-[#F0F0F0] pt-4">
          <div className="rounded-xl border border-[#10B981]/20 bg-[#D1FAE5]/30 p-3.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#059669]">
              Supporting Points
            </p>
            <ul className="mt-2 space-y-1.5">
              {ruling.supporting.map((line, index) => (
                <li key={index} className="text-xs text-slate-800 leading-relaxed">
                  &bull; {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#EF3340]/20 bg-[#FDE7E9]/40 p-3.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#EF3340]">
              Opposing / Concerns
            </p>
            <ul className="mt-2 space-y-1.5">
              {ruling.counterpoints.map((line, index) => (
                <li key={index} className="text-xs text-slate-800 leading-relaxed">
                  &bull; {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-3.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#667085]">
              Evidentiary Gaps
            </p>
            <ul className="mt-2 space-y-1.5">
              {ruling.evidenceGaps.map((line, index) => (
                <li key={index} className="text-xs text-[#667085] leading-relaxed">
                  &bull; {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
