/**
 * useApiCall — a generic hook for data fetching with loading/error/data states.
 * Every screen uses this pattern so the UI never shows stale or optimistic data.
 *
 * Pattern: loading → error → data. The component renders based on these states,
 * never assuming a write succeeded until the DB confirms it.
 */
import { useState, useEffect, useCallback } from 'react'

export function useApiCall(apiFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    execute()
  }, [execute])

  return { data, loading, error, refetch: execute }
}

/**
 * useMutation — for write operations (create/update/delete).
 * Returns { mutate, loading, error }.
 * The caller is responsible for refetching after a successful mutation.
 */
export function useMutation(mutationFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function mutate(...args) {
    setLoading(true)
    setError(null)
    try {
      const result = await mutationFn(...args)
      return result
    } catch (err) {
      const msg = err.message || 'Operation failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}
