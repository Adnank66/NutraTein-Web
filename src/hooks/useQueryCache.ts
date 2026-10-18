"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface QueryCacheEntry<T> {
  data: T
  timestamp: number
}

// Global in-memory cache map for client-side API caching
const queryCache = new Map<string, QueryCacheEntry<any>>()
const pendingRequests = new Map<string, Promise<any>>()

interface UseQueryOptions<T> {
  staleTime?: number // time in ms before data is considered stale (default: 60,000ms / 1 min)
  enabled?: boolean
  initialData?: T
}

/**
 * Lightweight, zero-dependency React Query-style data fetching and caching hook.
 * Features:
 * - In-memory Stale-While-Revalidate caching
 * - Request deduplication (coalesces simultaneous fetches to the same URL)
 * - Zero external package dependencies, zero bundle weight
 */
export function useQueryCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T> = {}
) {
  const { staleTime = 60 * 1000, enabled = true, initialData } = options

  const [data, setData] = useState<T | undefined>(() => {
    const cached = queryCache.get(key)
    if (cached) return cached.data
    return initialData
  })
  const [isLoading, setIsLoading] = useState<boolean>(!queryCache.has(key) && enabled)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const refetch = useCallback(async () => {
    if (!key || !enabled) return

    const cached = queryCache.get(key)
    const isStale = !cached || Date.now() - cached.timestamp > staleTime

    // If cached data exists and is still fresh, skip network
    if (cached && !isStale) {
      if (isMounted.current) {
        setData(cached.data)
        setIsLoading(false)
      }
      return cached.data
    }

    if (isMounted.current) {
      setIsFetching(true)
      if (!cached) setIsLoading(true)
    }

    try {
      // Request deduplication
      let promise = pendingRequests.get(key)
      if (!promise) {
        promise = fetcher().finally(() => {
          pendingRequests.delete(key)
        })
        pendingRequests.set(key, promise)
      }

      const result = await promise
      queryCache.set(key, { data: result, timestamp: Date.now() })

      if (isMounted.current) {
        setData(result)
        setError(null)
      }
      return result
    } catch (err: any) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
        setIsFetching(false)
      }
    }
  }, [key, enabled, staleTime, fetcher])

  useEffect(() => {
    if (enabled) {
      refetch()
    }
  }, [key, enabled, refetch])

  return { data, isLoading, isFetching, error, refetch }
}
