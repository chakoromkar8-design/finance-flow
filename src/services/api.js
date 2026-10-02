// The ONLY place the frontend talks to the backend.
// - Base URL comes from VITE_API_URL (see .env.local.example).
// - `credentials: 'include'` makes the browser send the HTTP-only login cookie.
// - Server field names are converted to the names the existing components use
//   (see the "normalizers" section), so the UI did not need to be redesigned.

const API_BASE = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, code, fields } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields || {}
  }
}

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', { code: 'NETWORK' })
  }

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    // A 401 on a normal data request means the session ended: tell the app to sign out.
    if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('ff:unauthorized'))
    const err = json?.error
    throw new ApiError(err?.message || `Request failed (${res.status}).`, { status: res.status, code: err?.code, fields: err?.fields })
  }
  return json?.data
}

// ---------- normalizers: server shape -> UI shape ----------
export const ACCOUNT_TYPE_LABELS = {
  SAVINGS: 'Savings Account',
  CURRENT: 'Current Account',
  CASH: 'Cash Wallet',
  CREDIT_CARD: 'Credit Card',
  INVESTMENT: 'Investment Account',
  OTHER: 'Other',
}
const ACCOUNT_TYPE_CODES = Object.fromEntries(Object.entries(ACCOUNT_TYPE_LABELS).map(([code, label]) => [label, code]))
const ACCOUNT_ICONS = { CASH: 'wallet', CREDIT_CARD: 'credit-card' }

const fromAccount = (a) => ({
  id: a.id,
  name: a.name,
  typeCode: a.type,
  type: ACCOUNT_TYPE_LABELS[a.type] || a.type,
  institution: a.institution,
  balance: a.balance,
  openingBalance: a.openingBalance,
  icon: ACCOUNT_ICONS[a.type] || 'landmark',
  updatedAt: a.lastActivity || String(a.updatedAt).slice(0, 10),
})

const fromTransaction = (t) => ({
  id: t.id,
  name: t.description,
  description: t.description,
  category: t.category,
  date: t.date,
  account: t.accountName,
  accountId: t.accountId,
  type: t.type,
  amount: t.amount,
  notes: t.notes || '',
})

const fromBudget = (b) => ({ id: b.id, category: b.category, limit: b.amount, spent: b.spent, remaining: b.remaining, percentUsed: b.percentUsed })

const fromGoal = (g) => ({
  id: g.id,
  name: g.name,
  target: g.targetAmount,
  saved: g.currentAmount,
  targetDate: g.deadline,
  monthlyContribution: g.monthlyContribution,
})

const fromLoan = (l) => ({
  id: l.id,
  name: l.name,
  principal: l.principalAmount,
  outstanding: l.outstandingAmount,
  interestRate: l.interestRate,
  emi: l.emiAmount,
  nextPayment: l.nextEmiDate,
  nextEmiId: l.nextEmiId,
  startDate: l.startDate,
  endDate: l.endDate,
  status: l.status,
  paidPercent: l.paidPercent,
})

// ---------- UI shape -> server shape ----------
const toTransactionBody = (t) => ({
  type: t.type,
  amount: t.amount,
  category: t.category,
  description: t.name,
  notes: t.notes || '',
  date: t.date,
  accountId: t.accountId,
})

// ---------- auth ----------
export const register = (name, email, password) => request('POST', '/auth/register', { name, email, password }).then((d) => d.user)
export const login = (email, password) => request('POST', '/auth/login', { email, password }).then((d) => d.user)
export const logout = () => request('POST', '/auth/logout')
export const fetchMe = () => request('GET', '/auth/me').then((d) => d.user)

// ---------- accounts ----------
export const getAccounts = () => request('GET', '/accounts').then((rows) => rows.map(fromAccount))
export const createAccount = (a) =>
  request('POST', '/accounts', { name: a.name, type: ACCOUNT_TYPE_CODES[a.type] || a.type, openingBalance: a.balance }).then(fromAccount)
export const updateAccount = (id, a) =>
  request('PUT', `/accounts/${id}`, { name: a.name, type: ACCOUNT_TYPE_CODES[a.type] || a.type, balance: a.balance }).then(fromAccount)
export const deleteAccount = (id, { force = false } = {}) => request('DELETE', `/accounts/${id}${force ? '?force=true' : ''}`)

// ---------- transactions ----------
export const getTransactions = () => request('GET', '/transactions?limit=5000').then((rows) => rows.map(fromTransaction))
export const createTransaction = (t) => request('POST', '/transactions', toTransactionBody(t)).then(fromTransaction)
export const updateTransaction = (id, t) => request('PUT', `/transactions/${id}`, toTransactionBody(t)).then(fromTransaction)
export const deleteTransaction = (id) => request('DELETE', `/transactions/${id}`)

// ---------- budgets ----------
export const getBudgets = () => request('GET', '/budgets').then((rows) => rows.map(fromBudget))
export const createBudget = (b) => request('POST', '/budgets', { category: b.category, amount: b.limit }).then(fromBudget)
export const updateBudget = (id, b) => request('PUT', `/budgets/${id}`, { category: b.category, amount: b.limit }).then(fromBudget)
export const deleteBudget = (id) => request('DELETE', `/budgets/${id}`)

// ---------- goals ----------
const toGoalBody = (g) => ({
  name: g.name,
  targetAmount: g.target,
  currentAmount: g.saved ?? 0,
  monthlyContribution: g.monthlyContribution ?? 0,
  deadline: g.targetDate || null,
})
export const getGoals = () => request('GET', '/goals').then((rows) => rows.map(fromGoal))
export const createGoal = (g) => request('POST', '/goals', toGoalBody(g)).then(fromGoal)
export const updateGoal = (id, g) => request('PUT', `/goals/${id}`, toGoalBody(g)).then(fromGoal)
export const deleteGoal = (id) => request('DELETE', `/goals/${id}`)

// ---------- loans ----------
export const getLoans = () => request('GET', '/loans').then((rows) => rows.map(fromLoan))
export const createLoan = (l) =>
  request('POST', '/loans', {
    name: l.name,
    principalAmount: l.principalAmount || l.principal,
    outstandingAmount: l.outstandingAmount || (l.outstanding === '' || l.outstanding == null ? undefined : l.outstanding),
    interestRate: l.interestRate,
    emiAmount: l.emiAmount || l.emi,
    startDate: l.startDate,
    endDate: l.endDate || null,
    nextEmiDate: l.nextPayment || null,
  }).then(fromLoan)

export const updateLoan = (id, l) =>
  request('PUT', `/loans/${id}`, {
    name: l.name,
    principalAmount: l.principalAmount || l.principal,
    outstandingAmount: l.outstandingAmount || l.outstanding,
    interestRate: l.interestRate,
    emiAmount: l.emiAmount || l.emi,
    startDate: l.startDate,
    endDate: l.endDate || null,
  }).then(fromLoan)
  
export const deleteLoan = (id) => request('DELETE', `/loans/${id}`)

// Marks the loan's next EMI as paid. The server lowers the outstanding principal.
// If the loan is still active afterwards we schedule the following month's EMI,
// so "Next payment" keeps showing a date.
export async function payNextEmi(loan) {
  const paid = await request('PUT', `/emis/${loan.nextEmiId}`, { status: 'PAID' })
  const fresh = await request('GET', `/loans/${loan.id}`)
  if (fresh.status === 'ACTIVE' && loan.nextPayment) {
    const next = new Date(`${loan.nextPayment}T00:00:00Z`)
    next.setUTCMonth(next.getUTCMonth() + 1)
    await request('POST', '/emis', { loanId: loan.id, amount: loan.emi, dueDate: next.toISOString().slice(0, 10) })
  }
  return paid
}

// ---------- dashboard ----------
export const getDashboardSummary = () => request('GET', '/dashboard/summary')
export const getDashboardAnalytics = (months = 6) => request('GET', `/dashboard/analytics?months=${months}`)

// Loads everything the app needs in parallel.
export async function fetchFinanceData() {
  const [accounts, transactions, budgets, goals, loans, summary, analytics] = await Promise.all([
    getAccounts(),
    getTransactions(),
    getBudgets(),
    getGoals(),
    getLoans(),
    getDashboardSummary(),
    getDashboardAnalytics(6),
  ])
  return { accounts, transactions, budgets, goals, loans, summary, analytics }
}
