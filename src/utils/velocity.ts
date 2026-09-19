import type { EngagementEvent, RumourVelocity } from '../types'

const WINDOW_MINUTES = 30

export function rumourVelocity(
  claimId: string,
  events: EngagementEvent[],
  now = Date.now(),
): RumourVelocity {
  const cutoff = now - WINDOW_MINUTES * 60_000
  const recent = events.filter((item) => {
    if (item.claimId !== claimId) return false
    const time = new Date(item.createdAt).getTime()
    return Number.isFinite(time) && time >= cutoff && time <= now
  })

  if (recent.length === 0) {
    const any = events.some((item) => item.claimId === claimId)
    return {
      windowMinutes: WINDOW_MINUTES,
      interactions: 0,
      label: any ? 'quiet' : 'unknown',
      note: 'Not enough activity data',
    }
  }

  return {
    windowMinutes: WINDOW_MINUTES,
    interactions: recent.length,
    label: recent.length >= 8 ? 'rapid' : 'active',
    note:
      recent.length >= 8
        ? `Rapidly spreading · +${recent.length} interactions in the last ${WINDOW_MINUTES} minutes`
        : `+${recent.length} interactions in the last ${WINDOW_MINUTES} minutes`,
  }
}
