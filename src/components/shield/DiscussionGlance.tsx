import { Link } from 'react-router-dom'
import { useSocial } from '../../context/SocialProvider'

export function DiscussionGlance({ claimId }: { claimId: string }) {
  const social = useSocial()
  const comments = social.commentsFor(claimId)
  const evidence = comments
    .filter((item) => item.type === 'EVIDENCE')
    .sort((a, b) => b.helpfulBy.length - a.helpfulBy.length)
  const top = evidence[0] ?? comments[0]
  return (
    <div>
      <p className="label-kicker">Discussion</p>
      <p className="mt-1 text-sm text-ink">{comments.length} comments</p>
      {top ? (
        <p className="mt-2 text-xs text-mute">
          <span className="font-semibold text-ink">[{top.type}]</span> {top.text}
        </p>
      ) : (
        <p className="mt-2 text-xs text-faint">No comments yet. Comments are not treated as facts.</p>
      )}
      <Link to={`#comments`} className="mt-2 inline-block text-xs text-cyan hover:underline">
        View discussion
      </Link>
    </div>
  )
}
