import { useCallback, useEffect, useState } from 'react'
import { claimService } from '../services/claimService'
import { subscribeClaimsChanged, subscribeSocialChanged } from '../services/dataEvents'
import type { ClaimStats } from '../types'

export function useClaimStats() {
  const [stats, setStats] = useState<ClaimStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await claimService.getStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
    const offClaims = subscribeClaimsChanged(() => {
      void refetch(true)
    })
    const offSocial = subscribeSocialChanged(() => {
      void refetch(true)
    })
    return () => {
      offClaims()
      offSocial()
    }
  }, [refetch])

  return { stats, loading, error, refetch }
}
