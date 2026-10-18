import crypto from "crypto"

/**
 * In-memory cache-aside utility with TTL for high-traffic read operations.
 * Zero-cost, runs in runtime memory, safe for serverless/edge instances.
 */

type CacheEntry<T> = {
  data: T
  expiry: number
  etag?: string
}

const memoryCache = new Map<string, CacheEntry<any>>()

/**
 * Generate an ETag from stringified content
 */
export function generateETag(content: string): string {
  const hash = crypto.createHash("md5").update(content).digest("hex")
  return `"${hash}"`
}

/**
 * Retrieve cached data or compute and store it if missing/expired.
 *
 * @param key Cache key (MUST include userId for user-specific data)
 * @param ttlSeconds Time-to-live in seconds
 * @param fetcher Async function to fetch fresh data on cache miss
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const cached = memoryCache.get(key)
  if (cached && cached.expiry > now) {
    return cached.data as T
  }

  const fresh = await fetcher()
  memoryCache.set(key, { data: fresh, expiry: now + ttlSeconds * 1000 })
  return fresh
}

/**
 * Clear cached entries by prefix (e.g., when a product or category is updated).
 */
export function invalidateCache(keyPrefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key)
    }
  }
}

/**
 * Create an ETag-enabled HTTP Response with HTTP 304 Not Modified support.
 */
export function createCachedETagResponse(
  req: Request,
  data: any,
  cacheControl: string = "public, s-maxage=60, stale-while-revalidate=300"
): Response {
  const bodyString = JSON.stringify(data)
  const etag = generateETag(bodyString)
  const clientEtag = req?.headers ? req.headers.get("if-none-match") : null
  const cleanClient = clientEtag ? clientEtag.replace(/^W\//, "").replace(/"/g, "").trim() : null
  const cleanServer = etag.replace(/^W\//, "").replace(/"/g, "").trim()

  if (cleanClient && cleanClient === cleanServer) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": cacheControl,
      },
    })
  }

  return new Response(bodyString, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ETag: etag,
      "Cache-Control": cacheControl,
    },
  })
}
