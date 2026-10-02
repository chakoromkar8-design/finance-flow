import { ApiError } from '../utils/errors.js'
import { parseDay } from '../utils/dates.js'

export const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Transport', 'Bills', 'Entertainment', 'Education', 'Healthcare', 'Other']
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Other']
export const ACCOUNT_TYPES = ['SAVINGS', 'CURRENT', 'CASH', 'CREDIT_CARD', 'INVESTMENT', 'OTHER']
export const MAX_MONEY = 99_999_999_999.99 // fits Decimal(14,2) with room to spare

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

export function assertId(value) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new ApiError(400, 'Invalid id.', { code: 'INVALID_ID' })
  }
  return value
}

// Collects every problem so the frontend can show all field errors at once.
//   const v = new Validator(req.body, { partial: false })
//   v.string('name', { max: 80 }); ...
//   const data = v.done()      // throws 400 with { fields } if anything failed
// With partial=true (used by PUT) fields that were not sent are simply skipped.
export class Validator {
  constructor(body, { partial = false } = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new ApiError(400, 'Request body must be a JSON object.', { code: 'INVALID_BODY' })
    }
    this.body = body
    this.partial = partial
    this.errors = {}
    this.out = {}
  }

  _present(key, { required = true, nullable = false } = {}) {
    const value = this.body[key]
    if (value === undefined) {
      if (required && !this.partial) this.errors[key] = 'This field is required.'
      return { skip: true }
    }
    if (value === null || value === '') {
      if (nullable) {
        this.out[key] = null
        return { skip: true }
      }
      this.errors[key] = 'This field is required.'
      return { skip: true }
    }
    return { skip: false, value }
  }

  string(key, { min = 1, max = 200, required = true, nullable = false, label = 'This field' } = {}) {
    const p = this._present(key, { required, nullable })
    if (p.skip) return this
    if (typeof p.value !== 'string') {
      this.errors[key] = `${label} must be text.`
      return this
    }
    const value = p.value.trim()
    if (value.length < min) this.errors[key] = `${label} is required.`
    else if (value.length > max) this.errors[key] = `${label} must be at most ${max} characters.`
    else this.out[key] = value
    return this
  }

  optionalString(key, opts = {}) {
    // Empty string means "no value" for optional text such as notes.
    if (this.body[key] === '') {
      this.out[key] = null
      return this
    }
    return this.string(key, { required: false, nullable: true, ...opts })
  }

  email(key = 'email') {
    const p = this._present(key)
    if (p.skip) return this
    const value = typeof p.value === 'string' ? p.value.trim().toLowerCase() : ''
    if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.errors[key] = 'Please enter a valid email address.'
    } else this.out[key] = value
    return this
  }

  money(key, { min = 0, max = MAX_MONEY, allowZero = true, required = true, nullable = false, label = 'Amount' } = {}) {
    const p = this._present(key, { required, nullable })
    if (p.skip) return this
    const raw = p.value
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN
    if (!Number.isFinite(n)) this.errors[key] = `${label} must be a number.`
    else if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) this.errors[key] = `${label} can have at most 2 decimal places.`
    else if (n < min || (!allowZero && n === 0)) {
      this.errors[key] = min >= 0 && !allowZero ? `${label} must be greater than 0.` : `${label} must be at least ${min}.`
    } else if (n > max) this.errors[key] = `${label} is too large.`
    else this.out[key] = Math.round(n * 100) / 100
    return this
  }

  number(key, { min, max, required = true, label = 'Value' } = {}) {
    const p = this._present(key, { required })
    if (p.skip) return this
    const n = typeof p.value === 'number' ? p.value : typeof p.value === 'string' && p.value.trim() !== '' ? Number(p.value) : NaN
    if (!Number.isFinite(n)) this.errors[key] = `${label} must be a number.`
    else if (min !== undefined && n < min) this.errors[key] = `${label} must be at least ${min}.`
    else if (max !== undefined && n > max) this.errors[key] = `${label} must be at most ${max}.`
    else this.out[key] = n
    return this
  }

  date(key, { required = true, nullable = false, label = 'Date' } = {}) {
    const p = this._present(key, { required, nullable })
    if (p.skip) return this
    const d = parseDay(p.value)
    if (!d) this.errors[key] = `${label} must be a valid date (YYYY-MM-DD).`
    else this.out[key] = d
    return this
  }

  oneOf(key, allowed, { required = true, label = 'Value', transform = (v) => v } = {}) {
    const p = this._present(key, { required })
    if (p.skip) return this
    const value = typeof p.value === 'string' ? transform(p.value.trim()) : null
    if (!allowed.includes(value)) this.errors[key] = `${label} must be one of: ${allowed.join(', ')}.`
    else this.out[key] = value
    return this
  }

  id(key, { required = true } = {}) {
    const p = this._present(key, { required })
    if (p.skip) return this
    if (typeof p.value !== 'string' || !ID_PATTERN.test(p.value)) this.errors[key] = 'Invalid id.'
    else this.out[key] = p.value
    return this
  }

  fail(key, message) {
    this.errors[key] = message
    return this
  }

  done() {
    if (Object.keys(this.errors).length > 0) {
      throw new ApiError(400, 'Please fix the highlighted fields.', { code: 'VALIDATION', fields: this.errors })
    }
    return this.out
  }
}
