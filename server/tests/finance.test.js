import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, registerUser, makeAccount, makeTx, today, lastMonthDay } from './helpers.js'

let s
before(async () => { s = await startServer() })
after(async () => { await s.close() })

test('accounts: CRUD, computed balance, duplicate name, delete protection', async () => {
  const { c } = await registerUser(s)
  const acc = await makeAccount(c, { name: 'HDFC', openingBalance: 1000 })
  assert.equal(acc.balance, 1000)
  assert.equal(acc.type, 'SAVINGS')

  assert.equal((await c.post('/accounts', { name: 'HDFC', type: 'CASH' })).status, 409)
  const bad = await c.post('/accounts', { name: '', type: 'BITCOIN', openingBalance: 'abc' })
  assert.equal(bad.status, 400)
  assert.ok(bad.error.fields.name && bad.error.fields.type && bad.error.fields.openingBalance)

  await makeTx(c, acc.id, { type: 'income', category: 'Salary', amount: 500, description: 'Pay' })
  await makeTx(c, acc.id, { amount: 200 })
  assert.equal((await c.get(`/accounts/${acc.id}`)).data.balance, 1300)

  const renamed = await c.put(`/accounts/${acc.id}`, { name: 'HDFC Bank', type: 'CURRENT' })
  assert.equal(renamed.data.name, 'HDFC Bank')
  assert.equal(renamed.data.balance, 1300)

  // "balance" = set the current balance (adjusts the opening balance underneath)
  const adjusted = await c.put(`/accounts/${acc.id}`, { balance: 2000 })
  assert.equal(adjusted.data.balance, 2000)
  assert.equal(adjusted.data.openingBalance, 1700)

  const blocked = await c.del(`/accounts/${acc.id}`)
  assert.equal(blocked.status, 409)
  assert.equal(blocked.error.code, 'ACCOUNT_HAS_TRANSACTIONS')
  assert.equal((await c.del(`/accounts/${acc.id}?force=true`)).status, 200)
  assert.equal((await c.get('/transactions')).data.length, 0)
  assert.equal((await c.get(`/accounts/${acc.id}`)).status, 404)

  const empty = await makeAccount(c, { name: 'Empty' })
  assert.equal((await c.del(`/accounts/${empty.id}`)).status, 200)
})

test('transactions: create/edit/delete keep balances right; validation', async () => {
  const { c } = await registerUser(s)
  const a = await makeAccount(c, { name: 'A', openingBalance: 0 })
  const b = await makeAccount(c, { name: 'B', openingBalance: 0 })
  const tx = await makeTx(c, a.id, { type: 'income', category: 'Salary', amount: 1000.5, description: 'Pay' })
  assert.equal(tx.accountName, 'A')
  assert.equal(tx.type, 'income')
  assert.equal((await c.get(`/accounts/${a.id}`)).data.balance, 1000.5)

  await c.put(`/transactions/${tx.id}`, { amount: 400 })
  assert.equal((await c.get(`/accounts/${a.id}`)).data.balance, 400)

  await c.put(`/transactions/${tx.id}`, { accountId: b.id })
  assert.equal((await c.get(`/accounts/${a.id}`)).data.balance, 0)
  assert.equal((await c.get(`/accounts/${b.id}`)).data.balance, 400)

  await c.put(`/transactions/${tx.id}`, { type: 'expense', category: 'Food' })
  assert.equal((await c.get(`/accounts/${b.id}`)).data.balance, -400)

  assert.equal((await c.del(`/transactions/${tx.id}`)).status, 200)
  assert.equal((await c.get(`/accounts/${b.id}`)).data.balance, 0)
  assert.equal((await c.get(`/transactions/${tx.id}`)).status, 404)

  const post = (over) => c.post('/transactions', { type: 'expense', amount: 10, category: 'Food', description: 'x', date: today(), accountId: a.id, ...over })
  assert.equal((await post({ amount: 0 })).status, 400)
  assert.equal((await post({ amount: -5 })).status, 400)
  assert.equal((await post({ amount: 1.234 })).status, 400)
  assert.equal((await post({ amount: 'abc' })).status, 400)
  assert.equal((await post({ date: '2026-02-31' })).status, 400)
  assert.equal((await post({ date: 'yesterday' })).status, 400)
  assert.equal((await post({ type: 'transfer' })).status, 400)
  assert.equal((await post({ category: 'Salary' })).status, 400) // income category on an expense
  assert.equal((await post({ accountId: 'does-not-exist' })).status, 400)
  assert.equal((await post({ description: '   ' })).status, 400)
  assert.equal((await post({ accountId: undefined })).status, 400)
  assert.equal((await post({})).status, 201)
})

test('transactions: search, filter, sort, paging', async () => {
  const { c } = await registerUser(s)
  const a = await makeAccount(c, { name: 'A' })
  const b = await makeAccount(c, { name: 'B' })
  await makeTx(c, a.id, { description: 'Swiggy dinner', amount: 300, category: 'Food', date: today() })
  await makeTx(c, a.id, { description: 'Bus pass', amount: 50, category: 'Transport', date: lastMonthDay('10') })
  await makeTx(c, b.id, { description: 'Freelance gig', type: 'income', category: 'Freelance', amount: 9000, date: today() })
  const q = async (qs) => (await c.get(`/transactions?${qs}`)).data

  assert.equal((await q('search=swiggy')).length, 1)
  assert.equal((await q('type=income')).length, 1)
  assert.equal((await q('category=Transport')).length, 1)
  assert.equal((await q(`accountId=${b.id}`)).length, 1)
  assert.equal((await q(`from=${today().slice(0, 7)}-01`)).length, 2)
  assert.equal((await q(`to=${lastMonthDay('30')}`)).length, 1)
  assert.deepEqual((await q('sort=amount&order=desc')).map((t) => t.amount), [9000, 300, 50])
  assert.deepEqual((await q('sort=amount&order=asc')).map((t) => t.amount), [50, 300, 9000])
  const page = await c.get('/transactions?limit=2&offset=1&sort=amount&order=desc')
  assert.deepEqual(page.data.map((t) => t.amount), [300, 50])
  assert.equal(page.body.meta.total, 3)
  assert.equal((await c.get('/transactions?type=bogus')).status, 400)
  assert.equal((await c.get('/transactions?from=abc')).status, 400)
  assert.equal((await c.get('/transactions?limit=0')).status, 400)
})

test('user isolation: B can never see or change A\'s data', async () => {
  const A = await registerUser(s, 'A')
  const B = await registerUser(s, 'B')
  const acc = await makeAccount(A.c, { name: 'A-only' })
  const tx = await makeTx(A.c, acc.id, { amount: 77 })
  const budget = (await A.c.post('/budgets', { category: 'Food', amount: 1000 })).data
  const goal = (await A.c.post('/goals', { name: 'Trip', targetAmount: 5000 })).data
  const loan = (await A.c.post('/loans', { name: 'L', principalAmount: 1000, interestRate: 10, emiAmount: 100, startDate: '2026-01-01', nextEmiDate: '2026-12-01' })).data
  const emi = (await A.c.get('/emis')).data[0]

  for (const p of ['/accounts', '/transactions', '/budgets', '/goals', '/loans', '/emis']) {
    assert.deepEqual((await B.c.get(p)).data, [], `${p} should be empty for B`)
  }
  const summary = (await B.c.get('/dashboard/summary')).data
  assert.equal(summary.totals.balance, 0)
  assert.equal(summary.totals.expenses, 0)
  assert.equal((await B.c.get('/dashboard/analytics')).data.accountBalances.length, 0)

  const targets = [
    ['accounts', acc.id, { name: 'hacked' }],
    ['transactions', tx.id, { amount: 1 }],
    ['budgets', budget.id, { amount: 1 }],
    ['goals', goal.id, { name: 'hacked' }],
    ['loans', loan.id, { name: 'hacked' }],
    ['emis', emi.id, { status: 'PAID' }],
  ]
  for (const [path, id, body] of targets) {
    // budgets/goals/emis/loans have no GET-by-id for goals/budgets/emis, so those 404 as unknown routes too
    assert.equal((await B.c.get(`/${path}/${id}`)).status, 404, `GET ${path}`)
    assert.equal((await B.c.put(`/${path}/${id}`, body)).status, 404, `PUT ${path}`)
    assert.equal((await B.c.del(`/${path}/${id}`)).status, 404, `DELETE ${path}`)
  }

  // B cannot attach data to A's records
  assert.equal((await B.c.post('/transactions', { type: 'expense', amount: 5, category: 'Food', description: 'x', date: today(), accountId: acc.id })).status, 400)
  assert.equal((await B.c.post('/emis', { loanId: loan.id, amount: 100, dueDate: '2027-01-01' })).status, 400)

  // A body-supplied userId is ignored: the record still belongs to the logged-in user.
  const sneaky = await B.c.post('/accounts', { name: 'Mine', type: 'CASH', userId: A.user.id })
  assert.equal(sneaky.status, 201)
  assert.equal(s.prisma._tables.account.find((x) => x.id === sneaky.data.id).userId, B.user.id)

  // Everything of A's is untouched.
  assert.equal((await A.c.get(`/accounts/${acc.id}`)).data.name, 'A-only')
  assert.equal((await A.c.get(`/transactions/${tx.id}`)).data.amount, 77)
  assert.equal((await A.c.get('/goals')).data.length, 1)
})

test('budgets: spent is computed from transactions (this month only)', async () => {
  const { c } = await registerUser(s)
  const a = await makeAccount(c)
  const b = (await c.post('/budgets', { category: 'Food', amount: 1000 })).data
  assert.equal(b.spent, 0)
  assert.equal((await c.post('/budgets', { category: 'Food', amount: 5 })).status, 409)
  assert.equal((await c.post('/budgets', { category: 'Salary', amount: 5 })).status, 400)
  assert.equal((await c.post('/budgets', { category: 'Bills', amount: 0 })).status, 400)

  const t1 = await makeTx(c, a.id, { amount: 300, category: 'Food' })
  await makeTx(c, a.id, { amount: 250.5, category: 'Food' })
  await makeTx(c, a.id, { amount: 999, category: 'Food', date: lastMonthDay() }) // other month: ignored
  await makeTx(c, a.id, { amount: 40, category: 'Bills' }) // other category: ignored
  let got = (await c.get('/budgets')).data.find((x) => x.id === b.id)
  assert.equal(got.spent, 550.5)
  assert.equal(got.remaining, 449.5)
  assert.equal(got.percentUsed, 55.1)

  await c.put(`/transactions/${t1.id}`, { amount: 100 })
  assert.equal((await c.get('/budgets')).data[0].spent, 350.5)
  await c.del(`/transactions/${t1.id}`)
  assert.equal((await c.get('/budgets')).data[0].spent, 250.5)
  const upd = await c.put(`/budgets/${b.id}`, { amount: 200 })
  assert.equal(upd.data.percentUsed, 125.3)
  assert.equal((await c.get(`/budgets?month=${lastMonthDay().slice(0, 7)}`)).data[0].spent, 999)
  assert.equal((await c.del(`/budgets/${b.id}`)).status, 200)
})

test('goals: CRUD and validation', async () => {
  const { c } = await registerUser(s)
  assert.equal((await c.post('/goals', { name: 'x', targetAmount: 0 })).status, 400)
  assert.equal((await c.post('/goals', { name: 'x', targetAmount: 100, deadline: '2026-13-40' })).status, 400)
  const g = (await c.post('/goals', { name: 'Laptop', targetAmount: 60000, currentAmount: 1000, deadline: '2027-01-31', monthlyContribution: 2000 })).data
  assert.equal(g.deadline, '2027-01-31')
  const up = (await c.put(`/goals/${g.id}`, { currentAmount: 5000, deadline: null })).data
  assert.equal(up.currentAmount, 5000)
  assert.equal(up.deadline, null)
  assert.equal(up.name, 'Laptop')
  assert.equal((await c.del(`/goals/${g.id}`)).status, 200)
  assert.deepEqual((await c.get('/goals')).data, [])
})

test('loans + EMIs: paying reduces principal, un-paying restores it, overdue is derived', async () => {
  const { c } = await registerUser(s)
  assert.equal((await c.post('/loans', { name: 'x', principalAmount: 1000, outstandingAmount: 2000, interestRate: 8, emiAmount: 100, startDate: '2026-01-01' })).status, 400)
  assert.equal((await c.post('/loans', { name: 'x', principalAmount: 1000, interestRate: 8, emiAmount: 100, startDate: '2026-01-01', endDate: '2025-01-01' })).status, 400)

  const loan = (await c.post('/loans', { name: 'Car', principalAmount: 120000, outstandingAmount: 120000, interestRate: 12, emiAmount: 10000, startDate: '2026-01-01', endDate: '2027-01-01', nextEmiDate: '2099-01-05' })).data
  assert.equal(loan.nextEmiDate, '2099-01-05')
  assert.equal(loan.status, 'ACTIVE')
  const emi = (await c.get(`/emis?loanId=${loan.id}`)).data[0]
  assert.equal(emi.status, 'PENDING')

  // interest = 120000 * 12% / 12 = 1200, so principal portion = 8800
  const paid = (await c.put(`/emis/${emi.id}`, { status: 'PAID' })).data
  assert.equal(paid.status, 'PAID')
  assert.equal(paid.principalPaid, 8800)
  let l = (await c.get(`/loans/${loan.id}`)).data
  assert.equal(l.outstandingAmount, 111200)
  assert.equal(l.paidPercent, 7)
  assert.equal(l.nextEmiDate, null)

  await c.put(`/emis/${emi.id}`, { status: 'PENDING' })
  l = (await c.get(`/loans/${loan.id}`)).data
  assert.equal(l.outstandingAmount, 120000)
  assert.equal(l.nextEmiDate, '2099-01-05')

  await c.put(`/emis/${emi.id}`, { status: 'PAID' })
  assert.equal((await c.del(`/emis/${emi.id}`)).status, 200) // deleting a paid EMI undoes it
  assert.equal((await c.get(`/loans/${loan.id}`)).data.outstandingAmount, 120000)

  const late = (await c.post('/emis', { loanId: loan.id, amount: 10000, dueDate: '2020-01-01' })).data
  assert.equal(late.status, 'OVERDUE')
  assert.equal((await c.post('/emis', { loanId: 'nope', amount: 1, dueDate: '2020-01-01' })).status, 400)

  const patched = (await c.put(`/loans/${loan.id}`, { outstandingAmount: 90000, status: 'CLOSED' })).data
  assert.equal(patched.outstandingAmount, 90000)
  assert.equal(patched.status, 'CLOSED')
  assert.equal((await c.del(`/loans/${loan.id}`)).status, 200)
  assert.equal((await c.get('/emis')).data.length, 0)
})

test('dashboard summary: zero-safe for new users, correct maths with data', async () => {
  const fresh = await registerUser(s)
  const zero = (await fresh.c.get('/dashboard/summary')).data
  assert.deepEqual(zero.totals, { balance: 0, income: 0, expenses: 0, savings: 0, savingsRate: 0 })
  assert.equal(zero.changes.income, null)
  const zeroA = (await fresh.c.get('/dashboard/analytics')).data
  assert.equal(zeroA.cashFlow.length, 6)
  assert.ok(zeroA.cashFlow.every((m) => m.income === 0 && m.expenses === 0))
  assert.deepEqual(zeroA.expenseBreakdown, [])

  const { c } = await registerUser(s)
  const a = await makeAccount(c, { name: 'Bank', openingBalance: 5000 })
  const card = await makeAccount(c, { name: 'Card', type: 'CREDIT_CARD', openingBalance: -1000 })
  await makeTx(c, a.id, { type: 'income', category: 'Salary', amount: 40000, description: 'Pay' })
  await makeTx(c, a.id, { amount: 6000, category: 'Food' })
  await makeTx(c, card.id, { amount: 4000, category: 'Shopping' })
  await makeTx(c, a.id, { type: 'income', category: 'Salary', amount: 20000, description: 'Old pay', date: lastMonthDay() })
  await makeTx(c, a.id, { amount: 10000, category: 'Bills', date: lastMonthDay() })
  await c.post('/loans', { name: 'L', principalAmount: 50000, interestRate: 10, emiAmount: 2500, startDate: '2026-01-01', nextEmiDate: '2099-05-01' })

  const sm = (await c.get('/dashboard/summary')).data
  assert.equal(sm.totals.income, 60000)
  assert.equal(sm.totals.expenses, 20000)
  assert.equal(sm.totals.savings, 40000)
  assert.equal(sm.totals.savingsRate, 66.7)
  // balance = (5000 + 60000 - 16000) + (-1000 - 4000) = 44000
  assert.equal(sm.totals.balance, 44000)
  assert.deepEqual(sm.thisMonth, { income: 40000, expenses: 10000, savings: 30000 })
  assert.deepEqual(sm.lastMonth, { income: 20000, expenses: 10000, savings: 10000 })
  assert.equal(sm.changes.income, 100)
  assert.equal(sm.changes.expenses, 0)
  assert.equal(sm.changes.savings, 200)
  assert.equal(sm.loans.totalOutstanding, 50000)
  assert.equal(sm.loans.monthlyEmi, 2500)
  assert.equal(sm.upcomingEmis[0].dueDate, '2099-05-01')

  const an = (await c.get('/dashboard/analytics?months=3')).data
  assert.equal(an.cashFlow.length, 3)
  assert.deepEqual(an.cashFlow[2].income, 40000)
  assert.deepEqual(an.cashFlow[1].expenses, 10000)
  assert.deepEqual(an.expenseBreakdown, [
    { category: 'Food', value: 6000, percent: 60 },
    { category: 'Shopping', value: 4000, percent: 40 },
  ])
  assert.equal(an.savingsTrend[2].savings, 30000)
  assert.equal(an.accountBalances.length, 2)
  assert.equal((await c.get('/dashboard/analytics?months=99')).status, 400)

  // charts follow edits and deletes
  const list = (await c.get('/transactions?category=Food')).data
  await c.del(`/transactions/${list[0].id}`)
  assert.equal((await c.get('/dashboard/summary')).data.thisMonth.expenses, 4000)
})
