import { useCallback, useEffect, useState } from 'react'
import { subscribeClaimsChanged } from '../services/dataEvents'
import { reviewService } from '../services/reviewService'
import type { Review } from '../types'

export function useReviews(claimId?: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = claimId
        ? await reviewService.getReviewsForClaim(claimId)
        : await reviewService.getReviews()
      setReviews(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [claimId])

  useEffect(() => {
    void refetch()
    return subscribeClaimsChanged(() => {
      void refetch(true)
    })
  }, [refetch])

  return { reviews, loading, error, refetch }
}
