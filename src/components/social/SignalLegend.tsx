export function SignalLegend() {
  return (
    <div className="glass-card p-4">
      <p className="label-kicker">Four signals</p>
      <ul className="mt-3 flex flex-col gap-3 text-xs">
        <li>
          <p className="font-semibold text-ink">Trending</p>
          <p className="text-mute">Attention and spread from stored engagement. Not truth.</p>
        </li>
        <li>
          <p className="font-semibold text-ink">Risk</p>
          <p className="text-mute">Observable message signals. Not a false-probability.</p>
        </li>
        <li>
          <p className="font-semibold text-ink">Community</p>
          <p className="text-mute">User opinion. Never the official verdict.</p>
        </li>
        <li>
          <p className="font-semibold text-ink">Verification</p>
          <p className="text-mute">Human, accountable NO CAP resolution.</p>
        </li>
      </ul>
    </div>
  )
}
