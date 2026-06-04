import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'

interface FetchState<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setData: (data: T | undefined) => void
}

/**
 * Generic data-fetching hook. Handles loading, error and refetch.
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): FetchState<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch, setData }
}
