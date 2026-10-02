import { toCents, fromCents, num } from '../utils/money.js'
import { dayString } from '../utils/dates.js'

// An account's live balance is:  openingBalance + income - expenses.
// It is computed from the transactions every time, so editing or deleting a
// transaction can never leave a stale balance behind.
export function computeBalances(accounts, transactions) {
  const net = new Map() // accountId -> cents
  const last = new Map() // accountId -> latest transaction day
  for (const t of transactions) {
    const cents = toCents(t.amount) * (t.type === 'INCOME' ? 1 : -1)
    net.set(t.accountId, (net.get(t.accountId) ?? 0) + cents)
    const day = dayString(t.date)
    if (!last.has(t.accountId) || day > last.get(t.accountId)) last.set(t.accountId, day)
  }
  return accounts.map((a) => ({
    ...a,
    netCents: net.get(a.id) ?? 0,
    balanceCents: toCents(a.openingBalance) + (net.get(a.id) ?? 0),
    lastActivity: last.get(a.id) ?? null,
  }))
}

export function serializeAccount(a) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    institution: a.institution ?? null,
    openingBalance: num(a.openingBalance),
    balance: fromCents(a.balanceCents),
    lastActivity: a.lastActivity,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }
}

export async function listAccountsWithBalances(prisma, userId) {
  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.transaction.findMany({ where: { userId } }),
  ])
  return computeBalances(accounts, transactions)
}

export async function getAccountWithBalance(prisma, userId, accountId) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
  if (!account) return null
  const transactions = await prisma.transaction.findMany({ where: { userId, accountId } })
  return computeBalances([account], transactions)[0]
}
