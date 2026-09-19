import type { ClaimPoll, CommunityConsensus, PollVote } from '../../types'

export function CommunityPulse({
  consensus,
  poll,
  pollVotes,
}: {
  consensus: CommunityConsensus
  poll: ClaimPoll | null
  pollVotes: PollVote[]
}) {
  const pct = (n: number) =>
    consensus.total === 0 ? 0 : Math.round((n / consensus.total) * 100)
  return (
    <div>
      <p className="label-kicker">Community</p>
      {consensus.total === 0 ? (
        <p className="mt-1 text-xs text-faint">No votes recorded. Votes are not a verdict.</p>
      ) : (
        <p className="mt-1 text-sm text-ink">
          {consensus.total} votes
          <span className="mt-1 block text-xs text-mute">
            {pct(consensus.agree)}% Agree · {pct(consensus.disagree)}% Disagree ·{' '}
            {pct(consensus.unsure)}% Unsure
          </span>
        </p>
      )}
      {poll && (
        <div className="mt-3">
          <p className="label-kicker">Poll</p>
          <p className="mt-1 text-[11px] text-faint">Separate from votes. Not a verdict.</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {poll.options.map((option, index) => {
              const count = pollVotes.filter((item) => item.optionIndex === index).length
              const share = pollVotes.length === 0 ? 0 : Math.round((count / pollVotes.length) * 100)
              return (
                <li key={option} className="flex justify-between gap-2 text-xs text-mute">
                  <span>{option}</span>
                  <span className="font-mono">{share}%</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
