// Money is kept as whole cents while we add things up, so 0.1 + 0.2 style
// floating point errors never leak into balances.
export const toCents = (value) => Math.round(Number(value ?? 0) * 100)
export const fromCents = (cents) => Math.round(cents) / 100

// Prisma returns Decimal objects (or strings). Turn them into plain numbers for JSON.
export const num = (value) => (value === null || value === undefined ? null : Number(value))
