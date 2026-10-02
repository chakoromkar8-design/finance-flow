export function formatCurrency(value, { showSign = false } = {}) {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  const sign = value < 0 ? '-' : showSign && value > 0 ? '+' : ''
  return `${sign}₹${formatted}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
