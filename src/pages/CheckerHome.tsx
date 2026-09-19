import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileQuestion,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { PostComposer } from '../components/checker/PostComposer'
import { ResultCard } from '../components/checker/ResultCard'
import { checkerService, CheckerError, type CheckerErrorType } from '../services/checkerService'
import type { RumourCheck } from '../types'
import { cn } from '../utils/cn'

interface StageItem {
  id: string
  label: string
}

interface CheckerErrorState {
  type: CheckerErrorType
  message: string
}

export function CheckerHomePage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [activeStageLabel, setActiveStageLabel] = useState('Understanding the claim')
  const [liveThinking, setLiveThinking] = useState('')
  const [check, setCheck] = useState<RumourCheck | null>(null)
  const [errorState, setErrorState] = useState<CheckerErrorState | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [composer, setComposer] = useState(false)

  const steps: StageItem[] = [
    { id: 'understanding', label: 'Understanding the claim & context' },
    { id: 'signals', label: 'Reviewing verification signals & risk triage' },
    { id: 'evidence', label: 'Cross-referencing verified records & known patterns' },
    { id: 'reasoning', label: 'Running AI reasoning & evaluating certainty' },
    { id: 'assessment', label: 'Synthesizing structured assessment' },
  ]

  async function runCheck(text: string) {
    const query = text.trim()
    if (query.length < 8) return
    setErrorState(null)
    setBusy(true)
    setCheck(null)
    setActiveStageIndex(0)
    setActiveStageLabel('Understanding the claim & context')
    setLiveThinking('')

    try {
      const result = await checkerService.check(query, (progress) => {
        if (progress.accumulatedThinking) {
          setLiveThinking(progress.accumulatedThinking)
        }
        if (progress.stage === 'understanding') {
          setActiveStageIndex(0)
          setActiveStageLabel(progress.message)
        } else if (progress.stage === 'signals') {
          setActiveStageIndex(1)
          setActiveStageLabel(progress.message)
        } else if (progress.stage === 'evidence') {
          setActiveStageIndex(2)
          setActiveStageLabel(progress.message)
        } else if (progress.stage === 'reasoning') {
          setActiveStageIndex(3)
          setActiveStageLabel(progress.message)
        } else if (progress.stage === 'assessment') {
          setActiveStageIndex(4)
          setActiveStageLabel(progress.message)
        }
      })

      setCheck(result)
      setErrorState(null)
    } catch (err: any) {
      setCheck(null)
      const errType: CheckerErrorType = err instanceof CheckerError ? err.errorType : 'UNAVAILABLE'
      setErrorState({
        type: errType,
        message: err?.message || 'NO CAP AI is currently unavailable.',
      })
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void runCheck(draft)
  }

  async function handleAttachText() {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        if (text) setDraft((prev) => (prev ? `${prev} ${text}` : text))
      }
    } catch {
      // Ignore clipboard permission errors
    }
  }

  async function handlePasteLink() {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        if (text) {
          const formatted = text.startsWith('http') ? `Source: ${text}` : text
          setDraft((prev) => (prev ? `${prev} ${formatted}` : formatted))
        }
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div className="relative mx-auto max-w-6xl flex flex-col justify-center min-h-[calc(100vh-5rem)] py-2 sm:py-4 lg:py-6">
      {/* Background Soft Glow Orbs */}
      <div className="pointer-events-none absolute -right-20 top-0 h-[450px] w-[450px] rounded-full bg-radial from-[#FDE7E9]/70 via-[#FFF0F2]/30 to-transparent blur-3xl -z-10" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-[350px] w-[350px] rounded-full bg-radial from-[#FDE7E9]/40 via-transparent to-transparent blur-3xl -z-10" />

      {/* TOP HERO SECTION: Left Editorial & AI Surface + Right Statue Art */}
      <section className="relative grid items-start gap-8 lg:grid-cols-[minmax(0,1.14fr)_minmax(320px,0.86fr)] xl:grid-cols-[minmax(0,1.18fr)_minmax(350px,0.82fr)] xl:gap-12">
        {/* Left Side: Eyebrow + Headline + Description + AI Input */}
        <div className="space-y-4 sm:space-y-5 order-1 lg:order-1">
          {/* Eyebrow */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-[#EF3340] uppercase">
            <span className="inline-block h-0.5 w-6 shrink-0 bg-[#EF3340]" />
            <span className="whitespace-nowrap text-[#111111]">
              NO <span className="text-[#EF3340]">CAP</span>
            </span>
            <span className="text-[#EF3340]">&mdash; PEOPLE. EVIDENCE. A CLEARER TOMORROW.</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-extrabold tracking-tight text-[#111111] leading-[1.08]">
            What <span className="text-[#EF3340]">rumour</span> are you <br className="hidden sm:inline" />
            unsure about?
          </h1>

          {/* Hero Description */}
          <p className="max-w-[600px] text-sm sm:text-base lg:text-lg leading-relaxed text-[#667085]">
            Bring us the claim. NO CAP checks the signals, evidence, and verification history &mdash; so you can separate fact from fiction.
          </p>

          {/* Floating AI Input Card Surface */}
          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-[26px] bg-white border border-[#EAEAEA] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-200 hover:border-[#D5D5D5] focus-within:border-[#EF3340]/30 focus-within:shadow-[0_0_0_4px_rgba(239,51,64,0.06)] focus-within:ring-0"
          >
            {/* Input top area: Sparkle icon + Textarea */}
            <div className="flex items-start gap-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FDE7E9] text-[#EF3340] mt-0.5">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <label htmlFor="hero-checker-input" className="sr-only">
                  Tell NO CAP what you are unsure about
                </label>
                <textarea
                  id="hero-checker-input"
                  name="rumour"
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (draft.trim().length >= 8 && !busy) {
                        void runCheck(draft)
                      }
                    }
                  }}
                  placeholder="Is it true that..."
                  className="w-full resize-none border-0 bg-transparent p-0 text-base sm:text-lg text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 outline-none leading-relaxed font-normal shadow-none"
                />
              </div>
            </div>

            {/* Bottom Bar: Action buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F4F6] pt-3.5">
              {/* Left utility tools */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#667085]">
                <button
                  type="button"
                  onClick={handleAttachText}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-1.5 text-xs font-medium text-[#555555] hover:bg-[#F0F0F0] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <Paperclip className="h-3.5 w-3.5 text-[#667085]" />
                  <span>Attach text</span>
                </button>

                <button
                  type="button"
                  onClick={handlePasteLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-1.5 text-xs font-medium text-[#555555] hover:bg-[#F0F0F0] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <LinkIcon className="h-3.5 w-3.5 text-[#667085]" />
                  <span>Paste link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOptions((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-1.5 text-xs font-medium text-[#555555] hover:bg-[#F0F0F0] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#667085]" />
                  <span>Advanced options</span>
                </button>

                {draft && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft('')
                      setErrorState(null)
                    }}
                    className="px-2 py-1 text-xs text-[#9CA3AF] hover:text-[#EF3340] transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Right CTA button */}
              <button
                type="submit"
                id="hero-check-button"
                disabled={busy}
                onClick={(e) => {
                  if (draft.trim().length < 8 && !busy) {
                    e.preventDefault()
                    const sample = 'Students will receive free laptops tomorrow.'
                    setDraft(sample)
                    void runCheck(sample)
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#EF3340] px-6 py-2.5 sm:py-3 text-sm font-bold text-white shadow-xs transition-all duration-150 hover:bg-[#D92D3A] active:scale-98 disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Check with NO CAP</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>

            {/* Optional Advanced Options Drawer */}
            {showOptions && (
              <div className="mt-3 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-3 text-xs text-[#667085] animate-fade-in flex flex-wrap items-center justify-between gap-2">
                <span>Intake: <strong>Text &amp; Signal Analysis</strong></span>
                <span>Model Engine: <strong>OpenRouter Streaming AI</strong></span>
                <span>Verification: <strong>Primary &amp; Backup Fallback</strong></span>
              </div>
            )}
          </form>
        </div>

        {/* Right Side: Neethi Devatai / Classical Lady Justice Visual */}
        <div className="relative flex flex-col items-center justify-center w-full mt-4 lg:mt-0 order-2 lg:order-2 lg:pt-0">
          <div className="relative w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[380px] xl:max-w-[440px] aspect-square flex items-center justify-center mx-auto">
            {/* Concentric red circular investigation rings */}
            <div className="absolute inset-0 rounded-full border border-[#EF3340]/25" />
            <div className="absolute inset-8 rounded-full border border-[#EF3340]/20" />
            <div className="absolute inset-16 rounded-full border border-[#EF3340]/15" />

            {/* Red geometric crosshair lines */}
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#EF3340]/20" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#EF3340]/20" />

            {/* Editorial labels around perimeter */}
            <div className="absolute -top-1 left-8 text-[9px] font-mono font-bold tracking-widest text-[#EF3340] uppercase bg-white/90 px-2 py-0.5 rounded-full border border-[#EF3340]/20 shadow-2xs">
              QUESTION
            </div>
            <div className="absolute top-6 left-8 text-[8px] font-mono text-[#667085] tracking-wider uppercase">
              DISCUSS
            </div>
            <div className="absolute top-10 left-8 text-[8px] font-mono text-[#667085] tracking-wider uppercase">
              VERIFY
            </div>
            <div className="absolute top-14 left-8 text-[8px] font-mono font-bold text-[#EF3340] tracking-wider uppercase">
              A SAFER TOMORROW.
            </div>

            <div className="absolute top-24 -right-2 text-right max-w-[90px] text-[8px] font-mono font-bold text-[#667085] tracking-wider uppercase leading-tight bg-white/80 p-1 rounded-sm border border-[#EAEAEA]">
              TRUTH LIVES IN BETTER QUESTIONS.
            </div>

            {/* Lady Justice (Neethi Devathai) Statue */}
            <div
              className="relative z-10 w-full h-full flex items-center justify-center animate-subtle-weigh cursor-pointer"
              title="NO CAP — Impartial Evidence &amp; Truth Verification"
            >
              <img
                src="/justice-statue.png"
                alt="NO CAP Lady Justice — Truth, Evidence, and Impartiality"
                className="w-full h-auto max-h-[340px] sm:max-h-[400px] lg:max-h-[460px] xl:max-h-[520px] object-contain drop-shadow-[0_14px_32px_rgba(0,0,0,0.16)] select-none pointer-events-none transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* In-Place Real-Time AI Verification Progress Screen */}
      {busy && (
        <div className="mt-8 rounded-[24px] border border-[#EF3340]/20 bg-white p-6 sm:p-7 shadow-xs animate-fade-in max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] pb-3.5">
            <div className="flex items-center gap-2 text-[#EF3340]">
              <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
                  NO CAP is checking...
                </p>
                <p className="text-[11px] text-[#667085] font-normal mt-0.5">{activeStageLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {steps.map((step, idx) => {
              const isDone = activeStageIndex > idx
              const isCurrent = activeStageIndex === idx
              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs transition-all duration-300',
                    isDone
                      ? 'bg-[#F9FAFB] text-[#111111]'
                      : isCurrent
                        ? 'border border-[#EF3340]/30 bg-[#FDE7E9]/40 text-[#EF3340] font-semibold'
                        : 'text-[#9CA3AF] opacity-50',
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" aria-hidden="true" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#EF3340]" aria-hidden="true" />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded-full border border-[#D1D5DB]" />
                  )}
                  <span>{step.label}</span>
                </div>
              )
            })}
          </div>

          {/* Real-time AI Thinking & Reasoning Pulse */}
          {activeStageIndex >= 3 && (
            <div className="mt-4 rounded-xl border border-[#EF3340]/20 bg-[#FAFAFA] p-3.5 text-xs animate-fade-in">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#EF3340]">
                <Brain className="h-3.5 w-3.5 animate-pulse" />
                <span>AI Thinking &amp; Reasoning Process</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-[#444444] line-clamp-3">
                {liveThinking || 'Cross-referencing claims against structured knowledge signals and evaluating certainty...'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: AI UNAVAILABLE (Clean, honest state without fabricated results) */}
      {errorState && errorState.type !== 'PARSE_ERROR' && !busy && (
        <div className="mt-8 max-w-3xl mx-auto w-full animate-fade-in">
          <div className="rounded-[26px] border border-amber-300/70 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-bold tracking-[0.22em] text-[#111111] uppercase">
                  AI SERVICE STATUS
                </span>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                AI Unavailable
              </span>
            </div>

            <div className="mt-6">
              <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                Live AI Verification Unavailable
              </h2>
              <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
                {errorState.message}
              </p>
              <div className="mt-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-4 text-xs text-[#667085] leading-relaxed">
                <strong>Honest Misinformation Triage:</strong> NO CAP never fabricates a canned or synthetic verification score when the AI model cannot be reached. You can retry the automated check, or post the claim to the community for human verification.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] pt-5">
              <button
                type="button"
                onClick={() => void runCheck(draft)}
                className="inline-flex items-center gap-2 rounded-full bg-[#EF3340] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all duration-150 hover:bg-[#D92D3A] active:scale-98 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry AI Check</span>
              </button>

              <button
                type="button"
                onClick={() => setComposer(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#EAEAEA] bg-[#FAFAFA] px-5 py-2.5 text-xs font-bold text-[#111111] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
              >
                <span>Post to Community for Human Review</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: AI RESPONSE UNPARSEABLE (Clean, honest state without fabricated results) */}
      {errorState && errorState.type === 'PARSE_ERROR' && !busy && (
        <div className="mt-8 max-w-3xl mx-auto w-full animate-fade-in">
          <div className="rounded-[26px] border border-rose-300/70 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <FileQuestion className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-bold tracking-[0.22em] text-[#111111] uppercase">
                  UNPARSEABLE RESPONSE
                </span>
              </div>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Response Formatting Error
              </span>
            </div>

            <div className="mt-6">
              <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                AI Output Could Not Be Structured
              </h2>
              <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
                {errorState.message}
              </p>
              <div className="mt-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-4 text-xs text-[#667085] leading-relaxed">
                <strong>Integrity Guarantee:</strong> The model responded, but its output could not be strictly validated as valid verification JSON. NO CAP does not synthesize mock conclusions when formatting fails.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] pt-5">
              <button
                type="button"
                onClick={() => void runCheck(draft)}
                className="inline-flex items-center gap-2 rounded-full bg-[#EF3340] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all duration-150 hover:bg-[#D92D3A] active:scale-98 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Check</span>
              </button>

              <button
                type="button"
                onClick={() => setComposer(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#EAEAEA] bg-[#FAFAFA] px-5 py-2.5 text-xs font-bold text-[#111111] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
              >
                <span>Post to Community for Human Review</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 1: AI SUCCESSFULLY RESPONDED (In-Place AI Assessment Result Card Reveal) */}
      {check && !busy && !errorState && (
        <div className="mt-8 max-w-3xl mx-auto w-full animate-fade-in">
          <ResultCard
            assessment={check.result}
            original={check.originalText}
            claimId={check.postedClaimId || check.id}
            onPost={() => setComposer(true)}
          />
        </div>
      )}

      {/* Post to Community Modal */}
      {composer && (
        <PostComposer
          original={check?.originalText || draft}
          assessment={
            check?.result || {
              label: 'INCONCLUSIVE',
              verification: 'UNDER VERIFICATION',
              found: false,
              aiConfidence: 50,
              why: 'Submitted for community review and factual investigation.',
              matchedClaimId: null,
              similarityPercent: null,
              evidenceNote: 'Community triage pending.',
            }
          }
          checkId={check?.id}
          onClose={() => setComposer(false)}
          onPublished={(claimId) => {
            setComposer(false)
            navigate(`/claim/${claimId}`)
          }}
        />
      )}
    </div>
  )
}
