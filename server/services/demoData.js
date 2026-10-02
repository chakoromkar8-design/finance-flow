// Sample data for a DEMO user only. It is created by `npm run db:seed` and never
// runs automatically, so real users never see it. The demo user has its own
// email (demo@financeflow.local); deleting that user removes all of its data.
import bcrypt from 'bcryptjs'
import { shiftMonth } from '../utils/dates.js'

export const DEMO_EMAIL = 'demo@financeflow.local'

export async function seedDemoUser(prisma, { password, bcryptRounds = 12, now = new Date() } = {}) {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (existing) return { created: false, userId: existing.id }

  const thisMonth = now.toISOString().slice(0, 7)
  const lastMonth = shiftMonth(thisMonth, -1)
  const day = (month, d) => new Date(`${month}-${String(d).padStart(2, '0')}T00:00:00.000Z`)
  // Never seed a date in the future of "today" for the current month.
  const todayDay = now.getUTCDate()
  const cur = (d) => day(thisMonth, Math.min(d, todayDay))

  const user = await prisma.user.create({
    data: { name: 'Demo User', email: DEMO_EMAIL, passwordHash: await bcrypt.hash(password, bcryptRounds) },
  })
  const uid = user.id

  const mk = (name, type, openingBalance, institution = null) =>
    prisma.account.create({ data: { userId: uid, name, type, openingBalance, institution } })
  const hdfc = await mk('HDFC Bank', 'SAVINGS', 20000, 'HDFC')
  const icici = await mk('ICICI Bank', 'SAVINGS', 10000, 'ICICI')
  const cash = await mk('Cash', 'CASH', 3000)
  const card = await mk('Credit Card', 'CREDIT_CARD', 0, 'HDFC Regalia')

  const tx = (account, type, amount, category, description, date) =>
    prisma.transaction.create({ data: { userId: uid, accountId: account.id, type, amount, category, description, date } })

  for (const m of [lastMonth, thisMonth]) {
    const d = m === thisMonth ? cur : (n) => day(m, n)
    await tx(hdfc, 'INCOME', 45000, 'Salary', 'Salary', d(1))
    await tx(icici, 'INCOME', 8000, 'Freelance', 'Freelance project', d(15))
    await tx(hdfc, 'EXPENSE', 480, 'Food', 'Swiggy order', d(4))
    await tx(hdfc, 'EXPENSE', 320, 'Food', 'Zomato order', d(9))
    await tx(card, 'EXPENSE', 2199, 'Shopping', 'Myntra', d(6))
    await tx(card, 'EXPENSE', 649, 'Entertainment', 'Netflix', d(8))
    await tx(icici, 'EXPENSE', 1450, 'Bills', 'Electricity bill', d(10))
    await tx(cash, 'EXPENSE', 500, 'Transport', 'Metro recharge', d(3))
    await tx(cash, 'EXPENSE', 540, 'Healthcare', 'Pharmacy', d(12))
  }

  for (const [category, amount] of [['Food', 5000], ['Shopping', 3000], ['Entertainment', 2000], ['Transport', 2500], ['Bills', 4500]]) {
    await prisma.budget.create({ data: { userId: uid, category, amount } })
  }

  await prisma.goal.create({ data: { userId: uid, name: 'MacBook Air', targetAmount: 120000, currentAmount: 72000, monthlyContribution: 8000, deadline: day(shiftMonth(thisMonth, 4), 15) } })
  await prisma.goal.create({ data: { userId: uid, name: 'Emergency Fund', targetAmount: 100000, currentAmount: 45000, monthlyContribution: 5000, deadline: day(shiftMonth(thisMonth, 6), 1) } })

  const loan = await prisma.loan.create({
    data: { userId: uid, name: 'Education Loan', principalAmount: 300000, outstandingAmount: 210000, interestRate: 8.5, emiAmount: 8500, startDate: day(shiftMonth(thisMonth, -24), 1), endDate: day(shiftMonth(thisMonth, 30), 1) },
  })
  await prisma.emi.create({ data: { userId: uid, loanId: loan.id, amount: 8500, dueDate: day(shiftMonth(thisMonth, 1), 15) } })

  return { created: true, userId: uid }
}
