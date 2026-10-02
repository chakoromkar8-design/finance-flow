import { toCents, fromCents } from '../utils/money.js'
import { dayString, monthKey, shiftMonth, monthLabel, todayString } from '../utils/dates.js'
import { computeBalances } from './balances.js'
import { spentByCategory } from './budgets.js'
import { serializeEmi } from './loans.js'

const pctChange = (current, previous) => (previous === 0 ? null : Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10)

function monthTotals(transactions, key) {
  let income = 0
  let expenses = 0
  for (const t of transactions) {
    if (!dayString(t.date).startsWith(key)) continue
    if (t.type === 'INCOME') income += toCents(t.amount)
    else expenses += toCents(t.amount)
  }
  return { income, expenses, savings: income - expenses }
}

const money = ({ income, expenses, savings }) => ({ income: fromCents(income), expenses: fromCents(expenses), savings: fromCents(savings) })

async function loadAll(prisma, userId) {
  const [accounts, transactions, budgets, loans, emis] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.loan.findMany({ where: { userId } }),
    prisma.emi.findMany({ where: { userId, status: 'PENDING' } }),
  ])
  return { accounts, transactions, budgets, loans, emis }
}

export async function buildSummary(prisma, userId, config) {
  const { accounts, transactions, loans, emis } = await loadAll(prisma, userId)
  const balances = computeBalances(accounts, transactions)

  let income = 0
  let expenses = 0
  for (const t of transactions) {
    if (t.type === 'INCOME') income += toCents(t.amount)
    else expenses += toCents(t.amount)
  }
  const savings = income - expenses

  const thisKey = monthKey(config)
  const lastKey = shiftMonth(thisKey, -1)
  const thisMonth = monthTotals(transactions, thisKey)
  const lastMonth = monthTotals(transactions, lastKey)

  const activeLoans = loans.filter((l) => l.status === 'ACTIVE')
  const loanNames = new Map(loans.map((l) => [l.id, l.name]))
  const upcoming = emis
    .filter((e) => loanNames.has(e.loanId))
    .sort((a, b) => dayString(a.dueDate).localeCompare(dayString(b.dueDate)))
    .slice(0, 5)
    .map((e) => serializeEmi(e, loanNames.get(e.loanId), config))

  return {
    totals: {
      balance: fromCents(balances.reduce((s, a) => s + a.balanceCents, 0)),
      income: fromCents(income),
      expenses: fromCents(expenses),
      savings: fromCents(savings),
      savingsRate: income > 0 ? Math.round((savings / income) * 1000) / 10 : 0,
    },
    thisMonth: money(thisMonth),
    lastMonth: money(lastMonth),
    // Month-over-month change in percent; null when last month had nothing to compare with.
    changes: {
      income: pctChange(thisMonth.income, lastMonth.income),
      expenses: pctChange(thisMonth.expenses, lastMonth.expenses),
      savings: pctChange(thisMonth.savings, lastMonth.savings),
    },
    loans: {
      activeCount: activeLoans.length,
      totalOutstanding: fromCents(activeLoans.reduce((s, l) => s + toCents(l.outstandingAmount), 0)),
      monthlyEmi: fromCents(activeLoans.reduce((s, l) => s + toCents(l.emiAmount), 0)),
    },
    upcomingEmis: upcoming,
    today: todayString(config),
  }
}

export async function buildAnalytics(prisma, userId, config, months = 6) {
  const { accounts, transactions, budgets } = await loadAll(prisma, userId)
  const balances = computeBalances(accounts, transactions)
  const thisKey = monthKey(config)

  const keys = []
  for (let i = months - 1; i >= 0; i -= 1) keys.push(shiftMonth(thisKey, -i))

  const cashFlow = []
  const monthlySpending = []
  const savingsTrend = []
  for (const key of keys) {
    const t = monthTotals(transactions, key)
    const label = monthLabel(key)
    cashFlow.push({ key, month: label, income: fromCents(t.income), expenses: fromCents(t.expenses) })
    monthlySpending.push({ key, month: label, amount: fromCents(t.expenses) })
    savingsTrend.push({ key, month: label, savings: fromCents(t.savings) })
  }

  // Expense breakdown for the current month.
  const byCategory = new Map()
  for (const t of transactions) {
    if (t.type !== 'EXPENSE' || !dayString(t.date).startsWith(thisKey)) continue
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + toCents(t.amount))
  }
  const totalExpense = [...byCategory.values()].reduce((s, v) => s + v, 0)
  const expenseBreakdown = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, cents]) => ({
      category,
      value: fromCents(cents),
      percent: totalExpense > 0 ? Math.round((cents / totalExpense) * 100) : 0,
    }))

  const spent = spentByCategory(transactions, thisKey)
  const budgetPerformance = budgets.map((b) => {
    const limit = toCents(b.amount)
    const s = spent.get(b.category) ?? 0
    return { category: b.category, limit: fromCents(limit), spent: fromCents(s), percentUsed: limit > 0 ? Math.round((s / limit) * 1000) / 10 : 0 }
  })

  return {
    months,
    month: thisKey,
    cashFlow,
    monthlySpending,
    savingsTrend,
    expenseBreakdown,
    accountBalances: balances.map((a) => ({ id: a.id, name: a.name, balance: fromCents(a.balanceCents) })),
    budgetPerformance,
  }
}
