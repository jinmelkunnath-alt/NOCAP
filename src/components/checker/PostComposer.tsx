import { useEffect, useMemo, useState } from 'react'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { CATEGORIES, PLATFORMS, type Category, type Platform } from '../../types'
import type { AiAssessment } from '../../types'
import { checkerService } from '../../services/checkerService'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

export function PostComposer({
  original,
  assessment,
  checkId,
  onClose,
  onPublished,
}: {
  original: string
  assessment: AiAssessment
  checkId?: string
  onClose: () => void
  onPublished: (claimId: string) => void
}) {
  const [display, setDisplay] = useState(original)
  const [enhanced, setEnhanced] = useState(false)
  const [category, setCategory] = useState<Category>(checkerService.inferCategory(original))
  const [platform, setPlatform] = useState<Platform>('Other')
  const [sourceUrl, setSourceUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => display.trim() || original, [display, original])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  async function applyEnhance() {
    setEnhancing(true)
    setError(null)
    try {
      const next = await checkerService.enhanceAsync(original)
      setDisplay(next)
      setEnhanced(true)
    } catch {
      const fallback = checkerService.enhance(original)
      setDisplay(fallback)
      setEnhanced(true)
    } finally {
      setEnhancing(false)
    }
  }


  async function publish() {
    setError(null)
    setBusy(true)
    try {
      const claim = await checkerService.publish({
        originalText: original,
        displayText: preview,
        enhancedByAI: enhanced,
        category,
        platform,
        sourceUrl,
        checkId,
      })
      onPublished(claim.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        aria-label="Close composer"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-title"
        className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-[#EAEAEA] bg-white p-6 shadow-2xl sm:rounded-[24px]"
      >
        <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#EF3340]">
              COMMUNITY COMPOSER
            </span>
            <h2 id="composer-title" className="mt-0.5 text-lg font-bold text-[#111111]">
              Post Rumour to Community
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#9CA3AF] hover:bg-slate-100 hover:text-[#111111] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="mt-4 rounded-[18px] border border-[#EAEAEA] bg-[#FAFAFA] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#667085]">
              {enhanced ? '✦ AI Enhanced Preview' : 'Post Preview'}
            </span>
            <span className="rounded-full bg-white border border-[#EAEAEA] px-2.5 py-0.5 text-[10px] font-bold text-[#111111]">
              {assessment.label} &bull; {assessment.aiConfidence}% AI Conf.
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed font-bold text-[#111111]">
            {preview}
          </p>

          <div className="mt-3 flex items-center gap-2 text-[10px] text-[#667085] font-mono">
            <span>User Rumour</span>
            <span>&bull;</span>
            <span>{category}</span>
            <span>&bull;</span>
            <span>{platform}</span>
          </div>
        </div>

        {/* Before / After comparison if enhanced */}
        {enhanced && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Original draft
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#667085] font-mono">{original}</p>
            </div>
            <div className="rounded-xl border border-[#EF3340]/30 bg-[#FDE7E9]/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#EF3340]">
                AI Enhanced draft
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#111111] font-medium">{display}</p>
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <div className="mt-5 space-y-3.5">
          <Textarea
            id="composer-text"
            name="display"
            label="Display Claim Text"
            value={display}
            onChange={(event) => {
              setDisplay(event.target.value)
              if (enhanced && event.target.value === original) setEnhanced(false)
            }}
            rows={3}
          />
          {enhanced && (
            <p className="text-[11px] text-[#EF3340] font-medium">
              &bull; Original wording is preserved on record and never silently overwritten.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              id="composer-category"
              name="category"
              label="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select
              id="composer-platform"
              name="platform"
              label="Platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value as Platform)}
            >
              {PLATFORMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <Input
            id="composer-url"
            name="sourceUrl"
            type="url"
            label="Source URL (Optional)"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://twitter.com/... or https://..."
          />
        </div>

        {error && (
          <p
            className="mt-3 rounded-xl border border-[#EF3340]/30 bg-[#FDE7E9] px-3 py-2 text-xs text-[#EF3340] font-medium"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Actions: POST AS IS and ENHANCE WITH AI */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] pt-4">
          <div className="flex items-center gap-2">
            {!enhanced ? (
              <button
                type="button"
                onClick={applyEnhance}
                disabled={busy || enhancing}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#EF3340]/30 bg-[#FDE7E9] px-4 py-2 text-xs font-bold text-[#EF3340] hover:bg-[#FDE7E9]/80 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`h-3.5 w-3.5 text-[#EF3340] ${enhancing ? 'animate-spin' : ''}`} />
                {enhancing ? 'Enhancing with AI...' : 'Enhance with AI'}
              </button>
            ) : (

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDisplay(original)
                  setEnhanced(false)
                }}
                disabled={busy}
                className="rounded-full"
              >
                Revert to Original
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <button
              type="button"
              onClick={() => void publish()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[#EF3340] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#D92D3A] transition-colors"
            >
              {enhanced ? 'Publish Enhanced' : 'Post As Is'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
