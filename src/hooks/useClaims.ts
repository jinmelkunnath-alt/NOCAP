import { useCallback, useEffect, useState } from 'react'
import { claimService } from '../services/claimService'
import { subscribeClaimsChanged } from '../services/dataEvents'
import type { Claim } from '../types'

export function useClaims() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await claimService.getClaims()
      setClaims(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
    return subscribeClaimsChanged(() => {
      void refetch(true)
    })
  }, [refetch])

  return { claims, loading, error, refetch }
}
