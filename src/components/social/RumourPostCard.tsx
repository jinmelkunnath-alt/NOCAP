import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Scale,
  ExternalLink,
  Flag,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CommunityReportForm } from '../reporting/CommunityReportForm'
import { ShareReminder } from '../shield/ShareReminder'
import { CommunityPoll } from './CommunityPoll'
import { HighRiskEscalation } from '../checker/HighRiskEscalation'
import { useSocial } from '../../context/SocialProvider'
import { socialService } from '../../services/socialService'
import { verificationService } from '../../services/verificationService'
import type { Claim, UserProfile } from '../../types'
import { formatRelative } from '../../utils/format'
import { cn } from '../../utils/cn'

interface RumourPostCardProps {
  claim: Claim
  author?: UserProfile | null
  relatedClaim?: Claim | null
  compact?: boolean
}

export function RumourPostCard({
  claim,
  author,
  relatedClaim = null,
  compact: _compact = false,
}: RumourPostCardProps) {
  const social = useSocial()
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [remindShare, setRemindShare] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)

  const resolvedAuthor =
    author ?? (claim.authorId ? social.userById.get(claim.authorId) : undefined)
  const metrics = social.metricsFor(claim.id)
  const saved = social.isSaved(claim.id)

  const initial = resolvedAuthor?.displayName?.charAt(0).toUpperCase() || 'G'
  const authorName = resolvedAuthor?.displayName || `Guest_${claim.id.slice(-4).toUpperCase()}`

  async function publishShare() {
    const text = verificationService.shareCopy(
      claim,
      [claim, relatedClaim].filter(Boolean) as Claim[],
      social.reviews,
    )
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: 'NO CAP',
          text,
        })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        throw new Error('Share is not available.')
      }
      socialService.recordShare(claim.id)
      setShareNote(
        typeof navigator.share === 'function' ? 'Shared' : 'Link & verification copied',
      )
      setRemindShare(false)
      setTimeout(() => setShareNote(null), 3000)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareNote('Share cancelled')
      setTimeout(() => setShareNote(null), 3000)
    }
  }

  function handleShare() {
    if (claim.verdict === 'Unverified' && !remindShare) {
      setRemindShare(true)
      return
    }
    void publishShare()
  }

  function handleToggleLike() {
    setHasLiked((prev) => !prev)
    socialService.castVote(claim.id, hasLiked ? 'unsure' : 'agree')
  }

  // Risk styling
  const riskClass =
    claim.riskLevel === 'High'
      ? 'bg-[#FDE7E9] text-[#EF3340]'
      : claim.riskLevel === 'Medium'
        ? 'bg-[#FEF3C7] text-[#D97706]'
        : 'bg-[#D1FAE5] text-[#059669]'

  // Verdict styling
  const verdictText =
    claim.verdict === 'Unverified'
      ? 'Unverified'
      : claim.verdict === 'Verified True'
        ? 'Verified'
        : claim.verdict === 'Verified False'
          ? 'Fake'
          : 'Under Verification'

  const verdictClass =
    verdictText === 'Verified'
      ? 'bg-[#D1FAE5] text-[#059669]'
      : verdictText === 'Fake'
        ? 'bg-[#FDE7E9] text-[#EF3340]'
        : 'bg-[#FEF3C7] text-[#D97706]'

  const contextSnippet =
    claim.originalText && claim.originalText !== claim.text
      ? claim.originalText
      : claim.sourceUrl?.trim()
        ? `Source: ${claim.sourceUrl}`
        : null

  return (
    <article className="rounded-[22px] bg-white border border-[#EAEAEA] p-6 shadow-xs hover:shadow-sm hover:border-[#DFDFDF] transition-all duration-200">
      {/* Post Header: Avatar, Name · Time, Menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar initial in soft red circle */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7E9] text-[#EF3340] font-bold text-base select-none">
            {initial}
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-[#111111] hover:text-[#EF3340] transition-colors">
              {authorName}
            </span>
            <span className="text-[#9CA3AF]">·</span>
            <time dateTime={claim.createdAt} className="text-xs text-[#667085]">
              {formatRelative(claim.createdAt)}
            </time>
          </div>
        </div>

        {/* Three dots menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="p-1.5 text-[#9CA3AF] hover:text-[#111111] rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Post options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-[#EAEAEA] bg-white p-1.5 shadow-lg z-20 animate-fade-in text-xs font-medium text-[#111111]">
              <Link
                to={`/claim/${claim.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[#667085]" />
                View Full Evidence
              </Link>
              <Link
                to={`/courtroom/${claim.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <Scale className="h-3.5 w-3.5 text-[#667085]" />
                Enter Courtroom
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  void publishShare()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-50 transition-colors"
              >
                <Send className="h-3.5 w-3.5 text-[#667085]" />
                Copy Share Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setReportOpen(true)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#EF3340] hover:bg-rose-50 transition-colors"
              >
                <Flag className="h-3.5 w-3.5" />
                Report Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Claim Text */}
      <div className="mt-3.5">
        <Link to={`/claim/${claim.id}`} className="group block">
          <h2 className="text-base sm:text-lg font-bold leading-snug text-[#111111] group-hover:text-[#EF3340] transition-colors">
            {claim.text}
          </h2>
        </Link>
        {contextSnippet && (
          <p className="mt-1.5 text-xs sm:text-sm text-[#667085] leading-relaxed line-clamp-2">
            {contextSnippet}
          </p>
        )}
      </div>

      {/* Status Chips: Category, Risk, Verification State */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#FDE7E9] px-3 py-1 text-xs font-semibold text-[#EF3340]">
          {claim.category}
        </span>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', riskClass)}>
          {claim.riskLevel} Risk
        </span>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', verdictClass)}>
          {verdictText}
        </span>
      </div>

      {/* Community Sentiment Poll: Real / Fake / Not Sure */}
      <div className="mt-4">
        <CommunityPoll claimId={claim.id} compact />
      </div>

      {/* Deterministic High-Risk / Safety Escalation */}
      <div className="mt-3">
        <HighRiskEscalation
          riskLevel={claim.riskLevel}
          riskFlags={claim.flags}
        />
      </div>

      {/* Engagement Row: ♡ likes, 💬 comments, ↗ shares, bookmark */}
      <div className="mt-4 flex items-center justify-between border-t border-[#F3F4F6] pt-3 text-xs sm:text-sm text-[#667085]">
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Like */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={cn(
              'inline-flex items-center gap-1.5 transition-colors',
              hasLiked ? 'text-[#EF3340] font-semibold' : 'hover:text-[#111111]',
            )}
            aria-label="Like post"
          >
            <Heart className={cn('h-4 w-4', hasLiked && 'fill-[#EF3340] text-[#EF3340]')} />
            <span>{metrics.votes + (hasLiked ? 1 : 0)}</span>
          </button>

          {/* Comments */}
          <Link
            to={`/claim/${claim.id}#comments`}
            className="inline-flex items-center gap-1.5 hover:text-[#111111] transition-colors"
            aria-label="View comments"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{metrics.comments}</span>
          </Link>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 hover:text-[#111111] transition-colors"
            aria-label="Share rumour"
          >
            <Send className="h-4 w-4" />
            <span>{metrics.shares}</span>
          </button>
        </div>

        {/* Bookmark */}
        <button
          type="button"
          onClick={() => socialService.toggleSave(claim.id)}
          className={cn(
            'p-1 text-[#667085] hover:text-[#111111] transition-colors',
            saved && 'text-[#111111]',
          )}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark post'}
        >
          <Bookmark className={cn('h-4 w-4', saved && 'fill-[#111111]')} />
        </button>
      </div>

      {/* Share feedback & Inline Report Form */}
      {shareNote && (
        <p className="mt-2 text-xs font-semibold text-[#EF3340] animate-fade-in">{shareNote}</p>
      )}

      {reportOpen && (
        <div className="mt-3 border-t border-[#F0F0F0] pt-3">
          <CommunityReportForm claimId={claim.id} onDone={() => setReportOpen(false)} />
        </div>
      )}

      {remindShare && (
        <div className="mt-3">
          <ShareReminder
            claimId={claim.id}
            onShareAnyway={() => void publishShare()}
            onCancel={() => setRemindShare(false)}
          />
        </div>
      )}
    </article>
  )
}
