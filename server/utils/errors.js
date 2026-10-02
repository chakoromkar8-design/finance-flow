// A small error type the routes can throw. The error handler turns it into a
// clean JSON response: { error: { message, code?, fields? } }.
export class ApiError extends Error {
  constructor(status, message, { code, fields } = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export const notFound = (what = 'Record') => new ApiError(404, `${what} not found.`, { code: 'NOT_FOUND' })
