import { useCallback, useEffect, useState } from 'react'
import { claimService } from '../services/claimService'
import { subscribeClaimsChanged } from '../services/dataEvents'
import type { Claim } from '../types'

export function useClaim(id: string | undefined) {
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(
    async (silent = false) => {
      if (!id) {
        setClaim(null)
        setError('A claim ID is required.')
        setLoading(false)
        return
      }

      if (!silent) setLoading(true)
      setError(null)
      try {
        const data = await claimService.getClaimById(id)
        setClaim(data)
        if (!data) setError('Claim not found.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load claim.')
        setClaim(null)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    void refetch()
    return subscribeClaimsChanged(() => {
      void refetch(true)
    })
  }, [refetch])

  return { claim, loading, error, refetch }
}
