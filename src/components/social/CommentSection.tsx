import { useMemo, useState, type FormEvent } from 'react'
import { CornerDownRight, MessageSquare, ThumbsUp } from 'lucide-react'
import { useSocial } from '../../context/SocialProvider'
import { moderationService } from '../../services/moderationService'
import { socialService } from '../../services/socialService'
import type { CommentKind, CommentRecord, UserProfile } from '../../types'
import { formatRelative } from '../../utils/format'
import { COMMENT_TYPES } from '../../types'
import { Button } from '../ui/Button'
import { Avatar } from './Avatar'
import { cn } from '../../utils/cn'

interface CommentSectionProps {
  claimId: string
}

type SortMode = 'top' | 'newest'

export function CommentSection({ claimId }: CommentSectionProps) {
  const social = useSocial()
  const [text, setText] = useState('')
  const [kind, setKind] = useState<CommentKind>('GENERAL')
  const [sort, setSort] = useState<SortMode>('top')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const comments = social.commentsFor(claimId)
  const roots = comments.filter((item) => !item.parentId)
  const sorted = useMemo(() => {
    const copy = [...roots]
    if (sort === 'newest') {
      copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      copy.sort((a, b) => {
        const helpful = b.helpfulBy.length - a.helpfulBy.length
        if (helpful !== 0) return helpful
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }
    return copy
  }, [roots, sort])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim()) return
    setError(null)
    try {
      socialService.addComment({
        claimId,
        text: text.trim(),
        type: kind,
        parentId: replyTo,
      })
      setText('')
      setReplyTo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to post comment.')
    }
  }

  const replyTarget = replyTo ? comments.find((c) => c.id === replyTo) : null

  return (
    <section id="comments" className="glass-card p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            Discussion ({comments.length})
          </h2>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px]">
          {(['top', 'newest'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSort(mode)}
              className={cn(
                'rounded-md px-3 py-1 font-semibold uppercase tracking-wider transition-all',
                sort === mode
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900',
              )}
            >
              {mode === 'top' ? 'Top Rated' : 'Newest'}
            </button>
          ))}
        </div>
      </div>

      {/* Composer Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-line/80 bg-slate-50/70 p-3.5 space-y-3">
        {replyTarget && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="h-3.5 w-3.5 text-emerald-600" />
              Replying to comment #{replyTarget.id.slice(0, 5)}
            </span>
            <button
              type="button"
              className="text-[11px] font-semibold text-emerald-700 hover:underline"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Comment Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Type:
          </span>
          {COMMENT_TYPES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setKind(item)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase transition-all',
                kind === item
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'border border-line/70 bg-white text-slate-600 hover:bg-slate-100',
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <textarea
          id={`comment-${claimId}`}
          name="comment"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Contribute evidence, ask questions, or note corrections..."
          className="w-full resize-none rounded-xl border border-line/80 bg-white p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
        />

        {error && (
          <p className="rounded-xl border border-red/40 bg-red-dim px-3 py-1.5 text-xs text-red">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!text.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            {replyTo ? 'Post Reply' : 'Post Comment'}
          </Button>
        </div>
      </form>

      {/* Comment List */}
      {sorted.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No comments yet. Be the first to start the community discussion.
        </div>
      ) : (
        <ul className="space-y-4">
          {sorted.map((item) => (
            <li key={item.id}>
              <CommentCard
                comment={item}
                author={social.userById.get(item.authorId)}
                currentUserId={social.currentUser.id}
                onReply={() => setReplyTo(item.id)}
              />
              <ReplyThread
                parentId={item.id}
                comments={comments}
                users={social.userById}
                currentUserId={social.currentUser.id}
                onReply={setReplyTo}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ReplyThread({
  parentId,
  comments,
  users,
  currentUserId,
  onReply,
}: {
  parentId: string
  comments: CommentRecord[]
  users: Map<string, UserProfile>
  currentUserId: string
  onReply: (id: string) => void
}) {
  const replies = comments
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  if (replies.length === 0) return null

  return (
    <ul className="mt-2.5 ml-4 sm:ml-8 border-l-2 border-slate-200 pl-3 sm:pl-4 space-y-2.5">
      {replies.map((item) => (
        <li key={item.id}>
          <CommentCard
            comment={item}
            author={users.get(item.authorId)}
            currentUserId={currentUserId}
            onReply={() => onReply(item.id)}
            compact
          />
        </li>
      ))}
    </ul>
  )
}

function CommentCard({
  comment,
  author,
  currentUserId,
  onReply,
  compact = false,
}: {
  comment: CommentRecord
  author?: UserProfile
  currentUserId: string
  onReply: () => void
  compact?: boolean
}) {
  const helpful = comment.helpfulBy.includes(currentUserId)
  const reported = comment.reportedBy.includes(currentUserId)

  return (
    <article className={cn('rounded-2xl border border-line/60 bg-white/80 p-3.5 shadow-2xs transition-colors hover:bg-white', compact && 'p-3 bg-slate-50/80')}>
      <header className="flex items-start gap-2.5">
        {author ? <Avatar user={author} size="sm" /> : <span className="h-7 w-7 rounded-full bg-slate-200" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-xs font-bold text-slate-900">
              {author ? author.displayName : 'Unknown'}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
              {comment.type}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              <time dateTime={comment.createdAt}>{formatRelative(comment.createdAt)}</time>
            </span>
          </div>

          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-800">
            {comment.text}
          </p>

          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-500">
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium transition-colors',
                helpful ? 'bg-emerald-100 text-emerald-800' : 'hover:text-slate-900',
              )}
              aria-pressed={helpful}
              onClick={() => socialService.toggleHelpful(comment.id)}
            >
              <ThumbsUp className="h-3 w-3" />
              <span>Helpful ({comment.helpfulBy.length})</span>
            </button>

            <button
              type="button"
              className="hover:text-slate-900 transition-colors"
              onClick={onReply}
            >
              Reply
            </button>

            <button
              type="button"
              className={cn(reported ? 'text-red font-medium' : 'text-slate-400 hover:text-slate-700')}
              onClick={() => {
                socialService.reportComment(comment.id)
                if (!reported) {
                  moderationService.createReport({
                    claimId: comment.claimId,
                    commentId: comment.id,
                    reason: 'Other',
                    detail: 'Comment flagged from discussion.',
                  })
                }
              }}
            >
              {reported ? 'Reported' : 'Report'}
            </button>
          </div>
        </div>
      </header>
    </article>
  )
}
