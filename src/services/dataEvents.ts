type Listener = () => void

const claimListeners = new Set<Listener>()
const socialListeners = new Set<Listener>()

export function subscribeClaimsChanged(listener: Listener): () => void {
  claimListeners.add(listener)
  return () => {
    claimListeners.delete(listener)
  }
}

export function emitClaimsChanged(): void {
  for (const listener of claimListeners) listener()
}

export function subscribeSocialChanged(listener: Listener): () => void {
  socialListeners.add(listener)
  return () => {
    socialListeners.delete(listener)
  }
}

export function emitSocialChanged(): void {
  for (const listener of socialListeners) listener()
}
