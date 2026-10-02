import { ApiError } from '../utils/errors.js'

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  // API responses hold private financial data: never let browsers/proxies cache them.
  res.setHeader('Cache-Control', 'no-store')
  next()
}

// Because the login cookie is sent automatically by the browser, we refuse
// state-changing requests that come from a different website's page.
// Browsers always send an Origin header on such requests. Tools like curl don't,
// and they don't carry the victim's cookie either, so they are allowed.
export function originGuard(allowedOrigins) {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
    const origin = req.headers.origin
    if (origin && !allowedOrigins.includes(origin)) {
      return next(new ApiError(403, 'Request origin not allowed.', { code: 'BAD_ORIGIN' }))
    }
    return next()
  }
}

// Very small in-memory limiter for login/register (per IP + email).
// Good enough for one server process; use Redis or similar if you scale out.
export function createRateLimiter({ max, windowMs }) {
  const hits = new Map()
  const prune = (now) => {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
  }
  return {
    check(key) {
      const now = Date.now()
      prune(now)
      const entry = hits.get(key)
      if (entry && entry.count >= max) {
        throw new ApiError(429, 'Too many attempts. Please wait a few minutes and try again.', { code: 'RATE_LIMITED' })
      }
    },
    fail(key) {
      const now = Date.now()
      const entry = hits.get(key)
      if (!entry || entry.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs })
      else entry.count += 1
    },
    reset(key) {
      hits.delete(key)
    },
  }
}
