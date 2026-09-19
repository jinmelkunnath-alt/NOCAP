import { DEFAULT_DESK_REVIEWER_ID, SEED_USERS } from '../data/users'
import type { UserProfile } from '../types'
import { emitSocialChanged } from './dataEvents'
import { guestService } from './guestService'
import { socialStorage } from './socialStorage'
import { verificationStorage } from './verificationStorage'

function users(): UserProfile[] {
  return socialStorage.getUsers()
}

export const sessionService = {
  getCurrentUserId(): string {
    return this.getCurrentUser().id
  },

  getCurrentUser(): UserProfile {
    return guestService.ensureCurrentGuest()
  },

  getDeskReviewerId(): string {
    return verificationStorage.getDeskReviewerId() ?? DEFAULT_DESK_REVIEWER_ID
  },

  getDeskReviewer(): UserProfile {
    const id = this.getDeskReviewerId()
    return (
      users().find((item) => item.id === id) ??
      users().find((item) => item.id === DEFAULT_DESK_REVIEWER_ID) ??
      SEED_USERS[0]!
    )
  },

  setDeskReviewerId(id: string): void {
    verificationStorage.setDeskReviewerId(id)
    emitSocialChanged()
  },

  reviewers(): UserProfile[] {
    return users().filter((item) => item.perspective === 'A' || item.perspective === 'B')
  },

  switchGuest(): UserProfile {
    const user = guestService.switchGuest()
    emitSocialChanged()
    return user
  },
}

