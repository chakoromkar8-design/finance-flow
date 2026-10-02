import { toCents, fromCents, num } from '../utils/money.js'
import { dayString } from '../utils/dates.js'

// "Spent" is never stored. It is the sum of this month's expense transactions
// in the budget's category.
export function spentByCategory(transactions, month) {
  const cents = new Map()
  for (const t of transactions) {
    if (t.type !== 'EXPENSE') continue
    if (!dayString(t.date).startsWith(month)) continue
    cents.set(t.category, (cents.get(t.category) ?? 0) + toCents(t.amount))
  }
  return cents
}

export function serializeBudget(budget, spentCents = 0) {
  const limitCents = toCents(budget.amount)
  return {
    id: budget.id,
    category: budget.category,
    amount: num(budget.amount),
    spent: fromCents(spentCents),
    remaining: fromCents(limitCents - spentCents),
    percentUsed: limitCents > 0 ? Math.round((spentCents / limitCents) * 1000) / 10 : 0,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  }
}

export async function budgetWithSpent(prisma, userId, budget, month) {
  const transactions = await prisma.transaction.findMany({ where: { userId, category: budget.category, type: 'EXPENSE' } })
  return serializeBudget(budget, spentByCategory(transactions, month).get(budget.category) ?? 0)
}
