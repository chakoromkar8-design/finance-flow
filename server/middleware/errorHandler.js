import { ApiError } from '../utils/errors.js'

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'Route not found.', { code: 'ROUTE_NOT_FOUND' }))
}

export function errorHandler(config) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    let status = 500
    let message = 'Something went wrong on our side. Please try again.'
    let code = 'INTERNAL'
    let fields

    if (err instanceof ApiError) {
      status = err.status
      message = err.message
      code = err.code
      fields = err.fields
    } else if (err?.type === 'entity.parse.failed') {
      status = 400
      message = 'Request body is not valid JSON.'
      code = 'INVALID_JSON'
    } else if (err?.type === 'entity.too.large') {
      status = 413
      message = 'Request body is too large.'
      code = 'TOO_LARGE'
    } else if (err?.code === 'P2002') {
      // Prisma "unique constraint failed" (e.g. duplicate email or account name).
      status = 409
      message = 'That record already exists.'
      code = 'CONFLICT'
    } else if (err?.code === 'P2025') {
      status = 404
      message = 'Record not found.'
      code = 'NOT_FOUND'
    }

    if (status >= 500 && !config.isTest) {
      // Log the real error for the developer, but never send details to the client.
      // (Deliberately logs only method + path + error, never bodies/cookies/passwords.)
      console.error(`[error] ${req.method} ${req.path}`, err)
    }

    res.status(status).json({ error: { message, ...(code ? { code } : {}), ...(fields ? { fields } : {}) } })
  }
}
