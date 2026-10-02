// Dates like "2026-09-24" are calendar days. In the database they are stored as
// DATE columns, and in JS we keep them as UTC-midnight Date objects.
export function parseDay(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null
  const d = new Date(`${str}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  // Rejects impossible dates such as 2026-02-31 (JS would roll them over).
  if (d.toISOString().slice(0, 10) !== str) return null
  const year = d.getUTCFullYear()
  if (year < 1970 || year > 2100) return null
  return d
}

export const dayString = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null)

// "Now" shifted by the configured timezone offset (India = 330 minutes), so the
// month boundaries match the user's calendar instead of UTC.
export function localNow(config, now = Date.now()) {
  return new Date(now + (config.tzOffsetMinutes || 0) * 60000)
}

export const todayString = (config, now) => localNow(config, now).toISOString().slice(0, 10)
export const monthKey = (config, now) => todayString(config, now).slice(0, 7)

export function isMonthKey(str) {
  return typeof str === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(str)
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const monthLabel = (key) => MONTHS[Number(key.slice(5, 7)) - 1]
