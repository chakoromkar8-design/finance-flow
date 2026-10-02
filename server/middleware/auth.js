import { ApiError } from '../utils/errors.js'
import { parseCookies } from '../utils/cookies.js'
import { verifyToken } from '../utils/jwt.js'

// Protects a route. The user id ALWAYS comes from the signed token in the
// HTTP-only cookie, never from the request body, URL or query string.
export function requireAuth({ prisma, config }) {
  return async (req, res, next) => {
    try {
      const token = parseCookies(req.headers.cookie)[config.cookie.name]
      if (!token) throw new ApiError(401, 'Please sign in to continue.', { code: 'UNAUTHENTICATED' })

      let payload
      try {
        payload = verifyToken(token, config.jwtSecret)
      } catch (err) {
        const message = err.message === 'expired' ? 'Your session has expired. Please sign in again.' : 'Invalid session. Please sign in again.'
        throw new ApiError(401, message, { code: err.message === 'expired' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN' })
      }

      const user = await prisma.user.findUnique({ where: { id: String(payload.sub) } })
      if (!user) throw new ApiError(401, 'Invalid session. Please sign in again.', { code: 'INVALID_TOKEN' })

      req.user = { id: user.id, name: user.name, email: user.email }
      next()
    } catch (err) {
      next(err)
    }
  }
}
