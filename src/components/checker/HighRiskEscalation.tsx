import { useState } from 'react'
import { AlertTriangle, ExternalLink, ShieldAlert, Flag, X } from 'lucide-react'
import { cn } from '../../utils/cn'

export const REPORT_ESCALATION_THRESHOLD = 3
export const CYBER_CRIME_PORTAL_URL = 'https://cybercrime.gov.in/Webform/Accept.aspx'

interface HighRiskEscalationProps {
  riskLevel?: string
  riskFlags?: string[]
  reportCount?: number
  confidence?: number
  className?: string
}

export function HighRiskEscalation({
  riskLevel,
  riskFlags = [],
  reportCount = 0,
  confidence,
  className,
}: HighRiskEscalationProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const isHighRisk = riskLevel === 'High'
  const isReportEscalated = reportCount >= REPORT_ESCALATION_THRESHOLD
  const isLowConfidence = typeof confidence === 'number' && confidence < 50

  // Render when deterministic risk is High, multiple reports threshold reached, or confidence < 50%
  if (!isHighRisk && !isReportEscalated && !isLowConfidence) {
    return null
  }

  function handleProceed() {
    setShowConfirm(false)
    window.open(CYBER_CRIME_PORTAL_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <aside
        className={cn(
          'relative overflow-hidden rounded-[22px] border border-[#EF3340]/40 bg-[#FFF5F6] p-5 shadow-xs transition-all',
          className,
        )}
        aria-label="High Risk Escalation Notice"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDE7E9] text-[#EF3340] shadow-2xs">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-wider text-[#EF3340] flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {isHighRisk
                  ? 'HIGH RISK CLAIM'
                  : isReportEscalated
                    ? 'COMMUNITY ESCALATION'
                    : `LOW CONFIDENCE ESCALATION (${confidence}%)`}
              </span>
              {reportCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#EF3340]/20 bg-white px-2 py-0.5 text-[10px] font-bold text-[#EF3340]">
                  <Flag className="h-3 w-3" />
                  {reportCount === 1
                    ? 'Reported by 1 user'
                    : `Reported by ${reportCount} independent users`}
                </span>
              )}
            </div>

            <p className="mt-1.5 text-xs sm:text-sm font-medium leading-relaxed text-[#111111]">
              {isHighRisk
                ? 'This claim contains multiple observable risk signals and may require further review.'
                : isReportEscalated
                  ? 'This claim has received multiple community reports and may warrant further review.'
                  : `This claim has low verification certainty (${confidence}% confidence) with unresolved ambiguities or conflicting evidence. If you suspect fraud, impersonation, or cyber financial scams, you can report it to the Cyber Crime Portal.`}
            </p>

            {riskFlags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {riskFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-md border border-[#EF3340]/20 bg-white px-2 py-0.5 text-[10px] font-mono text-[#EF3340]"
                  >
                    Flag: {flag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#EF3340] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#D92D3A] active:scale-98 cursor-pointer"
              >
                <span>Report to Cyber Crime Portal</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="text-[11px] text-[#667085]">
                Official National Cyber Crime Reporting Portal (Govt. of India)
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-[24px] border border-[#EAEAEA] bg-white p-6 shadow-xl animate-scale-in">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#111111] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 text-[#EF3340]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDE7E9]">
                <ExternalLink className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">Leaving NO CAP</h3>
            </div>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#555555]">
              You are opening the official <strong>National Cyber Crime Reporting Portal</strong> (cybercrime.gov.in) in a new tab.
            </p>

            <p className="mt-2 text-[11px] leading-relaxed text-[#667085]">
              NO CAP does not automatically transmit your claim text, personal information, or session data. You may complete the official complaint process voluntarily on the portal.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-[#F0F0F0] pt-4">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-full border border-[#EAEAEA] px-4 py-2 text-xs font-semibold text-[#555555] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceed}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#EF3340] px-5 py-2 text-xs font-bold text-white hover:bg-[#D92D3A] transition-colors cursor-pointer"
              >
                <span>Continue to Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
